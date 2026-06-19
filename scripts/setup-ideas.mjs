#!/usr/bin/env node

/**
 * Directus Community Ideas + Polls Setup Script
 *
 * Public-facing "community space ideas" board for residents:
 *   - ideas        : resident-submitted ideas (moderated: pending -> published)
 *   - ideas_files  : junction for idea images (-> directus_files)
 *   - polls        : admin-created polls (draft -> open -> closed)
 *   - poll_options : options belonging to a poll
 *   - poll_votes   : individual votes (cookie + ip_hash + optional matched resident)
 *
 * Submissions and votes come in through the public Nitro endpoints
 * (server/api/...) using the server admin token, so this script only needs to
 * configure the schema and the AUTHENTICATED role permissions (board/member).
 * Public read/write is enforced server-side, not via the Directus public role.
 *
 * Run AFTER the base platform is set up.
 *
 * Usage:
 *   node scripts/setup-ideas.mjs
 *   (or: pnpm setup:ideas)
 *
 * Environment variables (or will prompt):
 *   DIRECTUS_URL      - Your Directus instance URL
 *   DIRECTUS_EMAIL    - Admin email
 *   DIRECTUS_PASSWORD - Admin password
 */

import {
  createDirectus,
  rest,
  authentication,
  createCollection,
  deleteCollection,
  createField,
  createRelation,
  readCollections,
  readFields,
  readItems,
  readFolders,
  createFolder,
  createPermission,
  readPermissions,
  updatePermission,
} from '@directus/sdk';
import * as readline from 'readline';

// Helper to add delay between operations
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Policy UUIDs (Directus 11+) — mirror scripts/setup-projects.mjs
const POLICIES = {
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
};

// Folder the public upload endpoint drops idea images into.
const UPLOAD_FOLDER_NAME = 'Community Ideas';

// Category options for ideas (shared with the form dropdown).
const IDEA_CATEGORIES = [
  'Lobby',
  'Rooftop',
  'Gym / Fitness',
  'Pool Deck',
  'Co-work Space',
  'Bike / Storage',
  'Lounge / Social',
  'Other',
];

// ========================================
// Collection Definitions
// ========================================

const COLLECTIONS = {
  ideas: {
    collection: 'ideas',
    meta: {
      collection: 'ideas',
      icon: 'lightbulb',
      note: 'Resident-submitted ideas for community space',
      display_template: '{{title}}',
      sort_field: 'sort',
      singleton: false,
      hidden: false,
    },
    schema: { name: 'ideas' },
  },
  ideas_files: {
    collection: 'ideas_files',
    meta: {
      collection: 'ideas_files',
      icon: 'image',
      note: 'Image attachments for ideas',
      hidden: true,
    },
    schema: { name: 'ideas_files' },
  },
  polls: {
    collection: 'polls',
    meta: {
      collection: 'polls',
      icon: 'poll',
      note: 'Community polls',
      display_template: '{{question}}',
      sort_field: 'sort',
      singleton: false,
      hidden: false,
    },
    schema: { name: 'polls' },
  },
  poll_options: {
    collection: 'poll_options',
    meta: {
      collection: 'poll_options',
      icon: 'radio_button_checked',
      note: 'Options for a poll',
      display_template: '{{label}}',
      sort_field: 'sort',
      hidden: false,
    },
    schema: { name: 'poll_options' },
  },
  poll_votes: {
    collection: 'poll_votes',
    meta: {
      collection: 'poll_votes',
      icon: 'how_to_vote',
      note: 'Individual poll votes (dedup by person/cookie/ip)',
      hidden: true,
    },
    schema: { name: 'poll_votes' },
  },
};

// ========================================
// Field Definitions
// ========================================

const statusDropdown = (choices, defaultValue) => ({
  field: 'status',
  type: 'string',
  meta: {
    interface: 'select-dropdown',
    options: { choices: choices.map((c) => ({ text: c.text, value: c.value })) },
    display: 'labels',
    width: 'half',
  },
  schema: { default_value: defaultValue },
});

const sortField = {
  field: 'sort',
  type: 'integer',
  meta: { interface: 'input', hidden: true, special: ['sort'] },
};

const dateCreated = {
  field: 'date_created',
  type: 'timestamp',
  meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half' },
};

const dateUpdated = {
  field: 'date_updated',
  type: 'timestamp',
  meta: { special: ['date-updated'], interface: 'datetime', readonly: true, width: 'half' },
};

const userCreated = {
  field: 'user_created',
  type: 'uuid',
  meta: { special: ['user-created'], interface: 'select-dropdown-m2o', readonly: true, width: 'half' },
};

const FIELDS = {
  ideas: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    statusDropdown(
      [
        { text: 'Pending Review', value: 'pending' },
        { text: 'Published', value: 'published' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Archived', value: 'archived' },
      ],
      'pending'
    ),
    sortField,
    userCreated,
    dateCreated,
    dateUpdated,
    {
      field: 'title',
      type: 'string',
      meta: { interface: 'input', width: 'full', required: true, note: 'Short headline for the idea' },
      schema: { is_nullable: false },
    },
    {
      field: 'category',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: { choices: IDEA_CATEGORIES.map((c) => ({ text: c, value: c })) },
        display: 'labels',
        width: 'half',
      },
    },
    {
      field: 'description',
      type: 'text',
      meta: { interface: 'input-multiline', width: 'full', required: true },
      schema: { is_nullable: false },
    },
    // Submitter info (free text — what the public form collects)
    {
      field: 'name',
      type: 'string',
      meta: { interface: 'input', width: 'half', note: 'Submitter name', group: 'submitter' },
    },
    {
      field: 'email',
      type: 'string',
      meta: { interface: 'input', width: 'half', note: 'Submitter email (admin-only)', group: 'submitter' },
    },
    {
      field: 'unit_number',
      type: 'string',
      meta: { interface: 'input', width: 'half', note: 'Free-text unit (fallback when not matched)', group: 'submitter' },
    },
    // Resident-match results (filled server-side when email matches a person)
    {
      field: 'verified_resident',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        width: 'half',
        note: 'Email matched a published resident in the people roster',
        group: 'submitter',
      },
      schema: { default_value: false },
    },
    // Image attachments (o2m -> ideas_files junction)
    {
      field: 'images',
      type: 'alias',
      meta: { interface: 'list-o2m', special: ['o2m'], display: 'related-values', width: 'full' },
    },
  ],

  ideas_files: [
    {
      field: 'id',
      type: 'integer',
      meta: { hidden: true, interface: 'input' },
      schema: { is_primary_key: true, has_auto_increment: true },
    },
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', hidden: true },
    },
  ],

  polls: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    statusDropdown(
      [
        { text: 'Draft', value: 'draft' },
        { text: 'Open', value: 'open' },
        { text: 'Closed', value: 'closed' },
      ],
      'draft'
    ),
    sortField,
    userCreated,
    dateCreated,
    dateUpdated,
    {
      field: 'question',
      type: 'string',
      meta: { interface: 'input', width: 'full', required: true },
      schema: { is_nullable: false },
    },
    {
      field: 'description',
      type: 'text',
      meta: { interface: 'input-multiline', width: 'full' },
    },
    {
      field: 'category',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: { choices: IDEA_CATEGORIES.map((c) => ({ text: c, value: c })) },
        display: 'labels',
        width: 'half',
        note: 'Optional grouping (matches idea categories)',
      },
    },
    {
      field: 'closes_at',
      type: 'timestamp',
      meta: { interface: 'datetime', width: 'half', note: 'Votes rejected after this time (optional)' },
    },
    {
      field: 'options',
      type: 'alias',
      meta: { interface: 'list-o2m', special: ['o2m'], display: 'related-values', width: 'full' },
    },
  ],

  poll_options: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    sortField,
    {
      field: 'label',
      type: 'string',
      meta: { interface: 'input', width: 'full', required: true },
      schema: { is_nullable: false },
    },
  ],

  poll_votes: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    dateCreated,
    {
      field: 'voter_id',
      type: 'string',
      meta: { interface: 'input', readonly: true, width: 'half', note: 'Signed cookie UUID' },
    },
    {
      field: 'ip_hash',
      type: 'string',
      meta: { interface: 'input', readonly: true, width: 'half', note: 'Salted hash of voter IP (audit / rate-limit)' },
    },
  ],
};

// ========================================
// Relationships
//   fkType lets us match the related collection's primary key type.
//   people.id and units.id are INTEGER; directus_users.id is UUID.
// ========================================

// NOTE: user_created / user_updated relations are created automatically by
// Directus from the `user-created` field special, so they are NOT listed here.
const RELATIONS = [
  // ideas.person_id -> people (matched resident)
  {
    collection: 'ideas',
    field: 'person_id',
    related_collection: 'people',
    fkType: 'integer',
    meta: { one_deselect_action: 'nullify' },
  },
  // ideas.unit -> units (matched unit)
  {
    collection: 'ideas',
    field: 'unit',
    related_collection: 'units',
    fkType: 'integer',
    meta: { one_deselect_action: 'nullify' },
  },

  // ideas_files junction (ideas <-> directus_files)
  {
    collection: 'ideas_files',
    field: 'ideas_id',
    related_collection: 'ideas',
    fkType: 'uuid',
    meta: { one_field: 'images', junction_field: 'directus_files_id', one_deselect_action: 'delete' },
  },
  {
    collection: 'ideas_files',
    field: 'directus_files_id',
    related_collection: 'directus_files',
    fkType: 'uuid',
    meta: { junction_field: 'ideas_id', one_deselect_action: 'nullify' },
  },

  // poll_options.poll -> polls
  {
    collection: 'poll_options',
    field: 'poll',
    related_collection: 'polls',
    fkType: 'uuid',
    meta: { one_field: 'options', one_deselect_action: 'delete' },
  },

  // poll_votes.poll -> polls
  {
    collection: 'poll_votes',
    field: 'poll',
    related_collection: 'polls',
    fkType: 'uuid',
    meta: { one_deselect_action: 'delete' },
  },
  // poll_votes.option -> poll_options
  {
    collection: 'poll_votes',
    field: 'option',
    related_collection: 'poll_options',
    fkType: 'uuid',
    meta: { one_deselect_action: 'delete' },
  },
  // poll_votes.person_id -> people (matched resident, nullable)
  {
    collection: 'poll_votes',
    field: 'person_id',
    related_collection: 'people',
    fkType: 'integer',
    meta: { one_deselect_action: 'nullify' },
  },
];

// ========================================
// Permissions (authenticated roles only — public is server-side)
// ========================================

const IDEA_COLLECTIONS = ['ideas', 'ideas_files', 'polls', 'poll_options', 'poll_votes'];

const PERMISSIONS = {
  // Board members moderate ideas and manage polls.
  [POLICIES.BOARD_MEMBER]: IDEA_COLLECTIONS.flatMap((collection) => [
    { collection, action: 'read', fields: ['*'], permissions: {} },
    { collection, action: 'create', fields: ['*'], permissions: {} },
    { collection, action: 'update', fields: ['*'], permissions: {} },
    { collection, action: 'delete', permissions: {} },
  ]),

  // Members (future authenticated residents) read published ideas + polls.
  [POLICIES.MEMBER]: [
    {
      collection: 'ideas',
      action: 'read',
      fields: ['*'],
      permissions: { status: { _eq: 'published' } },
    },
    { collection: 'ideas_files', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'polls', action: 'read', fields: ['*'], permissions: { status: { _neq: 'draft' } } },
    { collection: 'poll_options', action: 'read', fields: ['*'], permissions: {} },
    // Aggregate counts only — individual votes stay private.
    { collection: 'poll_votes', action: 'read', fields: ['id', 'poll', 'option'], permissions: {} },
  ],
};

// Helper to prompt for input
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  console.log('💡 Directus Community Ideas + Polls Setup');
  console.log('==========================================\n');

  const directusUrl =
    process.env.DIRECTUS_URL || (await prompt('Directus URL (e.g., https://admin.1033lenox.com): '));
  const email = process.env.DIRECTUS_EMAIL || (await prompt('Admin Email: '));
  const password = process.env.DIRECTUS_PASSWORD || (await prompt('Admin Password: '));

  console.log('\n📡 Connecting to Directus...');

  const client = createDirectus(directusUrl).with(authentication()).with(rest());

  try {
    await client.login({ email, password });
    console.log('✅ Authentication successful\n');
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
    console.error('❌ Authentication failed:', errorMessage);
    process.exit(1);
  }

  // ========================================
  // Step 1: Create the upload folder
  // ========================================
  console.log(`📁 Step 1: Creating "${UPLOAD_FOLDER_NAME}" folder...`);
  let uploadFolderId = null;
  try {
    const folders = await client.request(readFolders({ filter: { name: { _eq: UPLOAD_FOLDER_NAME } } }));
    if (folders && folders.length > 0) {
      uploadFolderId = folders[0].id;
      console.log(`   ✅ Folder already exists: ${uploadFolderId}`);
    } else {
      const newFolder = await client.request(createFolder({ name: UPLOAD_FOLDER_NAME }));
      uploadFolderId = newFolder.id;
      console.log(`   ✅ Created folder: ${uploadFolderId}`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not create folder:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 1.5: Reset existing (EMPTY) idea/poll collections
  //   Recreating with an explicit uuid primary key requires a clean table —
  //   createCollection won't change an existing integer PK. We only drop
  //   collections that have zero items, so this never destroys real data.
  //   Order matters: drop junction/child tables before their parents.
  // ========================================
  // Set IDEAS_FORCE_RESET=1 (or pass --force) to drop these collections even if
  // they contain rows — needed when a previous partial run left them with the
  // wrong (integer) primary key and some throwaway test data.
  const FORCE_RESET = process.env.IDEAS_FORCE_RESET === '1' || process.argv.includes('--force');
  console.log(
    `\n♻️  Step 1.5: Resetting idea/poll collections${FORCE_RESET ? ' (FORCE: dropping even with data)' : ' (empty only)'}...`
  );
  const RESET_ORDER = ['ideas_files', 'poll_votes', 'poll_options', 'ideas', 'polls'];
  let preCollections = [];
  try {
    preCollections = await client.request(readCollections());
  } catch {
    // ignore
  }
  const preNames = preCollections.map((c) => c.collection);
  for (const name of RESET_ORDER) {
    if (!preNames.includes(name)) continue;

    if (!FORCE_RESET) {
      let itemCount = 0;
      try {
        const rows = await client.request(readItems(name, { limit: 1, fields: ['id'] }));
        itemCount = Array.isArray(rows) ? rows.length : 0;
      } catch {
        // If we can't read items, err on the side of caution and skip deletion.
        itemCount = 1;
      }
      if (itemCount > 0) {
        console.log(`   ⛔ ${name} has data — NOT dropping. Re-run with IDEAS_FORCE_RESET=1 to drop it.`);
        continue;
      }
    }

    try {
      await client.request(deleteCollection(name));
      console.log(`   🗑️  Dropped collection: ${name}`);
      await delay(300);
    } catch (error) {
      console.log(`   ⚠️  Could not drop ${name}: ${error?.errors?.[0]?.message || error?.message}`);
    }
  }

  // ========================================
  // Step 2: Create collections (PK defined inline so id is uuid, not the
  //   default auto-increment integer)
  // ========================================
  console.log('\n📋 Step 2: Creating collections...');
  let existingCollections = [];
  try {
    existingCollections = await client.request(readCollections());
  } catch (error) {
    console.log('   ⚠️  Could not read collections:', error?.errors?.[0]?.message || error?.message);
  }
  const existingNames = existingCollections.map((c) => c.collection);

  for (const [name, config] of Object.entries(COLLECTIONS)) {
    if (existingNames.includes(name)) {
      console.log(`   ⏭️  Skipping ${name} (already exists)`);
      continue;
    }
    try {
      // Pass the real (non-alias) fields — crucially the primary key — so
      // Directus creates the table with our uuid PK instead of defaulting to
      // an auto-increment integer id.
      const fields = (FIELDS[name] || []).filter((f) => f.type !== 'alias');
      await client.request(createCollection({ ...config, fields }));
      console.log(`   ✅ Created collection: ${name} (${fields.length} fields)`);
      await delay(500);
    } catch (error) {
      console.log(`   ❌ Error creating ${name}:`, error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 3: Create fields
  // ========================================
  console.log('\n📋 Step 3: Creating fields...');
  for (const [collectionName, fields] of Object.entries(FIELDS)) {
    console.log(`\n   📝 Fields for ${collectionName}:`);
    let existingFields = [];
    try {
      existingFields = await client.request(readFields(collectionName));
    } catch (error) {
      // Collection might not exist yet
    }
    const existingDbColumns = existingFields
      .filter((f) => f.schema !== null && f.schema !== undefined)
      .map((f) => f.field);

    for (const field of fields) {
      if (field.type === 'alias') {
        console.log(`      ⏭️  ${field.field} (alias field)`);
        continue;
      }
      if (existingDbColumns.includes(field.field)) {
        console.log(`      ⏭️  ${field.field} (exists)`);
        continue;
      }
      try {
        await client.request(createField(collectionName, field));
        console.log(`      ✅ ${field.field}`);
        await delay(200);
      } catch (error) {
        console.log(`      ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
      }
    }
  }

  console.log('\n   ⏳ Waiting for schema to sync...');
  await delay(2000);

  // ========================================
  // Step 4: Create relationships (and their FK fields)
  // ========================================
  console.log('\n📋 Step 4: Creating relationships...');
  for (const relation of RELATIONS) {
    const { collection, field: fieldName, related_collection, fkType = 'uuid', meta } = relation;

    // Always attempt to create the FK column; treat "already exists" as success.
    // (Field-state detection can be stale right after collection creation, so we
    // don't gate on a readFields() check.)
    const fieldToCreate = {
      field: fieldName,
      type: fkType,
      schema: { is_nullable: true },
      meta: {
        hidden: false,
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: related_collection === 'directus_users' ? 'user' : 'related-values',
        width: 'half',
      },
    };
    try {
      await client.request(createField(collection, fieldToCreate));
      console.log(`   ✅ Created field: ${collection}.${fieldName} (${fkType})`);
      await delay(300);
    } catch (error) {
      const msg = error?.errors?.[0]?.message || error?.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate') || msg.toLowerCase().includes('exist')) {
        console.log(`   ⏭️  Field ${collection}.${fieldName} (exists)`);
      } else {
        console.log(`   ⚠️  Field ${collection}.${fieldName}: ${msg}`);
      }
    }

    try {
      await client.request(
        createRelation({ collection, field: fieldName, related_collection, meta: meta || {} })
      );
      console.log(`   ✅ ${collection}.${fieldName} -> ${related_collection}`);
      await delay(200);
    } catch (error) {
      const msg = error?.errors?.[0]?.message || error?.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(`   ⏭️  ${collection}.${fieldName} (relation exists)`);
      } else {
        console.log(`   ⚠️  ${collection}.${fieldName}: ${msg}`);
      }
    }
  }

  // ========================================
  // Step 5: Permissions (authenticated roles)
  // ========================================
  console.log('\n📋 Step 5: Setting up permissions...');
  let existingPermissions = [];
  try {
    existingPermissions = await client.request(readPermissions({ limit: -1 }));
    console.log(`   Found ${existingPermissions.length} existing permissions`);
  } catch (error) {
    console.log('   ⚠️  Could not read permissions:', error?.errors?.[0]?.message || error?.message);
  }

  for (const [policyId, permissions] of Object.entries(PERMISSIONS)) {
    const policyName = Object.keys(POLICIES).find((key) => POLICIES[key] === policyId);
    console.log(`\n   🎭 Setting permissions for: ${policyName}`);
    for (const perm of permissions) {
      const { collection, action, fields, permissions: permFilter, validation } = perm;
      const existing = existingPermissions.find(
        (p) => p.policy === policyId && p.collection === collection && p.action === action
      );
      const permissionData = {
        policy: policyId,
        collection,
        action,
        fields: fields || ['*'],
        permissions: permFilter || {},
        validation: validation || null,
      };
      try {
        if (existing) {
          await client.request(updatePermission(existing.id, permissionData));
          console.log(`      ✏️  Updated: ${collection}.${action}`);
        } else {
          await client.request(createPermission(permissionData));
          console.log(`      ✅ Created: ${collection}.${action}`);
        }
      } catch (error) {
        console.log(`      ⚠️  ${collection}.${action}: ${error?.errors?.[0]?.message || error?.message}`);
      }
    }
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ Community Ideas + Polls setup complete!\n');
  console.log('📊 Collections: ideas, ideas_files, polls, poll_options, poll_votes');
  if (uploadFolderId) {
    console.log(`\n📁 Upload folder "${UPLOAD_FOLDER_NAME}" ID: ${uploadFolderId}`);
    console.log('   The public upload endpoint looks this folder up by name, so no env var needed.');
  }
  console.log('\n⚠️  MANUAL STEP — composite unique index:');
  console.log('   Directus cannot create a composite unique constraint via the SDK.');
  console.log('   Vote de-duplication is enforced in /api/polls/vote, but for a hard DB');
  console.log('   guarantee add a unique index on poll_votes (poll, voter_id), e.g.:');
  console.log('     CREATE UNIQUE INDEX poll_votes_poll_voter_uq ON poll_votes (poll, voter_id);');
  console.log('   (and optionally on (poll, person_id) WHERE person_id IS NOT NULL)');
}

main().catch(console.error);
