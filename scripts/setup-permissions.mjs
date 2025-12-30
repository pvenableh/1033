#!/usr/bin/env node

/**
 * Directus Permissions Setup Script
 *
 * This script sets up role-based permissions for the 1033 Lenox HOA platform.
 *
 * Usage:
 *   node scripts/setup-permissions.mjs
 *
 * Environment variables (or will prompt):
 *   DIRECTUS_URL - Your Directus instance URL
 *   DIRECTUS_EMAIL - Admin email
 *   DIRECTUS_PASSWORD - Admin password
 */

import { createDirectus, rest, authentication, readRoles, createPermission, readPermissions, updatePermission, deletePermission, readPolicies, createPolicy, updatePolicy } from '@directus/sdk';
import * as readline from 'readline';

// Role UUIDs from your Directus instance
const ROLES = {
  ADMINISTRATOR: '7913bfde-8ec9-4c51-8ecf-7efdb160a36d',
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
  PENDING: 'd45c208e-4223-41ef-85e8-24e0528d65ab',
};

// Permission definitions
const PERMISSIONS = {
  // ============================================
  // ADMINISTRATOR - Full access (handled by admin_access flag, but we define some explicit ones)
  // ============================================
  [ROLES.ADMINISTRATOR]: [
    // Admins have full access via admin_access flag
  ],

  // ============================================
  // BOARD MEMBER - Access to tasks, financials, meetings, and member features
  // ============================================
  [ROLES.BOARD_MEMBER]: [
    // Users - read own, update own
    {
      collection: 'directus_users',
      action: 'read',
      fields: ['*'],
      permissions: { id: { _eq: '$CURRENT_USER' } },
    },
    {
      collection: 'directus_users',
      action: 'update',
      fields: ['first_name', 'last_name', 'email', 'phone', 'avatar', 'password', 'theme', 'language'],
      permissions: { id: { _eq: '$CURRENT_USER' } },
    },

    // People - read all, update linked
    {
      collection: 'people',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'people',
      action: 'update',
      fields: ['first_name', 'last_name', 'email', 'phone', 'image', 'mailing_address'],
      permissions: { email: { _eq: '$CURRENT_USER.email' } },
    },

    // Units - read all (for board oversight)
    {
      collection: 'units',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },

    // Pets - CRUD for own unit's pets
    {
      collection: 'pets',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'pets',
      action: 'create',
      fields: ['*'],
      permissions: {},
      validation: {},
    },
    {
      collection: 'pets',
      action: 'update',
      fields: ['*'],
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },
    {
      collection: 'pets',
      action: 'delete',
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },

    // Vehicles - CRUD for own unit's vehicles
    {
      collection: 'vehicles',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'vehicles',
      action: 'create',
      fields: ['*'],
      permissions: {},
      validation: {},
    },
    {
      collection: 'vehicles',
      action: 'update',
      fields: ['*'],
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },
    {
      collection: 'vehicles',
      action: 'delete',
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },

    // Tasks - full CRUD
    {
      collection: 'tasks',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'tasks',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'tasks',
      action: 'update',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'tasks',
      action: 'delete',
      permissions: {},
    },

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
      fields: ['*'],
      permissions: { user: { _eq: '$CURRENT_USER' } },
    },
    {
      collection: 'comments',
      action: 'delete',
      permissions: { user: { _eq: '$CURRENT_USER' } },
    },

    // Announcements - read all
    {
      collection: 'announcements',
      action: 'read',
      fields: ['*'],
      permissions: { status: { _eq: 'published' } },
    },

    // Meetings - read all
    {
      collection: 'meetings',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },

    // Documents - read all
    {
      collection: 'documents',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },

    // Projects - read published
    {
      collection: 'projects',
      action: 'read',
      fields: ['*'],
      permissions: { status: { _eq: 'published' } },
    },

    // Files - read and upload
    {
      collection: 'directus_files',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'directus_files',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
  ],

  // ============================================
  // MEMBER - Standard resident/owner access
  // ============================================
  [ROLES.MEMBER]: [
    // Users - read own, update own
    {
      collection: 'directus_users',
      action: 'read',
      fields: ['id', 'first_name', 'last_name', 'email', 'phone', 'avatar', 'role', 'status'],
      permissions: { id: { _eq: '$CURRENT_USER' } },
    },
    {
      collection: 'directus_users',
      action: 'update',
      fields: ['first_name', 'last_name', 'phone', 'avatar', 'password'],
      permissions: { id: { _eq: '$CURRENT_USER' } },
    },

    // People - read linked, update own
    {
      collection: 'people',
      action: 'read',
      fields: ['id', 'first_name', 'last_name', 'email', 'phone', 'image', 'category', 'is_owner', 'is_resident', 'unit'],
      permissions: {
        _or: [
          { email: { _eq: '$CURRENT_USER.email' } },
          { unit: { units_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } } },
        ],
      },
    },
    {
      collection: 'people',
      action: 'update',
      fields: ['phone', 'image', 'mailing_address'],
      permissions: { email: { _eq: '$CURRENT_USER.email' } },
    },

    // Units - read own
    {
      collection: 'units',
      action: 'read',
      fields: ['id', 'number', 'occupant', 'parking_spot', 'people', 'vehicles', 'pets'],
      permissions: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } },
    },

    // Pets - CRUD for own unit's pets
    {
      collection: 'pets',
      action: 'read',
      fields: ['*'],
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },
    {
      collection: 'pets',
      action: 'create',
      fields: ['name', 'category', 'breed', 'weight', 'image', 'unit_id'],
      permissions: {},
      validation: {},
    },
    {
      collection: 'pets',
      action: 'update',
      fields: ['name', 'category', 'breed', 'weight', 'image'],
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },
    {
      collection: 'pets',
      action: 'delete',
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },

    // Vehicles - CRUD for own unit's vehicles
    {
      collection: 'vehicles',
      action: 'read',
      fields: ['*'],
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },
    {
      collection: 'vehicles',
      action: 'create',
      fields: ['make', 'model', 'color', 'license_plate', 'state', 'category', 'image', 'unit_id'],
      permissions: {},
      validation: {},
    },
    {
      collection: 'vehicles',
      action: 'update',
      fields: ['make', 'model', 'color', 'license_plate', 'state', 'category', 'image'],
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },
    {
      collection: 'vehicles',
      action: 'delete',
      permissions: { unit_id: { people: { people_id: { email: { _eq: '$CURRENT_USER.email' } } } } },
    },

    // Announcements - read published
    {
      collection: 'announcements',
      action: 'read',
      fields: ['*'],
      permissions: { status: { _eq: 'published' } },
    },

    // Meetings - read published
    {
      collection: 'meetings',
      action: 'read',
      fields: ['*'],
      permissions: { status: { _eq: 'published' } },
    },

    // Projects - read published
    {
      collection: 'projects',
      action: 'read',
      fields: ['*'],
      permissions: { status: { _eq: 'published' } },
    },

    // Files - read and upload own
    {
      collection: 'directus_files',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'directus_files',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },

    // Requests/Inquiries - CRUD own
    {
      collection: 'requests',
      action: 'read',
      fields: ['*'],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
    {
      collection: 'requests',
      action: 'create',
      fields: ['*'],
      permissions: {},
    },
  ],

  // ============================================
  // PENDING - Minimal access while awaiting approval
  // ============================================
  [ROLES.PENDING]: [
    // Users - read own only
    {
      collection: 'directus_users',
      action: 'read',
      fields: ['id', 'first_name', 'last_name', 'email', 'status', 'role'],
      permissions: { id: { _eq: '$CURRENT_USER' } },
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
  console.log('🔐 Directus 11 Permissions Setup Script');
  console.log('========================================\n');
  console.log('ℹ️  Directus 11 uses Policies for permissions.\n');

  // Get credentials
  const directusUrl = process.env.DIRECTUS_URL || await prompt('Directus URL (e.g., https://admin.1033lenox.com): ');
  const email = process.env.DIRECTUS_EMAIL || await prompt('Admin Email: ');
  const password = process.env.DIRECTUS_PASSWORD || await prompt('Admin Password: ');

  console.log('\n📡 Connecting to Directus...');

  // Create client and authenticate
  const client = createDirectus(directusUrl)
    .with(authentication())
    .with(rest());

  try {
    await client.login(email, password);
    console.log('✅ Authentication successful\n');
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
    console.error('❌ Authentication failed:', errorMessage);
    process.exit(1);
  }

  // Get existing policies
  console.log('📋 Fetching existing policies...');
  let existingPolicies = [];
  try {
    existingPolicies = await client.request(readPolicies({ limit: -1, fields: ['*', 'roles.*'] }));
    console.log(`   Found ${existingPolicies.length} existing policies\n`);
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
    console.log(`   Unable to read policies: ${errorMessage}\n`);
  }

  // Get existing permissions
  console.log('📋 Fetching existing permissions...');
  let existingPermissions = [];
  try {
    existingPermissions = await client.request(readPermissions({ limit: -1 }));
    console.log(`   Found ${existingPermissions.length} existing permissions\n`);
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
    console.log(`   Unable to read permissions: ${errorMessage}\n`);
  }

  // Map role IDs to their policies
  const roleToPolicyMap = {};
  for (const policy of existingPolicies) {
    if (policy.roles) {
      for (const roleLink of policy.roles) {
        const roleId = typeof roleLink === 'object' ? roleLink.role : roleLink;
        if (!roleToPolicyMap[roleId]) {
          roleToPolicyMap[roleId] = [];
        }
        roleToPolicyMap[roleId].push(policy.id);
      }
    }
  }

  console.log('📊 Role to Policy mapping:');
  for (const [roleId, policyIds] of Object.entries(roleToPolicyMap)) {
    const roleName = Object.keys(ROLES).find(key => ROLES[key] === roleId) || 'Unknown';
    console.log(`   ${roleName}: ${policyIds.length} policies`);
  }
  console.log('');

  // Process each role
  for (const [roleId, permissions] of Object.entries(PERMISSIONS)) {
    const roleName = Object.keys(ROLES).find(key => ROLES[key] === roleId);
    console.log(`\n🎭 Setting up permissions for: ${roleName}`);
    console.log(`   Role ID: ${roleId}`);

    if (permissions.length === 0) {
      console.log('   ⏭️  No custom permissions needed (uses admin_access flag)');
      continue;
    }

    // Find or note the policy for this role
    const policyIds = roleToPolicyMap[roleId] || [];
    const policyId = policyIds[0]; // Use the first policy if multiple exist

    if (!policyId) {
      console.log(`   ⚠️  No policy found for this role. Create a policy in Directus Admin first.`);
      console.log(`      Go to Settings > Access Control > Policies, create a policy, and attach it to this role.`);
      continue;
    }

    console.log(`   📜 Using policy ID: ${policyId}`);

    for (const perm of permissions) {
      const { collection, action, fields, permissions: permFilter, validation } = perm;

      // Check if permission already exists for this policy
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
          // Update existing permission
          await client.request(updatePermission(existing.id, permissionData));
          console.log(`   ✏️  Updated: ${collection}.${action}`);
        } else {
          // Create new permission
          await client.request(createPermission(permissionData));
          console.log(`   ✅ Created: ${collection}.${action}`);
        }
      } catch (error) {
        // Directus SDK errors have different structures
        const errorMessage = error?.errors?.[0]?.message
          || error?.message
          || JSON.stringify(error);
        console.log(`   ⚠️  Error with ${collection}.${action}: ${errorMessage}`);
      }
    }
  }

  console.log('\n✨ Permission setup complete!\n');

  // Summary
  console.log('📊 Summary:');
  console.log('   - Administrator: Full access via admin_access flag');
  console.log('   - Board Member: Tasks, meetings, financials, all member features');
  console.log('   - Member: Own profile, unit, pets, vehicles, announcements');
  console.log('   - Pending: Read own user record only');
  console.log('\n🔑 Users can now:');
  console.log('   - Update their own profile information');
  console.log('   - Manage pets and vehicles for their unit');
  console.log('   - View announcements and meetings');
  console.log('   - Submit requests/inquiries');
  console.log('\n⚠️  Note: If you see "No policy found", create policies in Directus Admin:');
  console.log('   Settings > Access Control > Policies > Create Policy > Attach to Role');
}

main().catch(console.error);
