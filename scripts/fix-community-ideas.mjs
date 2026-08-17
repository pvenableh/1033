#!/usr/bin/env node

/**
 * Community Ideas Repair Script
 *
 * Fixes three defects in the deployed ideas/polls setup. Targeted on purpose —
 * do NOT re-run scripts/setup-ideas.mjs to fix these: it drops collections that
 * have no rows, and `ideas` and `polls` are currently empty.
 *
 *   1. Missing o2m alias fields. setup-ideas.mjs declares `ideas.images` and
 *      `polls.options` but its field loop skips every `type: 'alias'` entry, so
 *      neither was created. The relations point at them (one_field is set), but
 *      without the field record Directus refuses to query them — which broke
 *      useIdeas().listPublished() and usePolls().listVisible() outright.
 *
 *   2. No public-role read. Both composables fetch with `requireAuth: false`,
 *      which routes to the UNAUTHENTICATED Directus client — not the admin
 *      token, despite the comment in useIdeas.ts. With no public permission the
 *      feed 400'd on every load.
 *
 *      Read is granted with an explicit field list and a status filter, so the
 *      database enforces published-only and never exposes submitter emails
 *      (`email`, `person_id`) regardless of what the client asks for.
 *
 *   3. Category choices still listed Rooftop and Pool Deck.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   node scripts/fix-community-ideas.mjs
 *   (or: pnpm fix:community-ideas)
 */

import {
	createDirectus,
	rest,
	authentication,
	createField,
	updateField,
	readFields,
	createPermission,
	updatePermission,
	readPermissions,
} from '@directus/sdk';
import * as readline from 'readline';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Keep in sync with IDEA_CATEGORIES in composables/useIdeas.ts
const IDEA_CATEGORIES = [
	'Lobby',
	'Gym / Fitness',
	'Co-work Space',
	'Bike / Storage',
	'Lounge / Social',
	'Other',
];

const POLICIES = {
	PUBLIC: 'abf8a154-5b1c-4a46-ac9c-7300570f4f17',
};

// Missing o2m alias fields, keyed by collection.
const ALIAS_FIELDS = [
	{
		collection: 'ideas',
		field: 'images',
		meta: {
			interface: 'list-o2m',
			special: ['o2m'],
			display: 'related-values',
			width: 'full',
		},
	},
	{
		collection: 'polls',
		field: 'options',
		meta: {
			interface: 'list-o2m',
			special: ['o2m'],
			display: 'related-values',
			width: 'full',
		},
	},
];

// Public read. Field lists are explicit allow-lists — `email`, `person_id`,
// `unit`, and `user_created` are deliberately absent from `ideas`.
const PUBLIC_READ = [
	{
		collection: 'ideas',
		fields: [
			'id',
			'status',
			'title',
			'category',
			'description',
			'name',
			'unit_number',
			'verified_resident',
			'date_created',
			'images',
		],
		permissions: { status: { _eq: 'published' } },
	},
	{
		collection: 'ideas_files',
		fields: ['id', 'sort', 'ideas_id', 'directus_files_id'],
		permissions: {},
	},
	{
		collection: 'polls',
		fields: [
			'id',
			'status',
			'question',
			'description',
			'category',
			'closes_at',
			'sort',
			'date_created',
			'options',
		],
		// Drafts stay invisible; open and closed polls are public.
		permissions: { status: { _in: ['open', 'closed'] } },
	},
	{
		collection: 'poll_options',
		fields: ['id', 'sort', 'label', 'poll'],
		permissions: {},
	},
];

function prompt(question) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) =>
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer);
		})
	);
}

async function main() {
	console.log('\n💡 Community Ideas Repair\n');

	const directusUrl = process.env.DIRECTUS_URL || (await prompt('Directus URL: '));
	const email = process.env.DIRECTUS_EMAIL || (await prompt('Admin Email: '));
	const password = process.env.DIRECTUS_PASSWORD || (await prompt('Admin Password: '));

	const client = createDirectus(directusUrl).with(rest()).with(authentication());

	try {
		await client.login({ email, password });
		console.log('✅ Authenticated\n');
	} catch (error) {
		console.error('❌ Authentication failed:', error?.errors?.[0]?.message || error?.message);
		process.exit(1);
	}

	// ---- 1. Missing alias fields -------------------------------------------
	console.log('📋 Creating missing o2m alias fields...');
	// Attempt the create and let Directus be the judge of whether it exists.
	// readFields() reports alias names that aren't actually queryable fields, so
	// a pre-check here produces false "already exists" skips.
	for (const { collection, field, meta } of ALIAS_FIELDS) {
		try {
			await client.request(createField(collection, { field, type: 'alias', meta }));
			console.log(`   ✅ ${collection}.${field}`);
			await delay(200);
		} catch (error) {
			const msg = error?.errors?.[0]?.message || error?.message || '';
			console.log(
				/exist|duplicate/i.test(msg)
					? `   ⏭️  ${collection}.${field} (exists)`
					: `   ❌ ${collection}.${field}: ${msg}`
			);
		}
	}

	// ---- 2. Category choices -----------------------------------------------
	console.log('\n📋 Updating category choices (removing Rooftop / Pool Deck)...');
	const choices = IDEA_CATEGORIES.map((c) => ({ text: c, value: c }));
	for (const collection of ['ideas', 'polls']) {
		try {
			await client.request(
				updateField(collection, 'category', { meta: { options: { choices } } })
			);
			console.log(`   ✅ ${collection}.category → ${IDEA_CATEGORIES.join(', ')}`);
			await delay(200);
		} catch (error) {
			console.log(`   ❌ ${collection}.category:`, error?.errors?.[0]?.message || error?.message);
		}
	}

	// ---- 3. Public read permissions ----------------------------------------
	console.log('\n📋 Granting public read (scoped fields + status filter)...');
	let existingPerms = [];
	try {
		existingPerms = await client.request(readPermissions({ limit: -1 }));
	} catch {
		// creation below is guarded individually
	}

	for (const { collection, fields, permissions } of PUBLIC_READ) {
		const already = existingPerms.find(
			(p) => p.policy === POLICIES.PUBLIC && p.collection === collection && p.action === 'read'
		);
		try {
			if (already) {
				// Re-apply rather than skip: an existing grant may have the wrong
				// field list, which is exactly the thing that would leak.
				await client.request(updatePermission(already.id, { fields, permissions }));
				console.log(`   ♻️  ${collection} (updated)`);
			} else {
				await client.request(
					createPermission({
						policy: POLICIES.PUBLIC,
						collection,
						action: 'read',
						fields,
						permissions,
						validation: {},
					})
				);
				console.log(`   ✅ ${collection}`);
			}
			await delay(150);
		} catch (error) {
			console.log(`   ❌ ${collection}:`, error?.errors?.[0]?.message || error?.message);
		}
	}

	console.log('\n✨ Done. Regenerate types with: pnpm generate:types\n');
	process.exit(0);
}

main().catch((error) => {
	console.error('\n❌ Repair failed:', error);
	process.exit(1);
});
