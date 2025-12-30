#!/usr/bin/env node

/**
 * Directus Schema Setup Script
 *
 * This script sets up the recommended schema changes for the RBAC system:
 * 1. Adds `person_id` field to directus_users (M2O relationship to people)
 * 2. Auto-links existing users to people records by email match
 *
 * Usage:
 *   node scripts/setup-schema.mjs
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
  readFields,
  createField,
  updateField,
  readUsers,
  updateUser,
  readItems,
  createRelation,
  readRelations,
} from '@directus/sdk';
import * as readline from 'readline';

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
  console.log('🔧 Directus Schema Setup Script');
  console.log('================================\n');

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
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }

  // ========================================
  // Step 1: Check if person_id field exists
  // ========================================
  console.log('📋 Step 1: Checking directus_users fields...');

  let personFieldExists = false;
  try {
    const fields = await client.request(readFields('directus_users'));
    personFieldExists = fields.some(f => f.field === 'person_id');

    if (personFieldExists) {
      console.log('   ✅ person_id field already exists');
    } else {
      console.log('   ⚠️  person_id field not found, will create it');
    }
  } catch (error) {
    console.log('   ⚠️  Could not read fields:', error.message);
  }

  // ========================================
  // Step 2: Create person_id field if needed
  // ========================================
  if (!personFieldExists) {
    console.log('\n📋 Step 2: Creating person_id field on directus_users...');

    try {
      // Create the field
      await client.request(
        createField('directus_users', {
          field: 'person_id',
          type: 'integer',
          schema: {
            is_nullable: true,
            is_unique: false,
            foreign_key_table: 'people',
            foreign_key_column: 'id',
          },
          meta: {
            interface: 'select-dropdown-m2o',
            display: 'related-values',
            display_options: {
              template: '{{first_name}} {{last_name}}',
            },
            options: {
              template: '{{first_name}} {{last_name}} ({{email}})',
            },
            special: ['m2o'],
            note: 'Links this user account to their person record',
            width: 'half',
            sort: 10,
            group: null,
          },
        })
      );
      console.log('   ✅ Created person_id field');

      // Create the relation
      try {
        await client.request(
          createRelation({
            collection: 'directus_users',
            field: 'person_id',
            related_collection: 'people',
            meta: {
              one_field: null, // No reverse field on people
              sort_field: null,
              one_deselect_action: 'nullify',
            },
            schema: {
              on_delete: 'SET NULL',
            },
          })
        );
        console.log('   ✅ Created M2O relation to people');
      } catch (relError) {
        console.log('   ⚠️  Relation may already exist or error:', relError.message);
      }
    } catch (error) {
      console.error('   ❌ Failed to create field:', error.message);
      console.log('   💡 You may need to create this field manually in Directus Admin');
    }
  }

  // ========================================
  // Step 3: Auto-link existing users to people by email
  // ========================================
  console.log('\n📋 Step 3: Auto-linking users to people by email...');

  const shouldAutoLink = await prompt('   Auto-link existing users to people records? (y/n): ');

  if (shouldAutoLink.toLowerCase() === 'y') {
    try {
      // Get all users without a person_id
      const users = await client.request(
        readUsers({
          filter: {
            person_id: { _null: true },
          },
          fields: ['id', 'email', 'first_name', 'last_name'],
          limit: -1,
        })
      );

      console.log(`   Found ${users.length} users without person_id`);

      // Get all people
      const people = await client.request(
        readItems('people', {
          fields: ['id', 'email', 'first_name', 'last_name'],
          limit: -1,
        })
      );

      console.log(`   Found ${people.length} people records`);

      // Match and update
      let linked = 0;
      for (const user of users) {
        if (!user.email) continue;

        const matchingPerson = people.find(
          p => p.email && p.email.toLowerCase() === user.email.toLowerCase()
        );

        if (matchingPerson) {
          try {
            await client.request(
              updateUser(user.id, { person_id: matchingPerson.id })
            );
            console.log(`   ✅ Linked: ${user.email} → Person #${matchingPerson.id}`);
            linked++;
          } catch (updateError) {
            console.log(`   ⚠️  Failed to link ${user.email}: ${updateError.message}`);
          }
        }
      }

      console.log(`\n   📊 Linked ${linked} users to people records`);
    } catch (error) {
      console.error('   ❌ Error during auto-linking:', error.message);
    }
  } else {
    console.log('   ⏭️  Skipping auto-link');
  }

  // ========================================
  // Step 4: Verify is_owner and is_resident fields on people
  // ========================================
  console.log('\n📋 Step 4: Verifying people collection fields...');

  try {
    const peopleFields = await client.request(readFields('people'));
    const fieldNames = peopleFields.map(f => f.field);

    const requiredFields = ['is_owner', 'is_resident'];
    const missingFields = requiredFields.filter(f => !fieldNames.includes(f));

    if (missingFields.length === 0) {
      console.log('   ✅ is_owner and is_resident fields exist');
    } else {
      console.log(`   ⚠️  Missing fields on people: ${missingFields.join(', ')}`);
      console.log('   💡 Please create these boolean fields in Directus Admin:');
      for (const field of missingFields) {
        console.log(`      - ${field}: Boolean, default: true for is_resident, derived from category for is_owner`);
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify people fields:', error.message);
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ Schema setup complete!\n');

  console.log('📊 Summary of changes:');
  console.log('   - person_id field on directus_users (M2O to people)');
  console.log('   - Auto-linked users to people by email match');
  console.log('\n🔑 Next steps:');
  console.log('   1. Run the permissions setup script: pnpm setup:permissions');
  console.log('   2. Verify the person links in Directus Admin');
  console.log('   3. Set is_owner/is_resident on people records as needed');
}

main().catch(console.error);
