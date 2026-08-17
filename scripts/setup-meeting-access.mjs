#!/usr/bin/env node

/**
 * Board Meeting Access Setup Script
 *
 * Creates the `site_access` singleton that holds the passphrase gating the
 * meeting records on /board-meetings.
 *
 * Deliberately a NEW collection rather than a field on `corporation`: that
 * singleton is readable by the Directus public role, so a passphrase stored
 * there would be world-readable. `site_access` gets no public permission at
 * all — only the server's admin token and the board can read it.
 *
 * Fields:
 *   meetings_passphrase - the shared phrase residents type to unlock records
 *   meetings_hint       - optional nudge shown on the lock screen
 *                         ("printed on the lobby notice")
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   node scripts/setup-meeting-access.mjs
 *   (or: pnpm setup:meeting-access)
 */

import {
	createDirectus,
	rest,
	authentication,
	createCollection,
	createField,
	readCollections,
	readFields,
	createPermission,
	readPermissions,
} from '@directus/sdk';
import * as readline from 'readline';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const COLLECTION = 'site_access';

const POLICIES = {
	BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
};

const FIELDS = [
	{
		field: 'meetings_passphrase',
		type: 'string',
		schema: { is_nullable: true },
		meta: {
			interface: 'input',
			options: { placeholder: 'e.g. flamingo park', iconLeft: 'key' },
			width: 'full',
			note: 'Unlocks agendas, minutes, presentations, announcements and recordings on /board-meetings. Case- and space-insensitive. Leave empty to make everything public.',
		},
	},
	{
		field: 'meetings_hint',
		type: 'string',
		schema: { is_nullable: true },
		meta: {
			interface: 'input',
			options: { placeholder: 'e.g. Printed on the lobby notice' },
			width: 'full',
			note: 'Shown on the lock screen. Never include the passphrase itself.',
		},
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
	console.log('\n🔒 Board Meeting Access Setup\n');

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

	// ---- Collection ---------------------------------------------------------
	console.log(`📋 Creating "${COLLECTION}" singleton...`);
	let collections = [];
	try {
		collections = (await client.request(readCollections())).map((c) => c.collection);
	} catch {
		// guarded below
	}

	if (collections.includes(COLLECTION)) {
		console.log(`   ⏭️  ${COLLECTION} (exists)`);
	} else {
		try {
			await client.request(
				createCollection({
					collection: COLLECTION,
					meta: {
						collection: COLLECTION,
						icon: 'lock',
						note: 'Access phrases for public pages',
						singleton: true,
						hidden: false,
					},
					schema: { name: COLLECTION },
					fields: [
						{
							field: 'id',
							type: 'integer',
							meta: { hidden: true },
							schema: { is_primary_key: true, has_auto_increment: true },
						},
					],
				})
			);
			console.log(`   ✅ ${COLLECTION}`);
			await delay(400);
		} catch (error) {
			console.log(`   ❌ ${COLLECTION}:`, error?.errors?.[0]?.message || error?.message);
		}
	}

	// ---- Fields -------------------------------------------------------------
	console.log('\n📋 Adding fields...');
	let existing = [];
	try {
		existing = (await client.request(readFields(COLLECTION))).map((f) => f.field);
	} catch {
		// guarded below
	}

	for (const field of FIELDS) {
		if (existing.includes(field.field)) {
			console.log(`   ⏭️  ${field.field} (exists)`);
			continue;
		}
		try {
			await client.request(createField(COLLECTION, field));
			console.log(`   ✅ ${field.field}`);
			await delay(200);
		} catch (error) {
			console.log(`   ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
		}
	}

	// ---- Permissions --------------------------------------------------------
	// Board members can read and rotate the phrase. NO public policy entry —
	// the passphrase must never be readable by an unauthenticated request.
	console.log('\n📋 Setting up permissions (board only — deliberately no public read)...');
	let existingPerms = [];
	try {
		existingPerms = await client.request(readPermissions({ limit: -1 }));
	} catch {
		// guarded below
	}

	for (const action of ['read', 'update']) {
		const already = existingPerms.find(
			(p) => p.policy === POLICIES.BOARD_MEMBER && p.collection === COLLECTION && p.action === action
		);
		if (already) {
			console.log(`   ⏭️  ${action} (exists)`);
			continue;
		}
		try {
			await client.request(
				createPermission({
					policy: POLICIES.BOARD_MEMBER,
					collection: COLLECTION,
					action,
					fields: ['*'],
					permissions: {},
					validation: {},
				})
			);
			console.log(`   ✅ ${action} for board members`);
			await delay(150);
		} catch (error) {
			console.log(`   ⚠️  ${action}:`, error?.errors?.[0]?.message || error?.message);
		}
	}

	console.log('\n✨ Done. Set the phrase in Directus → Site Access.\n');
	process.exit(0);
}

main().catch((error) => {
	console.error('\n❌ Setup failed:', error);
	process.exit(1);
});
