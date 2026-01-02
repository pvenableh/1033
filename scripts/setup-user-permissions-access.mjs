#!/usr/bin/env node

/**
 * Directus User Permissions Collection Access Setup Script
 *
 * This script sets up Directus policy permissions for the user_permissions collection.
 * Run this AFTER running setup-user-permissions.mjs to create the collection.
 *
 * Usage:
 *   node scripts/setup-user-permissions-access.mjs
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
  console.log('🔐 User Permissions Collection Access Setup Script');
  console.log('===================================================\n');

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
  // Step 1: Delete existing permissions
  // ========================================
  console.log('🗑️  Step 1: Cleaning up existing permissions...');

  try {
    const existingPermissions = await client.request(readPermissions({ limit: -1 }));
    const collectionPermissions = existingPermissions.filter(
      (p) => p.collection === 'user_permissions'
    );

    console.log(`   Found ${collectionPermissions.length} existing permissions`);

    for (const perm of collectionPermissions) {
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

  const permissions = [
    // Board members can read all user_permissions
    {
      policy: POLICIES.BOARD_MEMBER,
      collection: 'user_permissions',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },

    // Members can read their own permissions only
    // Using nested filter to check person_id.user matches current user
    {
      policy: POLICIES.MEMBER,
      collection: 'user_permissions',
      action: 'read',
      fields: ['*'],
      permissions: {
        _and: [
          {
            person_id: {
              user: {
                _eq: '$CURRENT_USER',
              },
            },
          },
        ],
      },
    },
  ];

  for (const perm of permissions) {
    try {
      await client.request(createPermission(perm));
      const policyName = Object.keys(POLICIES).find(
        (key) => POLICIES[key] === perm.policy
      );
      console.log(`   ✅ ${perm.collection}.${perm.action} for ${policyName}`);
    } catch (error) {
      console.log(
        `   ⚠️  ${perm.collection}.${perm.action}: ${error?.errors?.[0]?.message || error?.message}`
      );
    }
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ User permissions access setup complete!\n');

  console.log('📊 Summary:');
  console.log('   - Administrators: Full CRUD (via admin_access)');
  console.log('   - Board Members: Can read all user permissions');
  console.log('   - Members: Can read only their own permissions');
  console.log('');
  console.log('📌 Note: Only administrators can create, update, or delete');
  console.log('   user permissions records via the admin panel.');
}

main().catch(console.error);
