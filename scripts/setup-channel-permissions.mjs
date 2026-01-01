#!/usr/bin/env node

/**
 * Directus Channel Permissions Setup Script
 *
 * This script sets up permissions for the channel system collections.
 * Run this AFTER manually creating the collections in Directus.
 *
 * Usage:
 *   node scripts/setup-channel-permissions.mjs
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
  updatePermission,
  deletePermission,
} from '@directus/sdk';
import * as readline from 'readline';

// Policy UUIDs (Directus 11+)
const POLICIES = {
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
};

// Channel collections
const CHANNEL_COLLECTIONS = [
  'channels',
  'channel_members',
  'channel_messages',
  'channel_message_mentions',
  'channel_message_files',
];

// Permissions for channel collections
const CHANNEL_PERMISSIONS = {
  // Board Member permissions - full access to all channels
  [POLICIES.BOARD_MEMBER]: [
    // Channels - full CRUD
    {
      collection: 'channels',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channels',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channels',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channels',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    // Channel Members - full CRUD
    {
      collection: 'channel_members',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_members',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_members',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_members',
      action: 'delete',
      permissions: {},
    },
    // Channel Messages - full CRUD
    {
      collection: 'channel_messages',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_messages',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_messages',
      action: 'update',
      fields: ['*'],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    {
      collection: 'channel_messages',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    // Channel Message Mentions
    {
      collection: 'channel_message_mentions',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_message_mentions',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_message_mentions',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    // Channel Message Files
    {
      collection: 'channel_message_files',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_message_files',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'channel_message_files',
      action: 'delete',
      permissions: {},
    },
  ],

  // Regular Member permissions - only access channels they're invited to
  [POLICIES.MEMBER]: [
    // Channels - read only channels they're members of
    {
      collection: 'channels',
      action: 'read',
      fields: ['*'],
      permissions: {
        members: {
          user_id: { _eq: '$CURRENT_USER' },
        },
      },
    },
    // Channel Members - read own membership
    {
      collection: 'channel_members',
      action: 'read',
      fields: ['*'],
      permissions: {
        user_id: { _eq: '$CURRENT_USER' },
      },
    },
    {
      collection: 'channel_members',
      action: 'update',
      fields: ['notifications_enabled', 'last_read_at'],
      permissions: {
        user_id: { _eq: '$CURRENT_USER' },
      },
    },
    // Channel Messages - read messages in channels they're members of
    {
      collection: 'channel_messages',
      action: 'read',
      fields: ['*'],
      permissions: {
        channel_id: {
          members: {
            user_id: { _eq: '$CURRENT_USER' },
          },
        },
      },
    },
    {
      collection: 'channel_messages',
      action: 'create',
      fields: ['channel_id', 'content', 'parent_id'],
      permissions: {},
    },
    {
      collection: 'channel_messages',
      action: 'update',
      fields: ['content', 'is_edited'],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    {
      collection: 'channel_messages',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    // Channel Message Mentions - read own mentions
    {
      collection: 'channel_message_mentions',
      action: 'read',
      fields: ['*'],
      permissions: {
        user_id: { _eq: '$CURRENT_USER' },
      },
    },
    {
      collection: 'channel_message_mentions',
      action: 'create',
      fields: ['message_id', 'user_id'],
      permissions: {},
    },
    // Channel Message Files
    {
      collection: 'channel_message_files',
      action: 'read',
      fields: ['*'],
      permissions: {
        message_id: {
          channel_id: {
            members: {
              user_id: { _eq: '$CURRENT_USER' },
            },
          },
        },
      },
    },
    {
      collection: 'channel_message_files',
      action: 'create',
      fields: ['message_id', 'directus_files_id', 'sort'],
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
  console.log('🔐 Directus Channel Permissions Setup Script');
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
  // Step 1: Delete existing channel permissions
  // ========================================
  console.log('🗑️  Step 1: Cleaning up existing channel permissions...');

  let existingPermissions = [];
  try {
    existingPermissions = await client.request(readPermissions({ limit: -1 }));
    console.log(`   Found ${existingPermissions.length} total permissions`);

    // Find and delete existing permissions for channel collections
    const channelPermissions = existingPermissions.filter(p =>
      CHANNEL_COLLECTIONS.includes(p.collection)
    );

    console.log(`   Found ${channelPermissions.length} existing channel permissions`);

    for (const perm of channelPermissions) {
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

  for (const [policyId, permissions] of Object.entries(CHANNEL_PERMISSIONS)) {
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
  console.log('\n✨ Channel permissions setup complete!\n');

  console.log('📊 Summary:');
  console.log('   Board Members: Full access to all channels');
  console.log('   Members: Access only to channels they\'re invited to');
  console.log('');
  console.log('🔑 Permissions applied to:');
  CHANNEL_COLLECTIONS.forEach(c => console.log(`   - ${c}`));
}

main().catch(console.error);
