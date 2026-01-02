/**
 * Reactions Collection Setup Script for Directus
 *
 * This script creates the 'reactions' collection in Directus with the proper
 * schema for a polymorphic reactions system.
 *
 * Usage:
 *   DIRECTUS_TOKEN=your-admin-token node scripts/setup-reactions-collection.js
 *
 * Or manually create the collection following the instructions below.
 */

import {
  createDirectus,
  rest,
  staticToken,
  createCollection,
  createField,
} from '@directus/sdk';

// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.1033lenox.com';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

console.log('🎉 Reactions Collection Setup Script\n');
console.log('=====================================\n');

if (!DIRECTUS_TOKEN) {
  console.log('⚠️  No DIRECTUS_TOKEN provided. Showing manual setup instructions.\n');
  printManualInstructions();
  process.exit(0);
}

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

async function setupReactionsCollection() {
  try {
    console.log('📦 Creating reactions collection...\n');

    // Create the collection
    await client.request(
      createCollection({
        collection: 'reactions',
        meta: {
          collection: 'reactions',
          icon: 'thumb_up',
          note: 'Polymorphic reactions for messages, comments, and other content',
          display_template: '{{reaction_type}} by {{user_created}}',
          archive_field: null,
          archive_value: null,
          unarchive_value: null,
          sort_field: null,
          accountability: 'all',
          group: null,
          translations: null,
        },
        schema: {
          name: 'reactions',
        },
        fields: [
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
        ],
      })
    );

    console.log('✅ Collection created!\n');

    // Add fields
    console.log('📝 Adding fields...\n');

    // user_created (system field)
    await client.request(
      createField('reactions', {
        field: 'user_created',
        type: 'uuid',
        meta: {
          special: ['user-created'],
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{first_name}} {{last_name}}',
          },
          display: 'user',
          readonly: true,
          hidden: false,
          width: 'half',
        },
        schema: {},
      })
    );
    console.log('  ✅ user_created');

    // date_created (system field)
    await client.request(
      createField('reactions', {
        field: 'date_created',
        type: 'timestamp',
        meta: {
          special: ['date-created'],
          interface: 'datetime',
          readonly: true,
          hidden: false,
          width: 'half',
          display: 'datetime',
          display_options: {
            relative: true,
          },
        },
        schema: {},
      })
    );
    console.log('  ✅ date_created');

    // collection (polymorphic - which collection the reaction is for)
    await client.request(
      createField('reactions', {
        field: 'collection',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Channel Messages', value: 'channel_messages' },
              { text: 'Comments', value: 'comments' },
            ],
          },
          display: 'labels',
          display_options: {
            choices: [
              { text: 'Channel Messages', value: 'channel_messages', foreground: '#FFFFFF', background: '#3B82F6' },
              { text: 'Comments', value: 'comments', foreground: '#FFFFFF', background: '#10B981' },
            ],
          },
          required: true,
          width: 'half',
          note: 'The type of content this reaction is for',
        },
        schema: {
          is_nullable: false,
        },
      })
    );
    console.log('  ✅ collection');

    // item_id (the ID of the item being reacted to)
    await client.request(
      createField('reactions', {
        field: 'item_id',
        type: 'string',
        meta: {
          interface: 'input',
          required: true,
          width: 'half',
          note: 'The ID of the item being reacted to',
        },
        schema: {
          is_nullable: false,
        },
      })
    );
    console.log('  ✅ item_id');

    // reaction_type (the type of reaction)
    await client.request(
      createField('reactions', {
        field: 'reaction_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: '👍 Like', value: 'thumbs_up' },
              { text: '👎 Dislike', value: 'thumbs_down' },
              { text: '❤️ Love', value: 'heart' },
              { text: '😄 Haha', value: 'laugh' },
              { text: '😮 Wow', value: 'surprise' },
              { text: '😢 Sad', value: 'sad' },
              { text: '😠 Angry', value: 'angry' },
              { text: '🔥 Fire', value: 'fire' },
              { text: '🎉 Celebrate', value: 'celebrate' },
              { text: '🤔 Thinking', value: 'think' },
              { text: '👀 Looking', value: 'eyes' },
              { text: '🚀 Rocket', value: 'rocket' },
            ],
          },
          display: 'labels',
          required: true,
          width: 'full',
          note: 'The type of reaction emoji',
        },
        schema: {
          is_nullable: false,
        },
      })
    );
    console.log('  ✅ reaction_type');

    console.log('\n✅ All fields created!\n');

    console.log('🔐 Setting up permissions...\n');
    console.log('   Please manually configure the following permissions in Directus:\n');
    printPermissionInstructions();

    console.log('\n🎉 Setup complete!\n');
    console.log('The reactions collection is now ready to use.\n');

  } catch (error) {
    console.error('❌ Error during setup:\n');
    console.error(error.message || error);

    if (error.errors) {
      console.error('\nDirectus Errors:');
      console.error(JSON.stringify(error.errors, null, 2));
    }

    console.log('\n💡 If the collection already exists, you may need to delete it first');
    console.log('   or manually add any missing fields.\n');

    console.log('📋 Manual setup instructions:\n');
    printManualInstructions();

    process.exit(1);
  }
}

function printManualInstructions() {
  console.log(`
=====================================
MANUAL SETUP INSTRUCTIONS
=====================================

1. CREATE THE COLLECTION
   Go to: Settings → Data Model → Create Collection

   Collection Name: reactions
   Primary Key: id (auto-increment integer)
   Icon: thumb_up

2. ADD THE FOLLOWING FIELDS

   ┌─────────────────┬────────────────┬────────────────────────────────────┐
   │ Field Name      │ Type           │ Notes                              │
   ├─────────────────┼────────────────┼────────────────────────────────────┤
   │ user_created    │ User Created   │ System field, links to user        │
   │ date_created    │ Date Created   │ System field, auto-set             │
   │ collection      │ String         │ Dropdown: channel_messages,        │
   │                 │                │ comments (add more as needed)      │
   │ item_id         │ String         │ UUID of the reacted item           │
   │ reaction_type   │ String         │ Dropdown with reaction types       │
   └─────────────────┴────────────────┴────────────────────────────────────┘

3. REACTION TYPES (for reaction_type dropdown)

   Value          │ Label
   ───────────────┼──────────────
   thumbs_up      │ 👍 Like
   thumbs_down    │ 👎 Dislike
   heart          │ ❤️ Love
   laugh          │ 😄 Haha
   surprise       │ 😮 Wow
   sad            │ 😢 Sad
   angry          │ 😠 Angry
   fire           │ 🔥 Fire
   celebrate      │ 🎉 Celebrate
   think          │ 🤔 Thinking
   eyes           │ 👀 Looking
   rocket         │ 🚀 Rocket

4. SET UP PERMISSIONS
`);
  printPermissionInstructions();
}

function printPermissionInstructions() {
  console.log(`
   For the "Authenticated" role (or your custom user role):

   ┌────────────┬───────────────────────────────────────────────────────┐
   │ Permission │ Configuration                                         │
   ├────────────┼───────────────────────────────────────────────────────┤
   │ CREATE     │ All fields                                            │
   │ READ       │ All fields                                            │
   │ UPDATE     │ None (reactions shouldn't be edited)                  │
   │ DELETE     │ Only own reactions:                                   │
   │            │ Filter: user_created = $CURRENT_USER                  │
   └────────────┴───────────────────────────────────────────────────────┘

   This ensures:
   - Users can create reactions
   - Users can see all reactions (to display counts)
   - Users can only delete their own reactions
   - Reactions cannot be edited (toggle on/off only)

5. OPTIONAL: CREATE AN INDEX FOR PERFORMANCE

   Create a composite index on: (collection, item_id)
   This will speed up queries when fetching reactions for items.

6. OPTIONAL: ADD UNIQUE CONSTRAINT

   To prevent duplicate reactions, add a unique constraint on:
   (collection, item_id, reaction_type, user_created)

   This ensures each user can only have one of each reaction type per item.
`);
}

// Run the setup
setupReactionsCollection();
