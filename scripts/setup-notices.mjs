#!/usr/bin/env node

/**
 * Directus Notices Collection Setup Script
 *
 * This script sets up a notices system for in-app notifications:
 *
 * Collections created:
 * 1. notices - In-app notices/announcements (separate from email announcements)
 *
 * Fields:
 * - title: Notice title
 * - content: Full content (WYSIWYG)
 * - type: announcement, update, alert, maintenance
 * - visibility: Multi-select JSON array (public, residents, board, staff)
 * - status: draft, published, archived
 * - published_at: When to show the notice
 * - expires_at: When to hide the notice (optional)
 * - pinned: Show at top
 *
 * Usage:
 *   node scripts/setup-notices.mjs
 *
 * Environment variables (or will prompt):
 *   DIRECTUS_URL - Your Directus instance URL
 *   DIRECTUS_EMAIL - Admin email
 *   DIRECTUS_PASSWORD - Admin password
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

// Helper to add delay between operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Role UUIDs from your Directus instance
const ROLES = {
  ADMINISTRATOR: '7913bfde-8ec9-4c51-8ecf-7efdb160a36d',
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
  PENDING: 'd45c208e-4223-41ef-85e8-24e0528d65ab',
};

// Policy UUIDs (Directus 11+)
const POLICIES = {
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
  PENDING: '2a9627a9-424d-472f-aaf1-478948d7549b',
};

// Notices collection schema
const COLLECTIONS = {
  notices: {
    collection: 'notices',
    meta: {
      collection: 'notices',
      icon: 'notifications',
      note: 'In-app notices and announcements for residents and visitors',
      display_template: '{{title}}',
      sort_field: 'sort',
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'published',
      singleton: false,
      hidden: false,
    },
    schema: {
      name: 'notices',
    },
  },
};

// Fields for notices collection
const NOTICES_FIELDS = [
  {
    field: 'id',
    type: 'integer',
    schema: { is_primary_key: true, has_auto_increment: true },
    meta: { hidden: true, readonly: true, interface: 'input', special: null },
  },
  {
    field: 'status',
    type: 'string',
    schema: { default_value: 'draft', is_nullable: false },
    meta: {
      width: 'half',
      interface: 'select-dropdown',
      display: 'labels',
      display_options: {
        showAsDot: true,
        choices: [
          { text: 'Draft', value: 'draft', foreground: '#ffffff', background: '#6B7280' },
          { text: 'Published', value: 'published', foreground: '#ffffff', background: '#10B981' },
          { text: 'Archived', value: 'archived', foreground: '#ffffff', background: '#EF4444' },
        ],
      },
      options: {
        choices: [
          { text: 'Draft', value: 'draft' },
          { text: 'Published', value: 'published' },
          { text: 'Archived', value: 'archived' },
        ],
      },
    },
  },
  {
    field: 'sort',
    type: 'integer',
    schema: {},
    meta: { hidden: true, interface: 'input' },
  },
  {
    field: 'user_created',
    type: 'uuid',
    schema: {},
    meta: {
      hidden: true,
      readonly: true,
      interface: 'select-dropdown-m2o',
      special: ['user-created'],
      width: 'half',
    },
  },
  {
    field: 'date_created',
    type: 'timestamp',
    schema: {},
    meta: {
      hidden: true,
      readonly: true,
      interface: 'datetime',
      special: ['date-created'],
      width: 'half',
    },
  },
  {
    field: 'user_updated',
    type: 'uuid',
    schema: {},
    meta: {
      hidden: true,
      readonly: true,
      interface: 'select-dropdown-m2o',
      special: ['user-updated'],
      width: 'half',
    },
  },
  {
    field: 'date_updated',
    type: 'timestamp',
    schema: {},
    meta: {
      hidden: true,
      readonly: true,
      interface: 'datetime',
      special: ['date-updated'],
      width: 'half',
    },
  },
  {
    field: 'title',
    type: 'string',
    schema: { is_nullable: false },
    meta: {
      interface: 'input',
      options: { placeholder: 'Notice title' },
      width: 'full',
      required: true,
    },
  },
  {
    field: 'content',
    type: 'text',
    schema: {},
    meta: {
      interface: 'input-rich-text-html',
      options: { toolbar: ['bold', 'italic', 'underline', 'link', 'bullist', 'numlist'] },
      width: 'full',
    },
  },
  {
    field: 'type',
    type: 'string',
    schema: { default_value: 'announcement' },
    meta: {
      width: 'half',
      interface: 'select-dropdown',
      display: 'labels',
      display_options: {
        choices: [
          { text: 'Announcement', value: 'announcement', foreground: '#ffffff', background: '#3B82F6' },
          { text: 'Update', value: 'update', foreground: '#ffffff', background: '#8B5CF6' },
          { text: 'Alert', value: 'alert', foreground: '#ffffff', background: '#F59E0B' },
          { text: 'Maintenance', value: 'maintenance', foreground: '#ffffff', background: '#6B7280' },
        ],
      },
      options: {
        choices: [
          { text: 'Announcement', value: 'announcement' },
          { text: 'Update', value: 'update' },
          { text: 'Alert', value: 'alert' },
          { text: 'Maintenance', value: 'maintenance' },
        ],
      },
    },
  },
  {
    field: 'visibility',
    type: 'json',
    schema: { default_value: ['public'] },
    meta: {
      width: 'half',
      interface: 'select-multiple-checkbox',
      display: 'labels',
      note: 'Select who can see this notice',
      options: {
        choices: [
          { text: 'Public (Everyone)', value: 'public' },
          { text: 'Residents Only', value: 'residents' },
          { text: 'Board Members', value: 'board' },
          { text: 'Staff', value: 'staff' },
        ],
      },
    },
  },
  {
    field: 'published_at',
    type: 'timestamp',
    schema: {},
    meta: {
      width: 'half',
      interface: 'datetime',
      display: 'datetime',
      note: 'When to start showing this notice',
    },
  },
  {
    field: 'expires_at',
    type: 'timestamp',
    schema: {},
    meta: {
      width: 'half',
      interface: 'datetime',
      display: 'datetime',
      note: 'When to stop showing this notice (optional)',
    },
  },
  {
    field: 'pinned',
    type: 'boolean',
    schema: { default_value: false },
    meta: {
      width: 'half',
      interface: 'boolean',
      display: 'boolean',
      note: 'Pinned notices appear at the top',
    },
  },
];

// Prompt helper
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n📢 Directus Notices System Setup\n');
  console.log('This script will create the notices collection for in-app notifications.\n');

  // Get credentials
  const url = process.env.DIRECTUS_URL || await prompt('Directus URL (e.g., https://admin.1033lenox.com): ');
  const email = process.env.DIRECTUS_EMAIL || await prompt('Admin email: ');
  const password = process.env.DIRECTUS_PASSWORD || await prompt('Admin password: ');

  if (!url || !email || !password) {
    console.error('❌ URL, email, and password are required');
    process.exit(1);
  }

  // Create Directus client
  const client = createDirectus(url).with(authentication()).with(rest());

  try {
    // Authenticate
    console.log('\n🔐 Authenticating...');
    await client.login(email, password);
    console.log('✅ Authenticated successfully');

    // Check if collection already exists
    console.log('\n📋 Checking existing collections...');
    const existingCollections = await client.request(readCollections());
    const collectionNames = existingCollections.map(c => c.collection);

    if (collectionNames.includes('notices')) {
      console.log('⚠️  notices collection already exists. Skipping collection creation.');
      console.log('   Checking for missing fields...');

      const existingFields = await client.request(readFields('notices'));
      const existingFieldNames = existingFields.map(f => f.field);

      for (const field of NOTICES_FIELDS) {
        if (!existingFieldNames.includes(field.field)) {
          console.log(`   Adding missing field: ${field.field}`);
          try {
            await client.request(createField('notices', field));
            await delay(200);
          } catch (err) {
            console.log(`   ⚠️  Could not add field ${field.field}: ${err.message}`);
          }
        }
      }
    } else {
      // Create notices collection
      console.log('\n📦 Creating notices collection...');
      await client.request(createCollection(COLLECTIONS.notices));
      console.log('✅ Created notices collection');
      await delay(500);

      // Create fields
      console.log('\n📝 Creating fields...');
      for (const field of NOTICES_FIELDS) {
        try {
          console.log(`   Creating field: ${field.field}`);
          await client.request(createField('notices', field));
          await delay(200);
        } catch (err) {
          console.log(`   ⚠️  Could not create field ${field.field}: ${err.message}`);
        }
      }
      console.log('✅ Fields created');
    }

    // Set up permissions
    console.log('\n🔒 Setting up permissions...');

    // Board members: Full CRUD
    try {
      await client.request(createPermission({
        collection: 'notices',
        action: 'create',
        policy: POLICIES.BOARD_MEMBER,
        fields: ['*'],
      }));
      await client.request(createPermission({
        collection: 'notices',
        action: 'read',
        policy: POLICIES.BOARD_MEMBER,
        fields: ['*'],
      }));
      await client.request(createPermission({
        collection: 'notices',
        action: 'update',
        policy: POLICIES.BOARD_MEMBER,
        fields: ['*'],
      }));
      await client.request(createPermission({
        collection: 'notices',
        action: 'delete',
        policy: POLICIES.BOARD_MEMBER,
      }));
      console.log('✅ Board member permissions set');
    } catch (err) {
      console.log('⚠️  Board member permissions may already exist');
    }

    // Members: Read only published notices
    try {
      await client.request(createPermission({
        collection: 'notices',
        action: 'read',
        policy: POLICIES.MEMBER,
        fields: ['*'],
        permissions: {
          _and: [
            { status: { _eq: 'published' } },
            {
              _or: [
                { visibility: { _contains: 'residents' } },
                { visibility: { _contains: 'public' } },
              ],
            },
          ],
        },
      }));
      console.log('✅ Member permissions set');
    } catch (err) {
      console.log('⚠️  Member permissions may already exist');
    }

    // Public: Read only published public notices
    try {
      await client.request(createPermission({
        collection: 'notices',
        action: 'read',
        role: null, // Public role
        fields: ['*'],
        permissions: {
          _and: [
            { status: { _eq: 'published' } },
            { visibility: { _contains: 'public' } },
          ],
        },
      }));
      console.log('✅ Public permissions set');
    } catch (err) {
      console.log('⚠️  Public permissions may already exist');
    }

    console.log('\n✨ Notices system setup complete!\n');
    console.log('Next steps:');
    console.log('1. Add notices_approved field to user_permissions collection if needed');
    console.log('2. Deploy the admin pages to manage notices');
    console.log('3. Update the notification center to fetch from notices collection\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  -', e.message));
    }
    process.exit(1);
  }
}

main();
