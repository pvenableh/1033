#!/usr/bin/env node

/**
 * Fix transaction_files relations
 * 
 * Run after setup-transaction-files.mjs if the relation step failed with:
 * "Field doesn't exist in collection"
 *
 * This happens because Directus auto-created the fields without proper schema.
 * The fix: delete the broken fields, recreate them with schema, then add relations.
 *
 * Usage:
 *   node scripts/fix-transaction-files-relations.mjs
 */

import {
  createDirectus,
  rest,
  authentication,
  createField,
  createRelation,
  readFields,
  deleteField,
} from '@directus/sdk';
import * as readline from 'readline';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

async function main() {
  console.log('🔧 Fix transaction_files relations\n');

  const directusUrl = process.env.DIRECTUS_URL || (await prompt('Directus URL: '));
  const email = process.env.DIRECTUS_EMAIL || (await prompt('Admin Email: '));
  const password = process.env.DIRECTUS_PASSWORD || (await prompt('Admin Password: '));

  const client = createDirectus(directusUrl).with(authentication()).with(rest());

  try {
    await client.login({ email, password });
    console.log('✅ Authenticated\n');
  } catch (error) {
    console.error('❌ Auth failed:', error?.errors?.[0]?.message || error?.message);
    process.exit(1);
  }

  // Check what exists
  const existingFields = await client.request(readFields('transaction_files'));
  const fieldNames = existingFields.map((f) => f.field);
  const dbColumns = existingFields
    .filter((f) => f.schema !== null && f.schema !== undefined)
    .map((f) => f.field);

  console.log('Current fields:', fieldNames.join(', '));
  console.log('DB columns:', dbColumns.join(', '));

  // Fix transaction_id
  console.log('\n--- Fixing transaction_id ---');
  if (fieldNames.includes('transaction_id') && !dbColumns.includes('transaction_id')) {
    console.log('   Deleting broken alias field...');
    try {
      await client.request(deleteField('transaction_files', 'transaction_id'));
      console.log('   ✅ Deleted');
      await delay(500);
    } catch (e) {
      console.log('   ⚠️ Could not delete:', e?.errors?.[0]?.message || e?.message);
    }
  }

  if (!dbColumns.includes('transaction_id')) {
    console.log('   Creating field with schema...');
    try {
      await client.request(createField('transaction_files', {
        field: 'transaction_id',
        type: 'integer',
        schema: { is_nullable: false },
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          hidden: true,
        },
      }));
      console.log('   ✅ Created transaction_id column');
      await delay(500);
    } catch (e) {
      console.log('   ❌', e?.errors?.[0]?.message || e?.message);
    }
  } else {
    console.log('   ⏭️ DB column already exists');
  }

  // Fix directus_files_id
  console.log('\n--- Fixing directus_files_id ---');
  if (fieldNames.includes('directus_files_id') && !dbColumns.includes('directus_files_id')) {
    console.log('   Deleting broken alias field...');
    try {
      await client.request(deleteField('transaction_files', 'directus_files_id'));
      console.log('   ✅ Deleted');
      await delay(500);
    } catch (e) {
      console.log('   ⚠️ Could not delete:', e?.errors?.[0]?.message || e?.message);
    }
  }

  if (!dbColumns.includes('directus_files_id')) {
    console.log('   Creating field with schema...');
    try {
      await client.request(createField('transaction_files', {
        field: 'directus_files_id',
        type: 'uuid',
        schema: { is_nullable: true },
        meta: {
          interface: 'file',
          special: ['file'],
          width: 'full',
          note: 'Upload invoice, receipt, or supporting document',
        },
      }));
      console.log('   ✅ Created directus_files_id column');
      await delay(500);
    } catch (e) {
      console.log('   ❌', e?.errors?.[0]?.message || e?.message);
    }
  } else {
    console.log('   ⏭️ DB column already exists');
  }

  // Now create the relations
  console.log('\n--- Creating relations ---');
  await delay(1000);

  try {
    await client.request(createRelation({
      collection: 'transaction_files',
      field: 'transaction_id',
      related_collection: 'transactions',
      meta: {
        many_collection: 'transaction_files',
        many_field: 'transaction_id',
        one_collection: 'transactions',
        one_field: 'files',
        sort_field: 'sort',
        one_deselect_action: 'nullify',
      },
      schema: { on_delete: 'CASCADE' },
    }));
    console.log('   ✅ transaction_files.transaction_id -> transactions');
  } catch (e) {
    console.log('   ⚠️', e?.errors?.[0]?.message || e?.message);
  }

  await delay(300);

  try {
    await client.request(createRelation({
      collection: 'transaction_files',
      field: 'directus_files_id',
      related_collection: 'directus_files',
      meta: {
        many_collection: 'transaction_files',
        many_field: 'directus_files_id',
        one_collection: 'directus_files',
        one_field: null,
        one_deselect_action: 'nullify',
      },
    }));
    console.log('   ✅ transaction_files.directus_files_id -> directus_files');
  } catch (e) {
    console.log('   ⚠️', e?.errors?.[0]?.message || e?.message);
  }

  console.log('\n✨ Done! The transaction_files junction should now be fully wired up.');
  console.log('   Go to Directus admin → transactions → edit any record → you should see the "files" field.');
}

main().catch(console.error);
