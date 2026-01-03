#!/usr/bin/env node

/**
 * Directus Permissions Setup Script for Notices, Announcements, and Email Activity
 *
 * This script sets up Directus permissions (policies) for:
 * - notices: In-app notices (new collection)
 * - announcements: Email announcements (existing collection)
 * - email_activity: SendGrid webhook tracking (existing collection)
 *
 * Permission Strategy:
 * - Administrators: Full access (already have via admin role)
 * - Board Members: Full CRUD access
 * - Members: Read access to published notices (filtered by visibility)
 * - Public: Read access to public notices only
 *
 * Note: The app's server routes also check user_permissions for granular control
 * beyond these base Directus permissions.
 *
 * Usage:
 *   node scripts/setup-notices-permissions.mjs
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
  updatePermission,
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

// Policy UUIDs (Directus 11+ uses policies instead of roles for permissions)
const POLICIES = {
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
  PENDING: '2a9627a9-424d-472f-aaf1-478948d7549b',
};

// Collections to set up permissions for
const COLLECTIONS = ['notices', 'announcements', 'email_activity'];

// Permission configurations
const PERMISSIONS_CONFIG = {
  notices: {
    // Board members: Full CRUD
    board: [
      { action: 'create', fields: '*', permissions: {} },
      { action: 'read', fields: '*', permissions: {} },
      { action: 'update', fields: '*', permissions: {} },
      { action: 'delete', permissions: {} },
    ],
    // Members: Read published notices they have access to
    member: [
      {
        action: 'read',
        fields: '*',
        permissions: {
          _and: [
            { status: { _eq: 'published' } },
            {
              _or: [
                { visibility: { _contains: 'residents' } },
                { visibility: { _contains: 'public' } },
              ],
            },
            {
              _or: [
                { published_at: { _lte: '$NOW' } },
                { published_at: { _null: true } },
              ],
            },
            {
              _or: [
                { expires_at: { _gte: '$NOW' } },
                { expires_at: { _null: true } },
              ],
            },
          ],
        },
      },
    ],
    // Public: Read published public notices only
    public: [
      {
        action: 'read',
        fields: '*',
        permissions: {
          _and: [
            { status: { _eq: 'published' } },
            { visibility: { _contains: 'public' } },
            {
              _or: [
                { published_at: { _lte: '$NOW' } },
                { published_at: { _null: true } },
              ],
            },
            {
              _or: [
                { expires_at: { _gte: '$NOW' } },
                { expires_at: { _null: true } },
              ],
            },
          ],
        },
      },
    ],
  },
  announcements: {
    // Board members: Full CRUD
    board: [
      { action: 'create', fields: '*', permissions: {} },
      { action: 'read', fields: '*', permissions: {} },
      { action: 'update', fields: '*', permissions: {} },
      { action: 'delete', permissions: {} },
    ],
    // Members: Read sent announcements only
    member: [
      {
        action: 'read',
        fields: '*',
        permissions: {
          status: { _eq: 'sent' },
        },
      },
    ],
    // Public: Read sent announcements (for public viewing)
    public: [
      {
        action: 'read',
        fields: ['id', 'title', 'subtitle', 'content', 'url', 'date_sent', 'status', 'tags'],
        permissions: {
          status: { _eq: 'sent' },
        },
      },
    ],
  },
  email_activity: {
    // Board members: Full read access (no create/update/delete - webhook only)
    board: [
      { action: 'read', fields: '*', permissions: {} },
    ],
    // Members: No access by default (can be granted via user_permissions)
    member: [],
    // Public: No access
    public: [],
  },
  // Junction table for announcements recipients
  announcements_people: {
    board: [
      { action: 'create', fields: '*', permissions: {} },
      { action: 'read', fields: '*', permissions: {} },
      { action: 'update', fields: '*', permissions: {} },
      { action: 'delete', permissions: {} },
    ],
    member: [
      { action: 'read', fields: '*', permissions: {} },
    ],
    public: [],
  },
};

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
  console.log('\n🔐 Directus Permissions Setup for Notices/Announcements/Email Activity\n');
  console.log('This script will set up permissions for the notification-related collections.\n');

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

    // Get existing permissions
    console.log('\n📋 Fetching existing permissions...');
    const existingPermissions = await client.request(readPermissions({
      filter: {
        collection: { _in: [...COLLECTIONS, 'announcements_people'] },
      },
    }));
    console.log(`   Found ${existingPermissions.length} existing permissions`);

    // Process each collection
    for (const collection of [...COLLECTIONS, 'announcements_people']) {
      console.log(`\n📦 Setting up permissions for: ${collection}`);

      const config = PERMISSIONS_CONFIG[collection];
      if (!config) {
        console.log(`   ⚠️  No configuration found for ${collection}, skipping`);
        continue;
      }

      // Board member permissions
      if (config.board && config.board.length > 0) {
        console.log('   Setting up Board Member permissions...');
        for (const perm of config.board) {
          await createOrUpdatePermission(client, existingPermissions, {
            collection,
            policy: POLICIES.BOARD_MEMBER,
            ...perm,
          });
          await delay(100);
        }
      }

      // Member permissions
      if (config.member && config.member.length > 0) {
        console.log('   Setting up Member permissions...');
        for (const perm of config.member) {
          await createOrUpdatePermission(client, existingPermissions, {
            collection,
            policy: POLICIES.MEMBER,
            ...perm,
          });
          await delay(100);
        }
      }

      // Public permissions
      if (config.public && config.public.length > 0) {
        console.log('   Setting up Public permissions...');
        for (const perm of config.public) {
          await createOrUpdatePermission(client, existingPermissions, {
            collection,
            role: null, // null role = public
            ...perm,
          });
          await delay(100);
        }
      }
    }

    console.log('\n✨ Permissions setup complete!\n');
    console.log('Summary:');
    console.log('- Board Members: Full access to notices, announcements, email_activity');
    console.log('- Members: Read access to published notices and sent announcements');
    console.log('- Public: Read access to public notices and sent announcements');
    console.log('\nNote: Your app\'s server routes also check user_permissions for additional');
    console.log('granular control. Make sure to add notices_approved field to user_permissions');
    console.log('if you want per-user notice management capabilities.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  -', e.message));
    }
    process.exit(1);
  }
}

async function createOrUpdatePermission(client, existingPermissions, permData) {
  const { collection, action, policy, role, fields, permissions } = permData;

  // Find existing permission
  const existing = existingPermissions.find(p =>
    p.collection === collection &&
    p.action === action &&
    (policy ? p.policy === policy : p.role === role)
  );

  const permissionPayload = {
    collection,
    action,
    ...(policy && { policy }),
    ...(role !== undefined && { role }),
    ...(fields && { fields: Array.isArray(fields) ? fields : ['*'] }),
    ...(permissions && { permissions }),
  };

  try {
    if (existing) {
      // Update existing
      await client.request(updatePermission(existing.id, permissionPayload));
      console.log(`      ✓ Updated ${action} permission`);
    } else {
      // Create new
      await client.request(createPermission(permissionPayload));
      console.log(`      ✓ Created ${action} permission`);
    }
  } catch (error) {
    // Permission might already exist with same settings
    if (error.message?.includes('already exists') || error.errors?.[0]?.message?.includes('already exists')) {
      console.log(`      ⚠️  ${action} permission already exists`);
    } else {
      console.log(`      ⚠️  Could not set ${action} permission: ${error.message}`);
    }
  }
}

main();
