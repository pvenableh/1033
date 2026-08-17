#!/usr/bin/env node

/**
 * Directus Meeting Records Setup Script
 *
 * Adds the fields the public /board-meetings page needs on top of the existing
 * `meetings` collection:
 *
 *   canceled           - boolean flag; a canceled meeting stays on the schedule
 *                        rather than disappearing, so the record stays honest
 *   cancellation_note  - why it was canceled / what replaces it
 *   recording_link     - Zoom (or other) share URL for the recording
 *   recording_passcode - passcode Zoom generates alongside that share link
 *
 * It also adds a meetings <-> announcements M2M (junction
 * `meetings_announcements`, alias field `meetings.announcements`) so the board
 * can attach related announcements to a meeting from the Directus admin app.
 * Mirrors the existing meetings_presentations relation exactly.
 *
 * Idempotent: existing fields are skipped, so it is safe to re-run.
 *
 * Usage:
 *   node scripts/setup-meeting-records.mjs
 *   (or: pnpm setup:meeting-records)
 *
 * Environment variables (or will prompt):
 *   DIRECTUS_URL      - Your Directus instance URL
 *   DIRECTUS_EMAIL    - Admin email
 *   DIRECTUS_PASSWORD - Admin password
 */

import {
	createDirectus,
	updateField,
	rest,
	authentication,
	createField,
	readFields,
	createCollection,
	createRelation,
	readCollections,
	createPermission,
	readPermissions,
} from '@directus/sdk';
import * as readline from 'readline';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const COLLECTION = 'meetings';
const JUNCTION = 'meetings_announcements';

// Presets offered on meetings.location. Not exhaustive — the field also allows
// free text, so this is a convenience list, not a constraint.
const LOCATION_PRESETS = [
	'Community Room',
	'Pool Deck',
	'Lobby',
	'Rooftop Terrace',
	'Zoom',
	'Hybrid — Community Room + Zoom',
	'Offsite',
];

// Policy UUIDs (Directus 11+) — same values used by scripts/setup-permissions.mjs
const POLICIES = {
	PUBLIC: 'abf8a154-5b1c-4a46-ac9c-7300570f4f17',
	MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
	BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
};

const FIELDS = [
	{
		field: 'canceled',
		type: 'boolean',
		schema: { default_value: false, is_nullable: true },
		meta: {
			interface: 'boolean',
			special: ['cast-boolean'],
			options: { label: 'This meeting was canceled' },
			display: 'boolean',
			width: 'half',
			note: 'Keeps the meeting on the public schedule, marked as canceled.',
		},
	},
	{
		field: 'cancellation_note',
		type: 'text',
		schema: { is_nullable: true },
		meta: {
			interface: 'input-multiline',
			options: { placeholder: 'Canceled for lack of quorum. Rescheduled to March 4.' },
			width: 'full',
			note: 'Shown publicly when the meeting is marked canceled.',
			conditions: [
				{
					name: 'Only when canceled',
					rule: { canceled: { _neq: true } },
					hidden: true,
				},
			],
		},
	},
	{
		field: 'recording_link',
		type: 'string',
		schema: { is_nullable: true },
		meta: {
			interface: 'input',
			options: { placeholder: 'https://us06web.zoom.us/rec/share/…', iconLeft: 'videocam' },
			width: 'full',
			note: 'Zoom "Copy shareable link" URL. Shown publicly once the meeting has passed.',
		},
	},
	{
		field: 'recording_passcode',
		type: 'string',
		schema: { is_nullable: true },
		meta: {
			interface: 'input',
			options: { placeholder: '7hVb*s68', iconLeft: 'key' },
			width: 'half',
			note: 'Passcode Zoom generates with the share link. Displayed next to the recording.',
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
	console.log('\n🗓️  Meeting Records Setup\n');

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

	let existing = [];
	try {
		const fields = await client.request(readFields(COLLECTION));
		existing = fields.map((f) => f.field);
	} catch (error) {
		console.error(`❌ Could not read fields on "${COLLECTION}":`, error?.errors?.[0]?.message || error?.message);
		process.exit(1);
	}

	console.log(`📋 Adding fields to "${COLLECTION}"...`);
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

	// ------------------------------------------------------------------
	// Widen the location field
	// ------------------------------------------------------------------
	// It shipped as a two-option dropdown (Community Room / Zoom), which both
	// limited where a meeting could be recorded as happening AND conflated place
	// with medium — a Community Room meeting that also streams had no way to say
	// so. allowOther lets the board type any location; `video_link` is what marks
	// a meeting virtual, so the two facts stay independent.
	console.log('\n📋 Widening the location field...');
	try {
		await client.request(
			updateField(COLLECTION, 'location', {
				meta: {
					options: {
						choices: LOCATION_PRESETS.map((c) => ({ text: c, value: c })),
						allowOther: true,
					},
					note: 'Where the meeting is held. Pick a preset or type any other location. Set the Live Zoom Link separately if it is also online — that is what marks it virtual.',
				},
			})
		);
		console.log('   ✅ location (presets + free text)');
		await delay(200);
	} catch (error) {
		console.log('   ⚠️  location:', error?.errors?.[0]?.message || error?.message);
	}

	// ------------------------------------------------------------------
	// meetings <-> announcements (M2M), mirroring meetings_presentations
	// ------------------------------------------------------------------
	console.log('\n📋 Setting up meetings ↔ announcements...');

	let collections = [];
	try {
		collections = (await client.request(readCollections())).map((c) => c.collection);
	} catch {
		// Non-fatal: creation below is guarded by its own try/catch.
	}

	if (collections.includes(JUNCTION)) {
		console.log(`   ⏭️  ${JUNCTION} (exists)`);
	} else {
		try {
			await client.request(
				createCollection({
					collection: JUNCTION,
					meta: {
						collection: JUNCTION,
						icon: 'campaign',
						note: 'Announcements attached to a meeting',
						hidden: true,
					},
					schema: { name: JUNCTION },
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
			console.log(`   ✅ ${JUNCTION}`);
			await delay(500);
		} catch (error) {
			console.log(`   ❌ ${JUNCTION}:`, error?.errors?.[0]?.message || error?.message);
		}
	}

	// Foreign-key columns on the junction.
	for (const [field, related] of [
		['meetings_id', 'meetings'],
		['announcements_id', 'announcements'],
	]) {
		try {
			await client.request(
				createField(JUNCTION, {
					field,
					type: 'integer',
					schema: { is_nullable: true },
					meta: { hidden: true, interface: 'select-dropdown-m2o', special: ['m2o'] },
				})
			);
			console.log(`   ✅ ${JUNCTION}.${field} → ${related}`);
			await delay(200);
		} catch (error) {
			const msg = error?.errors?.[0]?.message || error?.message || '';
			console.log(
				msg.toLowerCase().includes('exist')
					? `   ⏭️  ${JUNCTION}.${field} (exists)`
					: `   ⚠️  ${JUNCTION}.${field}: ${msg}`
			);
		}
	}

	// Wire the two sides together BEFORE creating the alias field.
	//
	// Order matters. `one_field` on the meetings side is what the list-m2m
	// interface resolves through; create the alias first and the Directus app
	// renders "Interface list-m2m not found" because there's no relation behind
	// it yet. The announcements side stays unexposed so the announcements form
	// isn't cluttered with a reverse picker.
	const RELATIONS = [
		{
			collection: JUNCTION,
			field: 'meetings_id',
			related_collection: 'meetings',
			meta: { one_field: 'announcements', junction_field: 'announcements_id', sort_field: null },
			schema: { on_delete: 'SET NULL' },
		},
		{
			collection: JUNCTION,
			field: 'announcements_id',
			related_collection: 'announcements',
			meta: { one_field: null, junction_field: 'meetings_id', sort_field: null },
			schema: { on_delete: 'SET NULL' },
		},
	];

	for (const relation of RELATIONS) {
		try {
			await client.request(createRelation(relation));
			console.log(`   ✅ relation ${relation.field} → ${relation.related_collection}`);
			await delay(300);
		} catch (error) {
			// Directus reports a pre-existing relation as "already has an associated
			// relationship" — no "exists" in the string, so match that too.
			const msg = error?.errors?.[0]?.message || error?.message || '';
			const known = /exist|already has an associated/i.test(msg);
			console.log(
				known
					? `   ⏭️  relation ${relation.field} (exists)`
					: `   ⚠️  relation ${relation.field}: ${msg}`
			);
		}
	}

	// Alias field that surfaces the picker on the meetings form. Created AFTER
	// the relations above so the list-m2m interface has something to bind to.
	// The template controls what each attached row reads as in the picker.
	try {
		await client.request(
			createField('meetings', {
				field: 'announcements',
				type: 'alias',
				meta: {
					special: ['m2m'],
					interface: 'list-m2m',
					width: 'full',
					note: 'Announcements related to this meeting. Shown publicly on /board-meetings when sent and not private.',
					options: {
						enableSelect: true,
						limit: 25,
						template: '{{announcements_id.title}}',
					},
				},
			})
		);
		console.log('   ✅ meetings.announcements (alias)');
		await delay(200);
	} catch (error) {
		const msg = error?.errors?.[0]?.message || error?.message || '';
		console.log(
			msg.toLowerCase().includes('exist')
				? '   ⏭️  meetings.announcements (exists)'
				: `   ⚠️  meetings.announcements: ${msg}`
		);
	}

	// ------------------------------------------------------------------
	// Permissions on the junction, mirroring meetings_presentations
	// ------------------------------------------------------------------
	console.log('\n📋 Setting up permissions...');

	let existingPerms = [];
	try {
		existingPerms = await client.request(readPermissions({ limit: -1 }));
	} catch {
		// Non-fatal — creation below is individually guarded.
	}

	// Read for everyone who can already see meetings; write for the board so the
	// admin form's announcement picker works without administrator rights.
	const PERMS = [
		{ policy: POLICIES.PUBLIC, collection: JUNCTION, action: 'read' },
		{ policy: POLICIES.MEMBER, collection: JUNCTION, action: 'read' },
		{ policy: POLICIES.BOARD_MEMBER, collection: JUNCTION, action: 'read' },
		{ policy: POLICIES.BOARD_MEMBER, collection: JUNCTION, action: 'create' },
		{ policy: POLICIES.BOARD_MEMBER, collection: JUNCTION, action: 'update' },
		{ policy: POLICIES.BOARD_MEMBER, collection: JUNCTION, action: 'delete' },

		// The board maintains the schedule from /admin/meetings, which showed the
		// full create/edit/delete UI to board members while the policy was
		// read-only — every save 403'd. These make the page's behaviour match
		// what it already offers.
		{ policy: POLICIES.BOARD_MEMBER, collection: 'meetings', action: 'create' },
		{ policy: POLICIES.BOARD_MEMBER, collection: 'meetings', action: 'update' },
		{ policy: POLICIES.BOARD_MEMBER, collection: 'meetings', action: 'delete' },
	];

	for (const { policy, collection, action } of PERMS) {
		const already = existingPerms.find(
			(p) => p.policy === policy && p.collection === collection && p.action === action
		);
		if (already) {
			console.log(`   ⏭️  ${action} on ${collection} (exists)`);
			continue;
		}
		try {
			await client.request(
				createPermission({
					policy,
					collection,
					action,
					fields: ['*'],
					permissions: {},
					validation: {},
				})
			);
			console.log(`   ✅ ${action} on ${collection}`);
			await delay(150);
		} catch (error) {
			console.log(`   ⚠️  ${action} on ${collection}:`, error?.errors?.[0]?.message || error?.message);
		}
	}

	console.log('\n✨ Done. Regenerate types with: pnpm generate:types\n');
	process.exit(0);
}

main().catch((error) => {
	console.error('\n❌ Setup failed:', error);
	process.exit(1);
});
