#!/usr/bin/env node

/**
 * Directus Comments System Setup Script
 *
 * This script sets up an improved comments system with:
 * - Rich text support (HTML content from Tiptap)
 * - @mentions with notifications
 * - File attachments
 * - Threaded replies
 * - Generic target collection/item linking
 *
 * Collections created:
 * 1. comments - The comment content
 * 2. comment_mentions - Tracking @mentions for notifications
 * 3. comment_files - File attachments for comments
 *
 * Usage:
 *   node scripts/setup-comments.mjs
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
  readFields,
  readFolders,
  createFolder,
  createPermission,
  readPermissions,
  updatePermission,
  deleteCollection,
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

// Collections to potentially delete (old comments system)
const OLD_COLLECTIONS_TO_DELETE = [
  'tasks_comments',
  'tickets_comments',
  'projects_comments',
  // Add other junction tables if they exist
];

// Comment collections schema
const COLLECTIONS = {
  comments: {
    collection: 'comments',
    meta: {
      collection: 'comments',
      icon: 'chat_bubble',
      note: 'Comments with rich text, mentions, and file attachments',
      display_template: '{{content}}',
      sort_field: 'date_created',
      singleton: false,
      hidden: false,
    },
    schema: {
      name: 'comments',
    },
  },
  comment_mentions: {
    collection: 'comment_mentions',
    meta: {
      collection: 'comment_mentions',
      icon: 'alternate_email',
      note: 'Tracking @mentions for notifications',
      hidden: true,
      singleton: false,
    },
    schema: {
      name: 'comment_mentions',
    },
  },
  comment_files: {
    collection: 'comment_files',
    meta: {
      collection: 'comment_files',
      icon: 'attach_file',
      note: 'File attachments for comments',
      hidden: true,
      singleton: false,
    },
    schema: {
      name: 'comment_files',
    },
  },
};

// Field definitions for each collection
const FIELDS = {
  comments: [
    {
      field: 'id',
      type: 'uuid',
      meta: {
        hidden: true,
        readonly: true,
        interface: 'input',
        special: ['uuid'],
      },
      schema: {
        is_primary_key: true,
        has_auto_increment: false,
      },
    },
    {
      field: 'user_created',
      type: 'uuid',
      meta: {
        special: ['user-created'],
        interface: 'select-dropdown-m2o',
        display: 'user',
        readonly: true,
        width: 'half',
      },
      schema: {},
    },
    {
      field: 'date_created',
      type: 'timestamp',
      meta: {
        special: ['date-created'],
        interface: 'datetime',
        display: 'datetime',
        readonly: true,
        width: 'half',
      },
      schema: {},
    },
    {
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        special: ['date-updated'],
        interface: 'datetime',
        display: 'datetime',
        readonly: true,
        hidden: true,
      },
      schema: {},
    },
    {
      field: 'content',
      type: 'text',
      meta: {
        interface: 'input-rich-text-html',
        display: 'formatted-value',
        width: 'full',
        note: 'Comment content (supports rich text with mentions)',
      },
      schema: {
        is_nullable: false,
      },
    },
    {
      field: 'target_collection',
      type: 'string',
      meta: {
        interface: 'input',
        display: 'raw',
        width: 'half',
        required: true,
        note: 'The collection this comment belongs to (e.g., "tasks", "tickets")',
      },
      schema: {
        is_nullable: false,
      },
    },
    {
      field: 'target_id',
      type: 'string',
      meta: {
        interface: 'input',
        display: 'raw',
        width: 'half',
        required: true,
        note: 'The ID of the item this comment belongs to',
      },
      schema: {
        is_nullable: false,
      },
    },
    {
      field: 'parent_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'related-values',
        note: 'Parent comment for threaded replies',
      },
      schema: {},
    },
    {
      field: 'is_edited',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        display: 'boolean',
        hidden: true,
      },
      schema: {
        default_value: false,
      },
    },
    {
      field: 'is_resolved',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        display: 'boolean',
        width: 'half',
        note: 'Mark comment as resolved (for feedback/review comments)',
      },
      schema: {
        default_value: false,
      },
    },
    {
      field: 'mentions',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
        hidden: true,
      },
    },
    {
      field: 'files',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
      },
    },
    {
      field: 'replies',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
        hidden: true,
      },
    },
  ],
  comment_mentions: [
    {
      field: 'id',
      type: 'integer',
      meta: {
        hidden: true,
        interface: 'input',
        readonly: true,
      },
      schema: {
        is_primary_key: true,
        has_auto_increment: true,
      },
    },
    {
      field: 'comment_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'related-values',
        required: true,
      },
      schema: {
        is_nullable: false,
      },
    },
    {
      field: 'user_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'user',
        required: true,
        note: 'The user being mentioned',
      },
      schema: {
        is_nullable: false,
      },
    },
    {
      field: 'notified',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        display: 'boolean',
        note: 'Whether notification was sent',
      },
      schema: {
        default_value: false,
      },
    },
    {
      field: 'date_created',
      type: 'timestamp',
      meta: {
        special: ['date-created'],
        interface: 'datetime',
        display: 'datetime',
        readonly: true,
        hidden: true,
      },
      schema: {},
    },
  ],
  comment_files: [
    {
      field: 'id',
      type: 'integer',
      meta: {
        hidden: true,
        interface: 'input',
        readonly: true,
      },
      schema: {
        is_primary_key: true,
        has_auto_increment: true,
      },
    },
    {
      field: 'comment_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'related-values',
        required: true,
      },
      schema: {
        is_nullable: false,
      },
    },
    {
      field: 'directus_files_id',
      type: 'uuid',
      meta: {
        interface: 'file',
        special: ['file'],
        display: 'file',
        required: true,
      },
      schema: {
        is_nullable: false,
      },
    },
    {
      field: 'sort',
      type: 'integer',
      meta: {
        interface: 'input',
        hidden: true,
      },
      schema: {},
    },
  ],
};

// Relationships between collections
// Note: Removed CASCADE to avoid FK constraint issues
const RELATIONS = [
  // comments -> comments (parent for threads)
  {
    collection: 'comments',
    field: 'parent_id',
    related_collection: 'comments',
    meta: {
      one_field: 'replies',
      sort_field: null,
      one_deselect_action: 'nullify',
    },
  },
  // comment_mentions -> comments
  {
    collection: 'comment_mentions',
    field: 'comment_id',
    related_collection: 'comments',
    meta: {
      one_field: 'mentions',
      sort_field: null,
      one_deselect_action: 'nullify',
    },
  },
  // comment_mentions -> directus_users
  {
    collection: 'comment_mentions',
    field: 'user_id',
    related_collection: 'directus_users',
    meta: {
      one_field: null,
      sort_field: null,
      one_deselect_action: 'nullify',
    },
  },
  // comment_files -> comments
  {
    collection: 'comment_files',
    field: 'comment_id',
    related_collection: 'comments',
    meta: {
      one_field: 'files',
      sort_field: 'sort',
      one_deselect_action: 'nullify',
    },
  },
  // comment_files -> directus_files
  {
    collection: 'comment_files',
    field: 'directus_files_id',
    related_collection: 'directus_files',
    meta: {
      one_field: null,
      sort_field: null,
      one_deselect_action: 'nullify',
    },
  },
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
      permissions: { user_created: { _eq: '$CURRENT_USER' } }, // Only edit own comments
    },
    {
      collection: 'comments',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } }, // Only delete own comments
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
  console.log('💬 Directus Comments System Setup Script');
  console.log('=========================================\n');

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
    await client.login({ email, password });
    console.log('✅ Authentication successful\n');
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
    console.error('❌ Authentication failed:', errorMessage);
    process.exit(1);
  }

  // ========================================
  // Step 1: Check for old collections to delete
  // ========================================
  console.log('🗑️  Step 1: Checking for old comment junction tables...');

  let existingCollections = [];
  try {
    existingCollections = await client.request(readCollections());
    const existingNames = existingCollections.map(c => c.collection);

    for (const oldCollection of OLD_COLLECTIONS_TO_DELETE) {
      if (existingNames.includes(oldCollection)) {
        const shouldDelete = await prompt(`   Found "${oldCollection}". Delete it? (y/n): `);
        if (shouldDelete.toLowerCase() === 'y') {
          try {
            await client.request(deleteCollection(oldCollection));
            console.log(`   ✅ Deleted: ${oldCollection}`);
          } catch (error) {
            console.log(`   ⚠️  Could not delete ${oldCollection}: ${error?.errors?.[0]?.message || error?.message}`);
          }
        } else {
          console.log(`   ⏭️  Skipping: ${oldCollection}`);
        }
      }
    }

    // Check if old 'comments' collection exists
    if (existingNames.includes('comments')) {
      const shouldRecreate = await prompt('   Found existing "comments" collection. Delete and recreate? (y/n): ');
      if (shouldRecreate.toLowerCase() === 'y') {
        try {
          await client.request(deleteCollection('comments'));
          console.log('   ✅ Deleted old comments collection');
          // Remove from existing so it gets created
          existingCollections = existingCollections.filter(c => c.collection !== 'comments');
        } catch (error) {
          console.log(`   ⚠️  Could not delete comments: ${error?.errors?.[0]?.message || error?.message}`);
        }
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not read collections:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 2: Create uploads folder for comment files
  // ========================================
  console.log('\n📁 Step 2: Creating comment uploads folder...');

  let commentsFolderId = null;
  try {
    const folders = await client.request(readFolders({
      filter: { name: { _eq: 'Comment Uploads' } },
    }));

    if (folders && folders.length > 0) {
      commentsFolderId = folders[0].id;
      console.log(`   ✅ Folder already exists: ${commentsFolderId}`);
    } else {
      const newFolder = await client.request(createFolder({
        name: 'Comment Uploads',
      }));
      commentsFolderId = newFolder.id;
      console.log(`   ✅ Created folder: ${commentsFolderId}`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not create folder:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 3: Create collections
  // ========================================
  console.log('\n📋 Step 3: Creating collections...');

  const existingNames = existingCollections.map(c => c.collection);

  for (const [name, config] of Object.entries(COLLECTIONS)) {
    if (existingNames.includes(name)) {
      console.log(`   ⏭️  Skipping ${name} (already exists)`);
      continue;
    }

    try {
      await client.request(createCollection(config));
      console.log(`   ✅ Created collection: ${name}`);
      await delay(500); // Wait for collection to be fully created
    } catch (error) {
      console.log(`   ❌ Error creating ${name}:`, error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 4: Create fields for each collection
  // ========================================
  console.log('\n📋 Step 4: Creating fields...');

  // Skip M2O and file fields - they'll be created by relation step
  const SKIP_SPECIALS = ['m2o', 'file'];

  for (const [collectionName, fields] of Object.entries(FIELDS)) {
    console.log(`\n   📝 Fields for ${collectionName}:`);

    let existingFields = [];
    try {
      existingFields = await client.request(readFields(collectionName));
    } catch (error) {
      // Collection might not exist yet
    }

    // Only consider fields with schema as real database columns (not alias fields)
    const existingDbColumns = existingFields
      .filter(f => f.schema !== null && f.schema !== undefined)
      .map(f => f.field);

    for (const field of fields) {
      // Skip alias fields (type 'alias') - they don't need database columns
      if (field.type === 'alias') {
        console.log(`      ⏭️  ${field.field} (alias field)`);
        continue;
      }

      if (existingDbColumns.includes(field.field)) {
        console.log(`      ⏭️  ${field.field} (exists)`);
        continue;
      }

      // Skip M2O/file fields - they'll be created when we create relations
      const fieldSpecials = field.meta?.special || [];
      const isRelationField = fieldSpecials.some(s => SKIP_SPECIALS.includes(s));

      if (isRelationField) {
        console.log(`      ⏭️  ${field.field} (deferred to relation step)`);
        continue;
      }

      try {
        await client.request(createField(collectionName, field));
        console.log(`      ✅ ${field.field}`);
        await delay(200); // Small delay between fields
      } catch (error) {
        console.log(`      ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
      }
    }
  }

  // Wait before creating relationships
  console.log('\n   ⏳ Waiting for schema to sync...');
  await delay(2000);

  // ========================================
  // Step 5: Create relationships (and their FK fields)
  // ========================================
  console.log('\n📋 Step 5: Creating relationships...');

  // Helper to get field definition from FIELDS
  const getFieldDef = (collection, fieldName) => {
    const collectionFields = FIELDS[collection] || [];
    return collectionFields.find(f => f.field === fieldName);
  };

  for (const relation of RELATIONS) {
    const { collection, field: fieldName, related_collection } = relation;

    // First, ensure the FK field exists as a real database column
    let existingFields = [];
    try {
      existingFields = await client.request(readFields(collection));
    } catch (error) {
      // Collection might not exist
    }

    // Only consider fields with schema as real database columns
    const existingDbColumns = existingFields
      .filter(f => f.schema !== null && f.schema !== undefined)
      .map(f => f.field);

    const fieldExists = existingDbColumns.includes(fieldName);

    if (!fieldExists) {
      // Get field definition or create a default UUID field
      const fieldDef = getFieldDef(collection, fieldName);
      const fieldToCreate = {
        field: fieldName,
        type: 'uuid',
        schema: {
          is_nullable: fieldDef?.schema?.is_nullable ?? true,
        },
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
        console.log(`   ✅ Created field: ${collection}.${fieldName}`);
        await delay(300);
      } catch (error) {
        const msg = error?.errors?.[0]?.message || error?.message || '';
        console.log(`   ⚠️  Field ${collection}.${fieldName}: ${msg}`);
      }
    }

    // Now create the relation
    try {
      await client.request(createRelation(relation));
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
  // Step 6: Set up permissions
  // ========================================
  console.log('\n📋 Step 6: Setting up permissions...');

  let existingPermissions = [];
  try {
    existingPermissions = await client.request(readPermissions({ limit: -1 }));
    console.log(`   Found ${existingPermissions.length} existing permissions`);
  } catch (error) {
    console.log('   ⚠️  Could not read permissions:', error?.errors?.[0]?.message || error?.message);
  }

  for (const [policyId, permissions] of Object.entries(COMMENT_PERMISSIONS)) {
    const policyName = Object.keys(POLICIES).find(key => POLICIES[key] === policyId);
    console.log(`\n   🎭 Setting permissions for: ${policyName}`);

    for (const perm of permissions) {
      const { collection, action, fields, permissions: permFilter, validation } = perm;

      // Check if permission already exists
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
  console.log('\n✨ Comments system setup complete!\n');

  console.log('📊 Summary:');
  console.log('   Collections created:');
  console.log('   - comments: Main comments with rich text support');
  console.log('   - comment_mentions: @mention tracking');
  console.log('   - comment_files: File attachments');
  console.log('');
  console.log('   Features:');
  console.log('   - Rich HTML content (links, formatting, images)');
  console.log('   - @mentions with notification integration');
  console.log('   - Threaded replies (parent_id)');
  console.log('   - File attachments');
  console.log('   - Resolved status for feedback comments');
  console.log('   - Generic target_collection/target_id linking');
  console.log('');
  if (commentsFolderId) {
    console.log(`   📁 Comment uploads folder ID: ${commentsFolderId}`);
  }
  console.log('');
  console.log('🔑 Usage:');
  console.log('   Comments can be attached to any item by setting:');
  console.log('   - target_collection: "tasks", "tickets", "projects", etc.');
  console.log('   - target_id: The ID of the item');
}

main().catch(console.error);
