#!/usr/bin/env node

/**
 * Reset and recreate transaction_files collection
 * 
 * The previous setup created fields that Directus can see in the DB
 * but doesn't recognize for relations. This script:
 * 1. Deletes the transaction_files collection entirely
 * 2. Recreates it with fields and relations in the correct order
 *
 * Usage:
 *   node scripts/reset-transaction-files.mjs
 */

import {
  createDirectus,
  rest,
  authentication,
  createCollection,
  createField,
  createRelation,
  deleteCollection,
  readCollections,
  readFields,
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
  console.log('🔄 Reset transaction_files collection\n');

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

  // ========================================
  // Step 1: Delete existing collection
  // ========================================
  console.log('Step 1: Deleting transaction_files collection...');

  const existing = await client.request(readCollections());
  if (existing.some((c) => c.collection === 'transaction_files')) {
    try {
      await client.request(deleteCollection('transaction_files'));
      console.log('   ✅ Deleted transaction_files');
      await delay(2000); // Give Directus time to fully clean up
    } catch (e) {
      console.log('   ❌ Could not delete:', e?.errors?.[0]?.message || e?.message);
      console.log('   Try deleting manually in Directus admin → Settings → Data Model');
      process.exit(1);
    }
  } else {
    console.log('   ⏭️  Collection does not exist');
  }

  // Also remove the O2M alias "files" from transactions if it exists
  console.log('\n   Checking for stale "files" alias on transactions...');
  try {
    const txFields = await client.request(readFields('transactions'));
    const filesAlias = txFields.find((f) => f.field === 'files');
    if (filesAlias) {
      // We can't easily delete alias fields via SDK, but recreating the relation
      // will re-link it. The alias should get cleaned up when the collection was deleted.
      console.log('   ⚠️  "files" alias exists on transactions — will be re-linked by new relation');
    }
  } catch (e) {
    // ok
  }

  await delay(1000);

  // ========================================
  // Step 2: Create collection (bare, no fields yet)
  // ========================================
  console.log('\nStep 2: Creating transaction_files collection...');

  try {
    await client.request(createCollection({
      collection: 'transaction_files',
      meta: {
        collection: 'transaction_files',
        icon: 'attach_file',
        note: 'File attachments for transactions (invoices, receipts, supporting docs)',
        hidden: true,
        singleton: false,
      },
      schema: { name: 'transaction_files' },
    }));
    console.log('   ✅ Created collection');
    await delay(1000);
  } catch (e) {
    console.log('   ❌', e?.errors?.[0]?.message || e?.message);
    process.exit(1);
  }

  // ========================================
  // Step 3: Create non-relational fields first
  // ========================================
  console.log('\nStep 3: Creating basic fields...');

  const basicFields = [
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', hidden: true },
      schema: {},
    },
    {
      field: 'file_type',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        display: 'labels',
        width: 'half',
        options: {
          choices: [
            { text: 'Invoice', value: 'invoice' },
            { text: 'Receipt', value: 'receipt' },
            { text: 'Contract', value: 'contract' },
            { text: 'Approval Email', value: 'approval' },
            { text: 'Quote / Estimate', value: 'quote' },
            { text: 'Photo', value: 'photo' },
            { text: 'Other', value: 'other' },
          ],
        },
        display_options: {
          choices: [
            { text: 'Invoice', value: 'invoice', foreground: '#FFFFFF', background: '#3B82F6' },
            { text: 'Receipt', value: 'receipt', foreground: '#FFFFFF', background: '#10B981' },
            { text: 'Contract', value: 'contract', foreground: '#FFFFFF', background: '#8B5CF6' },
            { text: 'Approval', value: 'approval', foreground: '#FFFFFF', background: '#F59E0B' },
            { text: 'Quote', value: 'quote', foreground: '#FFFFFF', background: '#6366F1' },
            { text: 'Photo', value: 'photo', foreground: '#FFFFFF', background: '#EC4899' },
            { text: 'Other', value: 'other', foreground: '#FFFFFF', background: '#6B7280' },
          ],
        },
      },
      schema: { default_value: 'receipt' },
    },
    {
      field: 'description',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        note: 'Optional description',
      },
      schema: { is_nullable: true },
    },
    {
      field: 'uploaded_by',
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
  ];

  for (const field of basicFields) {
    try {
      await client.request(createField('transaction_files', field));
      console.log(`   ✅ ${field.field}`);
      await delay(300);
    } catch (e) {
      console.log(`   ⚠️  ${field.field}:`, e?.errors?.[0]?.message || e?.message);
    }
  }

  // ========================================
  // Step 4: Create relational fields + relations together
  // ========================================
  console.log('\nStep 4: Creating relational fields and relations...');

  // 4a: transaction_id field
  console.log('\n   --- transaction_id ---');
  try {
    await client.request(createField('transaction_files', {
      field: 'transaction_id',
      type: 'integer',
      schema: { is_nullable: false },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        hidden: true,
        width: 'full',
      },
    }));
    console.log('   ✅ Created transaction_id field');
    await delay(500);
  } catch (e) {
    console.log('   ⚠️  Field:', e?.errors?.[0]?.message || e?.message);
  }

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
    console.log('   ✅ Relation: transaction_files.transaction_id → transactions');
    await delay(500);
  } catch (e) {
    console.log('   ❌ Relation:', e?.errors?.[0]?.message || e?.message);
  }

  // 4b: directus_files_id field
  console.log('\n   --- directus_files_id ---');
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
    console.log('   ✅ Created directus_files_id field');
    await delay(500);
  } catch (e) {
    console.log('   ⚠️  Field:', e?.errors?.[0]?.message || e?.message);
  }

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
    console.log('   ✅ Relation: transaction_files.directus_files_id → directus_files');
    await delay(500);
  } catch (e) {
    console.log('   ❌ Relation:', e?.errors?.[0]?.message || e?.message);
  }

  // ========================================
  // Step 5: Verify
  // ========================================
  console.log('\nStep 5: Verifying...');

  try {
    const fields = await client.request(readFields('transaction_files'));
    const fieldNames = fields.map((f) => f.field);
    const dbCols = fields.filter((f) => f.schema).map((f) => f.field);
    const m2oFields = fields.filter((f) => f.meta?.special?.includes('m2o')).map((f) => f.field);
    const fileFields = fields.filter((f) => f.meta?.special?.includes('file')).map((f) => f.field);

    console.log('   All fields:', fieldNames.join(', '));
    console.log('   DB columns:', dbCols.join(', '));
    console.log('   M2O fields:', m2oFields.join(', '));
    console.log('   File fields:', fileFields.join(', '));

    const hasTransactionId = m2oFields.includes('transaction_id');
    const hasFilesId = fileFields.includes('directus_files_id');

    if (hasTransactionId && hasFilesId) {
      console.log('\n   ✅ All relations wired correctly!');
    } else {
      console.log('\n   ⚠️  Something may still be off:');
      if (!hasTransactionId) console.log('      - transaction_id not recognized as M2O');
      if (!hasFilesId) console.log('      - directus_files_id not recognized as file field');
      console.log('      Try: Directus admin → Settings → Data Model → transaction_files');
      console.log('      Manually set the interface/special if needed.');
    }
  } catch (e) {
    console.log('   Could not verify:', e?.errors?.[0]?.message || e?.message);
  }

  console.log('\n✨ Done!');
  console.log('   Check Directus admin → transactions → edit any record → look for "files" O2M field.');
}

main().catch(console.error);
