#!/usr/bin/env node

/**
 * Directus Channels System Setup Script
 *
 * This script sets up a Slack-like channel system for board member communication:
 *
 * Collections created:
 * 1. channels - The channel/room itself
 * 2. channel_members - Junction table for invited members (non-board users)
 * 3. channel_messages - Messages within channels
 * 4. channel_message_mentions - Tracking @mentions for notifications
 *
 * Permissions:
 * - Board Members: Full access to all channels
 * - Regular Members: Only access channels they're explicitly invited to
 * - Admins: Full access to everything
 *
 * Usage:
 *   node scripts/setup-channels.mjs
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
} from '@directus/sdk';
import * as readline from 'readline';

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

// Channel collections schema
const COLLECTIONS = {
  channels: {
    collection: 'channels',
    meta: {
      collection: 'channels',
      icon: 'chat',
      note: 'Communication channels for board members and invited guests',
      display_template: '{{name}}',
      sort_field: 'sort',
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'active',
      singleton: false,
      translations: null,
    },
    schema: {
      name: 'channels',
    },
  },
  channel_members: {
    collection: 'channel_members',
    meta: {
      collection: 'channel_members',
      icon: 'group_add',
      note: 'Junction table for channel invitations (non-board members)',
      hidden: true,
      singleton: false,
    },
    schema: {
      name: 'channel_members',
    },
  },
  channel_messages: {
    collection: 'channel_messages',
    meta: {
      collection: 'channel_messages',
      icon: 'message',
      note: 'Messages within channels',
      sort_field: 'date_created',
      singleton: false,
    },
    schema: {
      name: 'channel_messages',
    },
  },
  channel_message_mentions: {
    collection: 'channel_message_mentions',
    meta: {
      collection: 'channel_message_mentions',
      icon: 'alternate_email',
      note: 'Tracking @mentions for notifications',
      hidden: true,
      singleton: false,
    },
    schema: {
      name: 'channel_message_mentions',
    },
  },
  channel_message_files: {
    collection: 'channel_message_files',
    meta: {
      collection: 'channel_message_files',
      icon: 'attach_file',
      note: 'File attachments for channel messages',
      hidden: true,
      singleton: false,
    },
    schema: {
      name: 'channel_message_files',
    },
  },
};

// Field definitions for each collection
const FIELDS = {
  channels: [
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
      field: 'status',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'select-dropdown',
        display: 'labels',
        display_options: {
          showAsDot: true,
          choices: [
            { text: 'Active', value: 'active', foreground: '#FFFFFF', background: '#10B981' },
            { text: 'Archived', value: 'archived', foreground: '#FFFFFF', background: '#6B7280' },
          ],
        },
        options: {
          choices: [
            { text: 'Active', value: 'active' },
            { text: 'Archived', value: 'archived' },
          ],
        },
      },
      schema: {
        default_value: 'active',
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
    {
      field: 'user_created',
      type: 'uuid',
      meta: {
        special: ['user-created'],
        interface: 'select-dropdown-m2o',
        display: 'user',
        readonly: true,
        hidden: true,
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
        hidden: true,
        width: 'half',
      },
      schema: {},
    },
    {
      field: 'user_updated',
      type: 'uuid',
      meta: {
        special: ['user-updated'],
        interface: 'select-dropdown-m2o',
        display: 'user',
        readonly: true,
        hidden: true,
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
        width: 'half',
      },
      schema: {},
    },
    {
      field: 'name',
      type: 'string',
      meta: {
        interface: 'input',
        display: 'raw',
        width: 'half',
        required: true,
        note: 'Channel name (e.g., "General", "Finance Committee")',
      },
      schema: {
        is_nullable: false,
      },
    },
    {
      field: 'description',
      type: 'text',
      meta: {
        interface: 'input-multiline',
        display: 'raw',
        width: 'full',
        note: 'Brief description of the channel purpose',
      },
      schema: {},
    },
    {
      field: 'icon',
      type: 'string',
      meta: {
        interface: 'select-icon',
        display: 'raw',
        width: 'half',
        note: 'Icon for the channel',
      },
      schema: {
        default_value: 'chat',
      },
    },
    {
      field: 'is_private',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        display: 'boolean',
        width: 'half',
        note: 'Private channels require explicit invitation even for board members',
      },
      schema: {
        default_value: false,
      },
    },
    {
      field: 'members',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
        options: {
          template: '{{user_id.first_name}} {{user_id.last_name}}',
          enableCreate: true,
          enableSelect: true,
        },
      },
    },
    {
      field: 'messages',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
        hidden: true,
      },
    },
  ],
  channel_members: [
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
      field: 'channel_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'related-values',
        display_options: {
          template: '{{name}}',
        },
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
        note: 'The user being invited to this channel',
      },
      schema: {
        is_nullable: false,
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
    {
      field: 'invited_by',
      type: 'uuid',
      meta: {
        special: ['user-created'],
        interface: 'select-dropdown-m2o',
        display: 'user',
        readonly: true,
        note: 'Who invited this user',
      },
      schema: {},
    },
    {
      field: 'role',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        display: 'labels',
        width: 'half',
        options: {
          choices: [
            { text: 'Member', value: 'member' },
            { text: 'Moderator', value: 'moderator' },
          ],
        },
        note: 'Member role within this channel',
      },
      schema: {
        default_value: 'member',
      },
    },
    {
      field: 'notifications_enabled',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        display: 'boolean',
        width: 'half',
        note: 'Receive notifications for this channel',
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: 'last_read_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        display: 'datetime',
        note: 'Last time user read messages in this channel',
      },
      schema: {},
    },
  ],
  channel_messages: [
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
      field: 'channel_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'related-values',
        display_options: {
          template: '{{name}}',
        },
        required: true,
        hidden: true,
      },
      schema: {
        is_nullable: false,
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
        note: 'Message content (supports rich text with mentions)',
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
      field: 'parent_id',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'related-values',
        note: 'Parent message for threaded replies',
      },
      schema: {},
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
  ],
  channel_message_mentions: [
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
      field: 'message_id',
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
  channel_message_files: [
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
      field: 'message_id',
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
const RELATIONS = [
  // channel_members -> channels
  {
    collection: 'channel_members',
    field: 'channel_id',
    related_collection: 'channels',
    meta: {
      one_field: 'members',
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'CASCADE',
    },
  },
  // channel_members -> directus_users
  {
    collection: 'channel_members',
    field: 'user_id',
    related_collection: 'directus_users',
    meta: {
      one_field: null,
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'CASCADE',
    },
  },
  // channel_members -> directus_users (invited_by)
  {
    collection: 'channel_members',
    field: 'invited_by',
    related_collection: 'directus_users',
    meta: {
      one_field: null,
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'SET NULL',
    },
  },
  // channel_messages -> channels
  {
    collection: 'channel_messages',
    field: 'channel_id',
    related_collection: 'channels',
    meta: {
      one_field: 'messages',
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'CASCADE',
    },
  },
  // channel_messages -> channel_messages (parent for threads)
  {
    collection: 'channel_messages',
    field: 'parent_id',
    related_collection: 'channel_messages',
    meta: {
      one_field: null,
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'CASCADE',
    },
  },
  // channel_message_mentions -> channel_messages
  {
    collection: 'channel_message_mentions',
    field: 'message_id',
    related_collection: 'channel_messages',
    meta: {
      one_field: 'mentions',
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'CASCADE',
    },
  },
  // channel_message_mentions -> directus_users
  {
    collection: 'channel_message_mentions',
    field: 'user_id',
    related_collection: 'directus_users',
    meta: {
      one_field: null,
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'CASCADE',
    },
  },
  // channel_message_files -> channel_messages
  {
    collection: 'channel_message_files',
    field: 'message_id',
    related_collection: 'channel_messages',
    meta: {
      one_field: 'files',
      sort_field: 'sort',
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'CASCADE',
    },
  },
  // channel_message_files -> directus_files
  {
    collection: 'channel_message_files',
    field: 'directus_files_id',
    related_collection: 'directus_files',
    meta: {
      one_field: null,
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      on_delete: 'CASCADE',
    },
  },
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
      permissions: { user_created: { _eq: '$CURRENT_USER' } }, // Only delete own channels
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
      permissions: { user_created: { _eq: '$CURRENT_USER' } }, // Only edit own messages
    },
    {
      collection: 'channel_messages',
      action: 'delete',
      permissions: { user_created: { _eq: '$CURRENT_USER' } }, // Only delete own messages
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
      permissions: { message_id: { user_created: { _eq: '$CURRENT_USER' } } },
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
      validation: {
        channel_id: {
          members: {
            user_id: { _eq: '$CURRENT_USER' },
          },
        },
      },
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
  console.log('📣 Directus Channels System Setup Script');
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
  // Step 1: Create uploads folder for channel files
  // ========================================
  console.log('📁 Step 1: Creating channel uploads folder...');

  let channelsFolderId = null;
  try {
    const folders = await client.request(readFolders({
      filter: { name: { _eq: 'Channel Uploads' } },
    }));

    if (folders && folders.length > 0) {
      channelsFolderId = folders[0].id;
      console.log(`   ✅ Folder already exists: ${channelsFolderId}`);
    } else {
      const newFolder = await client.request(createFolder({
        name: 'Channel Uploads',
      }));
      channelsFolderId = newFolder.id;
      console.log(`   ✅ Created folder: ${channelsFolderId}`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not create folder:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 2: Check existing collections
  // ========================================
  console.log('\n📋 Step 2: Checking existing collections...');

  let existingCollections = [];
  try {
    existingCollections = await client.request(readCollections());
    const existingNames = existingCollections.map(c => c.collection);
    console.log(`   Found ${existingCollections.length} existing collections`);

    for (const [name, config] of Object.entries(COLLECTIONS)) {
      if (existingNames.includes(name)) {
        console.log(`   ✅ ${name} already exists`);
      } else {
        console.log(`   ⏳ ${name} will be created`);
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not read collections:', error?.errors?.[0]?.message || error?.message);
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
    } catch (error) {
      console.log(`   ❌ Error creating ${name}:`, error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 4: Create fields for each collection
  // ========================================
  console.log('\n📋 Step 4: Creating fields...');

  for (const [collectionName, fields] of Object.entries(FIELDS)) {
    console.log(`\n   📝 Fields for ${collectionName}:`);

    let existingFields = [];
    try {
      existingFields = await client.request(readFields(collectionName));
    } catch (error) {
      // Collection might not exist yet
    }

    const existingFieldNames = existingFields.map(f => f.field);

    for (const field of fields) {
      if (existingFieldNames.includes(field.field)) {
        console.log(`      ⏭️  ${field.field} (exists)`);
        continue;
      }

      try {
        await client.request(createField(collectionName, field));
        console.log(`      ✅ ${field.field}`);
      } catch (error) {
        console.log(`      ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
      }
    }
  }

  // ========================================
  // Step 5: Create relationships
  // ========================================
  console.log('\n📋 Step 5: Creating relationships...');

  for (const relation of RELATIONS) {
    try {
      await client.request(createRelation(relation));
      console.log(`   ✅ ${relation.collection}.${relation.field} -> ${relation.related_collection}`);
    } catch (error) {
      const msg = error?.errors?.[0]?.message || error?.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(`   ⏭️  ${relation.collection}.${relation.field} (exists)`);
      } else {
        console.log(`   ⚠️  ${relation.collection}.${relation.field}: ${msg}`);
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

  for (const [policyId, permissions] of Object.entries(CHANNEL_PERMISSIONS)) {
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
  console.log('\n✨ Channel system setup complete!\n');

  console.log('📊 Summary:');
  console.log('   Collections created:');
  console.log('   - channels: Main channel/room collection');
  console.log('   - channel_members: Invitation junction table');
  console.log('   - channel_messages: Messages within channels');
  console.log('   - channel_message_mentions: @mention tracking');
  console.log('   - channel_message_files: File attachments');
  console.log('');
  console.log('   Permissions configured:');
  console.log('   - Board Members: Full access to all channels');
  console.log('   - Members: Access only to channels they\'re invited to');
  console.log('');
  if (channelsFolderId) {
    console.log(`   📁 Channel uploads folder ID: ${channelsFolderId}`);
    console.log('      Use this ID for file uploads in the TipTap editor');
  }
  console.log('');
  console.log('🔑 Next steps:');
  console.log('   1. Create a "General" channel in Directus for testing');
  console.log('   2. Test the channel components in the application');
  console.log('   3. Invite some users to verify permissions work correctly');
}

main().catch(console.error);
