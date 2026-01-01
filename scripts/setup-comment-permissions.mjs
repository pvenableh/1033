#!/usr/bin/env node

/**
 * Directus Comment Permissions Setup Script
 *
 * This script sets up permissions for the comments system collections.
 * Run this AFTER manually creating the collections in Directus.
 *
 * Usage:
 *   node scripts/setup-comment-permissions.mjs
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

// Comment collections
const COMMENT_COLLECTIONS = [
  'comments',
  'comment_mentions',
  'comment_files',
];

// Permissions for comment collections
const COMMENT_PERMISSIONS = {
  // Board Member permissions - full access
  [POLICIES.BOARD_MEMBER]: [
    // Comments - full CRUD
    {
      collection: 'comments',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'comments',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'comments',
      action: 'update',
      fields: ['content', 'is_edited', 'is_resolved'],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    {
      collection: 'comments',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    // Comment Mentions
    {
      collection: 'comment_mentions',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'comment_mentions',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'comment_mentions',
      action: 'update',
      fields: ['notified'],
      permissions: {},
    },
    // Comment Files
    {
      collection: 'comment_files',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'comment_files',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'comment_files',
      action: 'delete',
      permissions: { comment_id: { user_created: { _eq: '$CURRENT_USER' } } },
    },
  ],

  // Regular Member permissions - can comment on items they have access to
  [POLICIES.MEMBER]: [
    // Comments - read all, create, edit/delete own
    {
      collection: 'comments',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'comments',
      action: 'create',
      fields: ['content', 'target_collection', 'target_id', 'parent_id'],
      permissions: {},
    },
    {
      collection: 'comments',
      action: 'update',
      fields: ['content', 'is_edited'],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    {
      collection: 'comments',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    // Comment Mentions - read own mentions
    {
      collection: 'comment_mentions',
      action: 'read',
      fields: ['*'],
      permissions: {
        _or: [
          { user_id: { _eq: '$CURRENT_USER' } },
          { comment_id: { user_created: { _eq: '$CURRENT_USER' } } },
        ],
      },
    },
    {
      collection: 'comment_mentions',
      action: 'create',
      fields: ['comment_id', 'user_id'],
      permissions: {},
    },
    // Comment Files
    {
      collection: 'comment_files',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'comment_files',
      action: 'create',
      fields: ['comment_id', 'directus_files_id', 'sort'],
      permissions: {},
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
  console.log('🔐 Directus Comment Permissions Setup Script');
  console.log('=============================================\n');

  // Get credentials
  const directusUrl = process.env.DIRECTUS_URL || await prompt('Directus URL (e.g., https://admin.example.com): ');
  const email = process.env.DIRECTUS_EMAIL || await prompt('Admin Email: ');
  const password = process.env.DIRECTUS_PASSWORD || await prompt('Admin Password: ');

  console.log('\n📡 Connecting to Directus...');

  // Create client and authenticate
  const client = createDirectus(directusUrl)
    .with(authentication())
    .with(rest());

  try {
    await client.login({ email, password });
    console.log('✅ Authentication successful\n');
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
    console.error('❌ Authentication failed:', errorMessage);
    process.exit(1);
  }

  // ========================================
  // Step 1: Delete existing comment permissions
  // ========================================
  console.log('🗑️  Step 1: Cleaning up existing comment permissions...');

  let existingPermissions = [];
  try {
    existingPermissions = await client.request(readPermissions({ limit: -1 }));
    console.log(`   Found ${existingPermissions.length} total permissions`);

    // Find and delete existing permissions for comment collections
    const commentPermissions = existingPermissions.filter(p =>
      COMMENT_COLLECTIONS.includes(p.collection)
    );

    console.log(`   Found ${commentPermissions.length} existing comment permissions`);

    for (const perm of commentPermissions) {
      try {
        await client.request(deletePermission(perm.id));
      } catch (error) {
        // Ignore errors
      }
    }
    console.log('   ✅ Cleaned up existing permissions');
  } catch (error) {
    console.log('   ⚠️  Could not read permissions:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 2: Create new permissions
  // ========================================
  console.log('\n📋 Step 2: Creating permissions...');

  for (const [policyId, permissions] of Object.entries(COMMENT_PERMISSIONS)) {
    const policyName = Object.keys(POLICIES).find(key => POLICIES[key] === policyId);
    console.log(`\n   🎭 Setting permissions for: ${policyName}`);

    for (const perm of permissions) {
      const { collection, action, fields, permissions: permFilter, validation } = perm;

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
        console.log(`      ⚠️  ${collection}.${action}: ${error?.errors?.[0]?.message || error?.message}`);
      }
    }
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ Comment permissions setup complete!\n');

  console.log('📊 Summary:');
  console.log('   Board Members: Full access, edit/delete own comments');
  console.log('   Members: Read all, create, edit/delete own comments');
  console.log('');
  console.log('🔑 Permissions applied to:');
  COMMENT_COLLECTIONS.forEach(c => console.log(`   - ${c}`));
}

main().catch(console.error);
