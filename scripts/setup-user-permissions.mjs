#!/usr/bin/env node

/**
 * Directus User Permissions Schema Setup Script
 *
 * This script creates the user_permissions collection and its fields
 * for granular per-user CRUD permissions on different collection categories.
 *
 * Usage:
 *   node scripts/setup-user-permissions.mjs
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
  createRelation,
  readCollections,
  createPermission,
  readPermissions,
  deletePermission,
} from '@directus/sdk';
import * as readline from 'readline';

// Policy UUIDs (Directus 11+)
const POLICIES = {
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
};

// Permission categories with their display names
const PERMISSION_CATEGORIES = [
  { key: 'projects', label: 'Projects', icon: 'folder' },
  { key: 'channels', label: 'Channels', icon: 'chat_bubble' },
  { key: 'financials', label: 'Financials', icon: 'payments' },
  { key: 'announcements', label: 'Announcements', icon: 'campaign' },
  { key: 'meetings', label: 'Meetings', icon: 'event' },
  { key: 'documents', label: 'Documents', icon: 'description' },
  { key: 'units', label: 'Units & People', icon: 'home' },
  { key: 'requests', label: 'Requests', icon: 'support_agent' },
  { key: 'vendors', label: 'Vendors', icon: 'store' },
];

// CRUD actions
const CRUD_ACTIONS = ['create', 'read', 'update', 'delete'];

// Helper to prompt for input
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

// Main function
async function main() {
  console.log('🔐 Directus User Permissions Schema Setup Script');
  console.log('=================================================\n');

  // Get credentials
  const directusUrl =
    process.env.DIRECTUS_URL ||
    (await prompt('Directus URL (e.g., https://admin.example.com): '));
  const email = process.env.DIRECTUS_EMAIL || (await prompt('Admin Email: '));
  const password =
    process.env.DIRECTUS_PASSWORD || (await prompt('Admin Password: '));

  console.log('\n📡 Connecting to Directus...');

  // Create client and authenticate
  const client = createDirectus(directusUrl)
    .with(authentication())
    .with(rest());

  try {
    await client.login({ email, password });
    console.log('✅ Authentication successful\n');
  } catch (error) {
    const errorMessage =
      error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
    console.error('❌ Authentication failed:', errorMessage);
    process.exit(1);
  }

  // ========================================
  // Step 1: Check if collection exists
  // ========================================
  console.log('📋 Step 1: Checking existing collections...');

  let collectionExists = false;
  try {
    const collections = await client.request(readCollections());
    collectionExists = collections.some((c) => c.collection === 'user_permissions');
    if (collectionExists) {
      console.log('   ⚠️  Collection "user_permissions" already exists. Skipping creation.');
    }
  } catch (error) {
    console.log('   Could not read collections:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 2: Create collection if needed
  // ========================================
  if (!collectionExists) {
    console.log('\n📦 Step 2: Creating user_permissions collection...');

    try {
      await client.request(
        createCollection({
          collection: 'user_permissions',
          schema: {
            name: 'user_permissions',
          },
          meta: {
            collection: 'user_permissions',
            icon: 'admin_panel_settings',
            note: 'Granular CRUD permissions for individual users',
            hidden: false,
            singleton: false,
            translations: null,
            archive_field: 'status',
            archive_value: 'archived',
            unarchive_value: 'draft',
            archive_app_filter: true,
            sort_field: null,
            accountability: 'all',
            color: '#6644FF',
            item_duplication_fields: null,
            sort: null,
            group: null,
            collapse: 'open',
          },
        })
      );
      console.log('   ✅ Collection created successfully');
    } catch (error) {
      console.log('   ❌ Failed to create collection:', error?.errors?.[0]?.message || error?.message);
      // Continue anyway as the collection might already exist
    }
  }

  // ========================================
  // Step 3: Create fields
  // ========================================
  console.log('\n📝 Step 3: Creating fields...');

  // System fields
  const systemFields = [
    {
      collection: 'user_permissions',
      field: 'id',
      type: 'integer',
      schema: { is_primary_key: true, has_auto_increment: true },
      meta: { hidden: true, readonly: true, interface: 'input', special: null },
    },
    {
      collection: 'user_permissions',
      field: 'status',
      type: 'string',
      schema: { default_value: 'published' },
      meta: {
        width: 'full',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Published', value: 'published' },
            { text: 'Draft', value: 'draft' },
            { text: 'Archived', value: 'archived' },
          ],
        },
        display: 'labels',
        display_options: {
          choices: [
            { text: 'Published', value: 'published', foreground: '#FFFFFF', background: '#4CAF50' },
            { text: 'Draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
            { text: 'Archived', value: 'archived', foreground: '#FFFFFF', background: '#F44336' },
          ],
        },
      },
    },
    {
      collection: 'user_permissions',
      field: 'user_created',
      type: 'uuid',
      schema: {},
      meta: { special: ['user-created'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half' },
    },
    {
      collection: 'user_permissions',
      field: 'date_created',
      type: 'timestamp',
      schema: {},
      meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half' },
    },
    {
      collection: 'user_permissions',
      field: 'user_updated',
      type: 'uuid',
      schema: {},
      meta: { special: ['user-updated'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half' },
    },
    {
      collection: 'user_permissions',
      field: 'date_updated',
      type: 'timestamp',
      schema: {},
      meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half' },
    },
    {
      collection: 'user_permissions',
      field: 'person_id',
      type: 'integer',
      schema: { is_nullable: false },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        required: true,
        options: {
          template: '{{first_name}} {{last_name}} ({{email}})',
        },
        display: 'related-values',
        display_options: {
          template: '{{first_name}} {{last_name}}',
        },
        note: 'The person this permission record applies to',
      },
    },
  ];

  // Create system fields
  for (const field of systemFields) {
    try {
      await client.request(createField(field.collection, field));
      console.log(`   ✅ Field: ${field.field}`);
    } catch (error) {
      const msg = error?.errors?.[0]?.message || error?.message;
      if (msg?.includes('already exists')) {
        console.log(`   ⏭️  Field: ${field.field} (already exists)`);
      } else {
        console.log(`   ⚠️  Field: ${field.field} - ${msg}`);
      }
    }
  }

  // Create permission category groups and fields
  for (const category of PERMISSION_CATEGORIES) {
    // Create a divider/group for this category
    try {
      await client.request(
        createField('user_permissions', {
          collection: 'user_permissions',
          field: `${category.key}_divider`,
          type: 'alias',
          meta: {
            interface: 'presentation-divider',
            special: ['alias', 'no-data'],
            width: 'full',
            options: {
              title: category.label,
              icon: category.icon,
            },
          },
        })
      );
      console.log(`   ✅ Divider: ${category.label}`);
    } catch (error) {
      const msg = error?.errors?.[0]?.message || error?.message;
      if (!msg?.includes('already exists')) {
        console.log(`   ⚠️  Divider: ${category.label} - ${msg}`);
      }
    }

    // Create CRUD boolean fields for this category
    for (const action of CRUD_ACTIONS) {
      const fieldName = `${category.key}_${action}`;
      try {
        await client.request(
          createField('user_permissions', {
            collection: 'user_permissions',
            field: fieldName,
            type: 'boolean',
            schema: { default_value: false },
            meta: {
              interface: 'boolean',
              display: 'boolean',
              width: 'quarter',
              options: {
                label: action.charAt(0).toUpperCase() + action.slice(1),
              },
              note: `Allow ${action} on ${category.label.toLowerCase()}`,
            },
          })
        );
        console.log(`   ✅ Field: ${fieldName}`);
      } catch (error) {
        const msg = error?.errors?.[0]?.message || error?.message;
        if (msg?.includes('already exists')) {
          console.log(`   ⏭️  Field: ${fieldName} (already exists)`);
        } else {
          console.log(`   ⚠️  Field: ${fieldName} - ${msg}`);
        }
      }
    }
  }

  // ========================================
  // Step 4: Create relation to people
  // ========================================
  console.log('\n🔗 Step 4: Creating relation to people...');

  try {
    await client.request(
      createRelation({
        collection: 'user_permissions',
        field: 'person_id',
        related_collection: 'people',
        meta: {
          one_field: 'permissions',
          sort_field: null,
          one_deselect_action: 'nullify',
        },
        schema: {
          on_delete: 'CASCADE',
        },
      })
    );
    console.log('   ✅ Relation created: user_permissions.person_id -> people');
  } catch (error) {
    const msg = error?.errors?.[0]?.message || error?.message;
    if (msg?.includes('already exists')) {
      console.log('   ⏭️  Relation already exists');
    } else {
      console.log(`   ⚠️  Relation: ${msg}`);
    }
  }

  // ========================================
  // Step 5: Set up permissions for the collection
  // ========================================
  console.log('\n🔐 Step 5: Setting up Directus permissions...');

  // Delete existing permissions for this collection
  try {
    const existingPermissions = await client.request(readPermissions({ limit: -1 }));
    const collectionPermissions = existingPermissions.filter(
      (p) => p.collection === 'user_permissions'
    );
    for (const perm of collectionPermissions) {
      try {
        await client.request(deletePermission(perm.id));
      } catch (e) {
        // Ignore
      }
    }
    console.log('   Cleaned up existing permissions');
  } catch (error) {
    console.log('   Could not clean existing permissions');
  }

  // Board members can read user_permissions
  const boardMemberPermissions = [
    {
      policy: POLICIES.BOARD_MEMBER,
      collection: 'user_permissions',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
  ];

  // Members can read their own permissions
  const memberPermissions = [
    {
      policy: POLICIES.MEMBER,
      collection: 'user_permissions',
      action: 'read',
      fields: ['*'],
      permissions: {
        person_id: {
          user: {
            _eq: '$CURRENT_USER',
          },
        },
      },
    },
  ];

  const allPermissions = [...boardMemberPermissions, ...memberPermissions];

  for (const perm of allPermissions) {
    try {
      await client.request(createPermission(perm));
      console.log(`   ✅ Permission: ${perm.collection}.${perm.action} for policy ${perm.policy.substring(0, 8)}...`);
    } catch (error) {
      console.log(`   ⚠️  Permission: ${error?.errors?.[0]?.message || error?.message}`);
    }
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ User Permissions schema setup complete!\n');

  console.log('📊 Summary:');
  console.log('   Collection: user_permissions');
  console.log('   Linked to: people collection via person_id');
  console.log('');
  console.log('   Permission Categories:');
  PERMISSION_CATEGORIES.forEach((cat) => {
    console.log(`   - ${cat.label}: create, read, update, delete`);
  });
  console.log('');
  console.log('🔑 Access Control:');
  console.log('   - Admins: Full CRUD (via admin_access)');
  console.log('   - Board Members: Read all permissions');
  console.log('   - Members: Read own permissions only');
  console.log('');
  console.log('📌 Next Steps:');
  console.log('   1. Add the O2M field "permissions" to the people collection in Directus');
  console.log('   2. Update the People interface in types/directus.ts if needed');
  console.log('   3. Use the useUserPermissions composable to check permissions');
}

main().catch(console.error);
