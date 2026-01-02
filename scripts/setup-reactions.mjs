#!/usr/bin/env node

/**
 * Directus Reactions Setup Script
 *
 * This script:
 * 1. Sets up permissions for reactions and reaction_types collections
 * 2. Seeds default reaction types using fluent-emoji-flat icons
 *
 * Run this AFTER manually creating the collections in Directus.
 *
 * Usage:
 *   node scripts/setup-reactions.mjs
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
  createItem,
  createItems,
  readItems,
  deleteItems,
} from '@directus/sdk';
import * as readline from 'readline';

// Policy UUIDs (Directus 11+)
const POLICIES = {
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
};

// Reaction collections
const REACTION_COLLECTIONS = ['reactions', 'reaction_types'];

// Default reaction types using fluent-emoji-flat icons
// Browse icons at: https://icones.js.org/collection/fluent-emoji-flat
const DEFAULT_REACTION_TYPES = [
  {
    name: 'Like',
    icon: 'thumbs-up',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 1,
  },
  {
    name: 'Dislike',
    icon: 'thumbs-down',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 2,
  },
  {
    name: 'Love',
    icon: 'red-heart',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 3,
  },
  {
    name: 'Haha',
    icon: 'grinning-squinting-face',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 4,
  },
  {
    name: 'Wow',
    icon: 'face-with-open-mouth',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 5,
  },
  {
    name: 'Sad',
    icon: 'crying-face',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 6,
  },
  {
    name: 'Angry',
    icon: 'pouting-face',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 7,
  },
  {
    name: 'Fire',
    icon: 'fire',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 8,
  },
  {
    name: 'Celebrate',
    icon: 'party-popper',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 9,
  },
  {
    name: 'Think',
    icon: 'thinking-face',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 10,
  },
  {
    name: 'Eyes',
    icon: 'eyes',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 11,
  },
  {
    name: 'Rocket',
    icon: 'rocket',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 12,
  },
  {
    name: '100',
    icon: 'hundred-points',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 13,
  },
  {
    name: 'Clap',
    icon: 'clapping-hands',
    icon_family: 'fluent-emoji-flat',
    emoji: null,
    status: 'published',
    sort: 14,
  },
];

// Permissions for reaction collections
const REACTION_PERMISSIONS = {
  // Board Member permissions - full access
  [POLICIES.BOARD_MEMBER]: [
    // reaction_types - read only (admin manages via Directus)
    {
      collection: 'reaction_types',
      action: 'read',
      fields: ['*'],
      permissions: { status: { _eq: 'published' } },
    },
    // reactions - full CRUD
    {
      collection: 'reactions',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'reactions',
      action: 'create',
      fields: ['collection', 'item_id', 'reaction_type'],
      permissions: {},
    },
    {
      collection: 'reactions',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },
  ],

  // Regular Member permissions
  [POLICIES.MEMBER]: [
    // reaction_types - read published only
    {
      collection: 'reaction_types',
      action: 'read',
      fields: ['*'],
      permissions: { status: { _eq: 'published' } },
    },
    // reactions - read all, create own, delete own
    {
      collection: 'reactions',
      action: 'read',
      fields: ['*'],
      permissions: {},
    },
    {
      collection: 'reactions',
      action: 'create',
      fields: ['collection', 'item_id', 'reaction_type'],
      permissions: {},
    },
    {
      collection: 'reactions',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
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
  console.log('🎉 Directus Reactions Setup Script');
  console.log('===================================\n');

  // Get credentials
  const directusUrl =
    process.env.DIRECTUS_URL ||
    (await prompt('Directus URL (e.g., https://admin.example.com): '));
  const email =
    process.env.DIRECTUS_EMAIL || (await prompt('Admin Email: '));
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
  // Step 1: Delete existing reaction permissions
  // ========================================
  console.log('🗑️  Step 1: Cleaning up existing reaction permissions...');

  let existingPermissions = [];
  try {
    existingPermissions = await client.request(readPermissions({ limit: -1 }));
    console.log(`   Found ${existingPermissions.length} total permissions`);

    // Find and delete existing permissions for reaction collections
    const reactionPermissions = existingPermissions.filter((p) =>
      REACTION_COLLECTIONS.includes(p.collection)
    );

    console.log(
      `   Found ${reactionPermissions.length} existing reaction permissions`
    );

    for (const perm of reactionPermissions) {
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

  for (const [policyId, permissions] of Object.entries(REACTION_PERMISSIONS)) {
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
  // Step 3: Seed default reaction types
  // ========================================
  console.log('\n🌱 Step 3: Seeding default reaction types...');

  try {
    // Check if reaction_types already has data
    const existingTypes = await client.request(
      readItems('reaction_types', { limit: 1 })
    );

    if (existingTypes.length > 0) {
      const answer = await prompt(
        '   ⚠️  reaction_types already has data. Replace with defaults? (y/N): '
      );

      if (answer.toLowerCase() === 'y') {
        // Delete all existing reaction types
        const allTypes = await client.request(
          readItems('reaction_types', { limit: -1, fields: ['id'] })
        );
        if (allTypes.length > 0) {
          await client.request(
            deleteItems('reaction_types', allTypes.map((t) => t.id))
          );
          console.log(`   🗑️  Deleted ${allTypes.length} existing reaction types`);
        }
      } else {
        console.log('   ⏭️  Skipping reaction type seeding');
        printSummary();
        return;
      }
    }

    // Create default reaction types
    const created = await client.request(
      createItems('reaction_types', DEFAULT_REACTION_TYPES)
    );
    console.log(`   ✅ Created ${created.length} default reaction types:`);
    for (const rt of created) {
      console.log(`      • ${rt.name} (${rt.icon_family}:${rt.icon})`);
    }
  } catch (error) {
    console.log(
      '   ⚠️  Could not seed reaction types:',
      error?.errors?.[0]?.message || error?.message
    );
    console.log('   💡 Make sure the reaction_types collection exists');
  }

  printSummary();
}

function printSummary() {
  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ Reactions setup complete!\n');

  console.log('📊 Summary:');
  console.log('   Permissions:');
  console.log('   - reaction_types: Read-only for all authenticated users');
  console.log('   - reactions: Users can create and delete their own reactions');
  console.log('');
  console.log('🎨 Default Reaction Types (fluent-emoji-flat):');
  DEFAULT_REACTION_TYPES.forEach((rt) =>
    console.log(`   • ${rt.name} → i-fluent-emoji-flat-${rt.icon}`)
  );
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Add these collections to package.json scripts:');
  console.log('      "setup:reactions": "node scripts/setup-reactions.mjs"');
  console.log('');
  console.log('   2. For performance, run this SQL on your database:');
  console.log('      CREATE INDEX idx_reactions_collection_item');
  console.log('        ON reactions (collection, item_id);');
  console.log('');
  console.log('   3. To prevent duplicates, run this SQL:');
  console.log('      ALTER TABLE reactions');
  console.log('        ADD CONSTRAINT unique_user_reaction');
  console.log('        UNIQUE (collection, item_id, reaction_type, user_created);');
}

main().catch(console.error);
