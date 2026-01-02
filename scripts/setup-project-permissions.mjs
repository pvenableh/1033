#!/usr/bin/env node

/**
 * Directus Project Permissions Setup Script
 *
 * This script sets up permissions for the project timeline system collections.
 * Run this AFTER manually creating the collections in Directus.
 *
 * Usage:
 *   node scripts/setup-project-permissions.mjs
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

// Project collections
const PROJECT_COLLECTIONS = [
  'project_categories',
  'project_event_categories',
  'projects',
  'project_events',
  'project_tasks',
  'project_event_files',
  'project_task_watchers',
];

// Permissions for project collections
const PROJECT_PERMISSIONS = {
  // Board Member permissions - full access
  [POLICIES.BOARD_MEMBER]: [
    // project_categories - full CRUD
    {
      collection: 'project_categories',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_categories',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_categories',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_categories',
      action: 'delete',
      permissions: {},
    },

    // project_event_categories - full CRUD
    {
      collection: 'project_event_categories',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_event_categories',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_event_categories',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_event_categories',
      action: 'delete',
      permissions: {},
    },

    // projects - full CRUD
    {
      collection: 'projects',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'projects',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'projects',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'projects',
      action: 'delete',
      permissions: {},
    },

    // project_events - full CRUD
    {
      collection: 'project_events',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_events',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_events',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_events',
      action: 'delete',
      permissions: {},
    },

    // project_tasks - full CRUD
    {
      collection: 'project_tasks',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_tasks',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_tasks',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_tasks',
      action: 'delete',
      permissions: {},
    },

    // project_event_files - full CRUD
    {
      collection: 'project_event_files',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_event_files',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_event_files',
      action: 'delete',
      permissions: {},
    },

    // project_task_watchers - full CRUD
    {
      collection: 'project_task_watchers',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_task_watchers',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_task_watchers',
      action: 'delete',
      permissions: {},
    },
  ],

  // Regular Member permissions - read all, create/update limited
  [POLICIES.MEMBER]: [
    // project_categories - read only
    {
      collection: 'project_categories',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },

    // project_event_categories - read only
    {
      collection: 'project_event_categories',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },

    // projects - read all, create own, update own
    {
      collection: 'projects',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'projects',
      action: 'create',
      fields: [
        'name',
        'description',
        'color',
        'icon',
        'category_id',
        'start_date',
        'target_end_date',
      ],
      permissions: {},
    },
    {
      collection: 'projects',
      action: 'update',
      fields: [
        'name',
        'description',
        'color',
        'icon',
        'target_end_date',
        'actual_end_date',
        'status',
      ],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },

    // project_events - read all, create, update own
    {
      collection: 'project_events',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_events',
      action: 'create',
      fields: [
        'project_id',
        'title',
        'description',
        'event_date',
        'category_id',
        'is_milestone',
      ],
      permissions: {},
    },
    {
      collection: 'project_events',
      action: 'update',
      fields: [
        'title',
        'description',
        'event_date',
        'category_id',
        'is_milestone',
      ],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },

    // project_tasks - full access for task management (anyone can update tasks)
    {
      collection: 'project_tasks',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_tasks',
      action: 'create',
      fields: [
        'event_id',
        'title',
        'description',
        'assignee_id',
        'due_date',
        'priority',
      ],
      permissions: {},
    },
    {
      collection: 'project_tasks',
      action: 'update',
      fields: [
        'title',
        'description',
        'completed',
        'completed_at',
        'completed_by',
        'due_date',
        'priority',
        'assignee_id',
      ],
      permissions: {},
    },

    // project_event_files - read all, create
    {
      collection: 'project_event_files',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_event_files',
      action: 'create',
      fields: ['project_event_id', 'directus_files_id', 'sort'],
      permissions: {},
    },

    // project_task_watchers - read all, create, delete own
    {
      collection: 'project_task_watchers',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'project_task_watchers',
      action: 'create',
      fields: ['task_id', 'user_id'],
      permissions: {},
    },
    {
      collection: 'project_task_watchers',
      action: 'delete',
      permissions: { user_id: { _eq: '$CURRENT_USER' } },
    },
  ],
};

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
  console.log('🔐 Directus Project Permissions Setup Script');
  console.log('=============================================\n');

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
  // Step 1: Delete existing project permissions
  // ========================================
  console.log('🗑️  Step 1: Cleaning up existing project permissions...');

  let existingPermissions = [];
  try {
    existingPermissions = await client.request(readPermissions({ limit: -1 }));
    console.log(`   Found ${existingPermissions.length} total permissions`);

    // Find and delete existing permissions for project collections
    const projectPermissions = existingPermissions.filter((p) =>
      PROJECT_COLLECTIONS.includes(p.collection)
    );

    console.log(
      `   Found ${projectPermissions.length} existing project permissions`
    );

    for (const perm of projectPermissions) {
      try {
        await client.request(deletePermission(perm.id));
      } catch (error) {
        // Ignore errors
      }
    }
    console.log('   ✅ Cleaned up existing permissions');
  } catch (error) {
    console.log(
      '   ⚠️  Could not read permissions:',
      error?.errors?.[0]?.message || error?.message
    );
  }

  // ========================================
  // Step 2: Create new permissions
  // ========================================
  console.log('\n📋 Step 2: Creating permissions...');

  for (const [policyId, permissions] of Object.entries(PROJECT_PERMISSIONS)) {
    const policyName = Object.keys(POLICIES).find(
      (key) => POLICIES[key] === policyId
    );
    console.log(`\n   🎭 Setting permissions for: ${policyName}`);

    for (const perm of permissions) {
      const {
        collection,
        action,
        fields,
        permissions: permFilter,
        validation,
      } = perm;

      const permissionData = {
        policy: policyId,
        collection,
        action,
        fields: fields || ['*'],
        permissions: permFilter || {},
        validation: validation || null,
      };

      try {
        await client.request(createPermission(permissionData));
        console.log(`      ✅ ${collection}.${action}`);
      } catch (error) {
        console.log(
          `      ⚠️  ${collection}.${action}: ${error?.errors?.[0]?.message || error?.message}`
        );
      }
    }
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ Project permissions setup complete!\n');

  console.log('📊 Summary:');
  console.log('   Board Members:');
  console.log('     - Full CRUD on all project collections');
  console.log('     - Can manage categories');
  console.log('');
  console.log('   Members:');
  console.log('     - Read all projects, events, tasks');
  console.log('     - Create projects, events (own)');
  console.log('     - Update/complete any task (for collaboration)');
  console.log('     - Add files to events');
  console.log('     - Watch/unwatch tasks');
  console.log('');
  console.log('🔑 Permissions applied to:');
  PROJECT_COLLECTIONS.forEach((c) => console.log(`   - ${c}`));
}

main().catch(console.error);
