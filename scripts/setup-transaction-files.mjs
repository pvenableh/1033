#!/usr/bin/env node

/**
 * Directus Transaction Files & Review Fields Setup Script
 *
 * This script adds support for attaching invoices, receipts, and supporting
 * documents to transactions for reconciliation by the Treasurer and President.
 *
 * Changes:
 * 1. transaction_files - Junction table (like comment_files, channel_message_files)
 * 2. New fields on transactions:
 *    - review_status: 'pending' | 'reviewed' | 'approved' | 'flagged'
 *    - reviewed_by: M2O to directus_users
 *    - reviewed_date: timestamp
 *    - review_notes: text notes from reviewer
 *    - payment_method: 'ach' | 'check' | 'zelle' | 'wire' | 'cash' | 'card' | 'other'
 *    - check_number: for check payments
 *    - invoice_number: vendor invoice reference
 *    - files: O2M alias to transaction_files
 *
 * Usage:
 *   node scripts/setup-transaction-files.mjs
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
} from '@directus/sdk';
import * as readline from 'readline';

// Helper to add delay between operations
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Policy UUIDs from your Directus instance
const POLICIES = {
  BOARD_MEMBER: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2',
  MEMBER: 'ab66d5f6-8eb0-48e4-a021-68d758aae525',
  PENDING: '2a9627a9-424d-472f-aaf1-478948d7549b',
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

// ========================================
// Collection Definitions
// ========================================

const COLLECTIONS = {
  transaction_files: {
    collection: 'transaction_files',
    meta: {
      collection: 'transaction_files',
      icon: 'attach_file',
      note: 'File attachments for transactions (invoices, receipts, supporting docs)',
      hidden: true,
      singleton: false,
    },
    schema: { name: 'transaction_files' },
  },
};

// ========================================
// Field Definitions
// ========================================

const FIELDS = {
  // Fields for the new junction table
  transaction_files: [
    {
      field: 'id',
      type: 'integer',
      meta: { hidden: true, readonly: true, interface: 'input', special: null },
      schema: { is_primary_key: true, has_auto_increment: true },
    },
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
        note: 'Type of supporting document',
      },
      schema: { default_value: 'receipt' },
    },
    {
      field: 'description',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        note: 'Optional description (e.g., "FPL invoice for January 2026")',
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
    // M2O fields (created by relation step)
    {
      field: 'transaction_id',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        hidden: true,
      },
      schema: { is_nullable: false },
    },
    {
      field: 'directus_files_id',
      type: 'uuid',
      meta: {
        interface: 'file',
        special: ['file'],
        width: 'full',
        note: 'Upload invoice, receipt, or supporting document',
      },
      schema: { is_nullable: true },
    },
  ],

  // New fields to add to the existing transactions collection
  transactions_new_fields: [
    {
      field: 'review_status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        display: 'labels',
        width: 'half',
        options: {
          choices: [
            { text: 'Pending Review', value: 'pending' },
            { text: 'Reviewed', value: 'reviewed' },
            { text: 'Approved', value: 'approved' },
            { text: 'Flagged', value: 'flagged' },
          ],
        },
        display_options: {
          choices: [
            { text: 'Pending', value: 'pending', foreground: '#18222F', background: '#D3DAE4' },
            { text: 'Reviewed', value: 'reviewed', foreground: '#FFFFFF', background: '#3B82F6' },
            { text: 'Approved', value: 'approved', foreground: '#FFFFFF', background: '#10B981' },
            { text: 'Flagged', value: 'flagged', foreground: '#FFFFFF', background: '#EF4444' },
          ],
        },
        note: 'Review status for reconciliation workflow',
        sort: 50,
        group: null,
      },
      schema: { default_value: 'pending', is_nullable: true },
    },
    {
      field: 'reviewed_date',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        display: 'datetime',
        width: 'half',
        readonly: false,
        note: 'Date the transaction was reviewed',
        sort: 52,
      },
      schema: { is_nullable: true },
    },
    {
      field: 'review_notes',
      type: 'text',
      meta: {
        interface: 'input-multiline',
        width: 'full',
        note: 'Notes from the reviewer (Treasurer/President)',
        sort: 53,
      },
      schema: { is_nullable: true },
    },
    {
      field: 'payment_method',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        display: 'labels',
        width: 'half',
        options: {
          choices: [
            { text: 'ACH', value: 'ach' },
            { text: 'Check', value: 'check' },
            { text: 'Zelle', value: 'zelle' },
            { text: 'Wire Transfer', value: 'wire' },
            { text: 'Cash', value: 'cash' },
            { text: 'Credit/Debit Card', value: 'card' },
            { text: 'Online Payment', value: 'online' },
            { text: 'Other', value: 'other' },
          ],
        },
        display_options: {
          choices: [
            { text: 'ACH', value: 'ach', foreground: '#FFFFFF', background: '#3B82F6' },
            { text: 'Check', value: 'check', foreground: '#FFFFFF', background: '#8B5CF6' },
            { text: 'Zelle', value: 'zelle', foreground: '#FFFFFF', background: '#7C3AED' },
            { text: 'Wire', value: 'wire', foreground: '#FFFFFF', background: '#0EA5E9' },
            { text: 'Cash', value: 'cash', foreground: '#FFFFFF', background: '#10B981' },
            { text: 'Card', value: 'card', foreground: '#FFFFFF', background: '#F59E0B' },
            { text: 'Online', value: 'online', foreground: '#FFFFFF', background: '#6366F1' },
            { text: 'Other', value: 'other', foreground: '#FFFFFF', background: '#6B7280' },
          ],
        },
        note: 'How this transaction was paid/received',
        sort: 54,
      },
      schema: { is_nullable: true },
    },
    {
      field: 'check_number',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        note: 'Check number (if payment method is check)',
        sort: 55,
      },
      schema: { is_nullable: true },
    },
    {
      field: 'invoice_number',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        note: 'Vendor invoice or reference number',
        sort: 56,
      },
      schema: { is_nullable: true },
    },
    // O2M alias field to display related files on the transaction form
    {
      field: 'files',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        width: 'full',
        note: 'Attached invoices, receipts, and supporting documents',
        sort: 57,
        options: {
          template: '{{directus_files_id}} — {{file_type}}',
          enableCreate: true,
          enableSelect: true,
        },
        display: 'related-values',
        display_options: {
          template: '{{file_type}}: {{description}}',
        },
      },
    },
    // M2O field for reviewed_by (created by relation step)
    {
      field: 'reviewed_by',
      type: 'uuid',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'user',
        width: 'half',
        note: 'Board member who reviewed this transaction',
        sort: 51,
      },
      schema: { is_nullable: true },
    },
  ],
};

// ========================================
// Relation Definitions
// ========================================

const RELATIONS = [
  // transaction_files.transaction_id -> transactions.id
  {
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
    schema: {
      on_delete: 'CASCADE',
    },
  },
  // transaction_files.directus_files_id -> directus_files.id
  {
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
  },
  // transactions.reviewed_by -> directus_users.id
  {
    collection: 'transactions',
    field: 'reviewed_by',
    related_collection: 'directus_users',
    meta: {
      many_collection: 'transactions',
      many_field: 'reviewed_by',
      one_collection: 'directus_users',
      one_field: null,
      one_deselect_action: 'nullify',
    },
  },
];

// ========================================
// Main
// ========================================

async function main() {
  console.log('📎 Directus Transaction Files & Review Setup');
  console.log('=============================================\n');

  // Get credentials
  const directusUrl =
    process.env.DIRECTUS_URL ||
    (await prompt('Directus URL (e.g., https://admin.example.com): '));
  const email = process.env.DIRECTUS_EMAIL || (await prompt('Admin Email: '));
  const password =
    process.env.DIRECTUS_PASSWORD || (await prompt('Admin Password: '));

  console.log('\n📡 Connecting to Directus...');

  const client = createDirectus(directusUrl)
    .with(authentication())
    .with(rest());

  try {
    await client.login({ email, password });
    console.log('✅ Authentication successful\n');
  } catch (error) {
    console.error('❌ Authentication failed:', error?.errors?.[0]?.message || error?.message);
    process.exit(1);
  }

  // ========================================
  // Step 1: Check existing collections
  // ========================================
  console.log('📋 Step 1: Checking existing collections...');

  let existingCollections = [];
  try {
    existingCollections = await client.request(readCollections());
  } catch (error) {
    console.error('❌ Could not read collections:', error?.errors?.[0]?.message || error?.message);
  }

  const existingNames = existingCollections.map((c) => c.collection);

  // ========================================
  // Step 2: Create transaction_files collection
  // ========================================
  console.log('\n📋 Step 2: Creating transaction_files collection...');

  if (existingNames.includes('transaction_files')) {
    console.log('   ⏭️  transaction_files already exists');
  } else {
    try {
      await client.request(createCollection(COLLECTIONS.transaction_files));
      console.log('   ✅ Created transaction_files collection');
      await delay(500);
    } catch (error) {
      console.log('   ❌ Error:', error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 3: Create fields on transaction_files
  // ========================================
  console.log('\n📋 Step 3: Creating transaction_files fields...');

  const SKIP_SPECIALS = ['m2o', 'file'];

  let existingTxFileFields = [];
  try {
    existingTxFileFields = await client.request(readFields('transaction_files'));
  } catch (error) {
    // Collection might have just been created
  }
  const existingTxFileColumns = existingTxFileFields
    .filter((f) => f.schema !== null && f.schema !== undefined)
    .map((f) => f.field);

  for (const field of FIELDS.transaction_files) {
    if (field.type === 'alias') {
      console.log(`   ⏭️  ${field.field} (alias field)`);
      continue;
    }
    if (existingTxFileColumns.includes(field.field)) {
      console.log(`   ⏭️  ${field.field} (exists)`);
      continue;
    }
    const fieldSpecials = field.meta?.special || [];
    const isRelationField = fieldSpecials.some((s) => SKIP_SPECIALS.includes(s));
    if (isRelationField) {
      console.log(`   ⏭️  ${field.field} (deferred to relation step)`);
      continue;
    }

    try {
      await client.request(createField('transaction_files', field));
      console.log(`   ✅ ${field.field}`);
      await delay(200);
    } catch (error) {
      console.log(`   ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 4: Add new fields to transactions collection
  // ========================================
  console.log('\n📋 Step 4: Adding review/attachment fields to transactions...');

  let existingTxFields = [];
  try {
    existingTxFields = await client.request(readFields('transactions'));
  } catch (error) {
    console.error('❌ Could not read transactions fields');
  }
  const existingTxColumns = existingTxFields
    .filter((f) => f.schema !== null && f.schema !== undefined)
    .map((f) => f.field);
  // Include alias fields too
  const existingTxAllFields = existingTxFields.map((f) => f.field);

  for (const field of FIELDS.transactions_new_fields) {
    // For alias fields, check all fields (not just DB columns)
    if (field.type === 'alias') {
      if (existingTxAllFields.includes(field.field)) {
        console.log(`   ⏭️  ${field.field} (alias exists)`);
        continue;
      }
      try {
        await client.request(createField('transactions', field));
        console.log(`   ✅ ${field.field} (alias)`);
        await delay(200);
      } catch (error) {
        console.log(`   ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
      }
      continue;
    }

    if (existingTxColumns.includes(field.field)) {
      console.log(`   ⏭️  ${field.field} (exists)`);
      continue;
    }

    const fieldSpecials = field.meta?.special || [];
    const isRelationField = fieldSpecials.some((s) => SKIP_SPECIALS.includes(s));
    if (isRelationField) {
      console.log(`   ⏭️  ${field.field} (deferred to relation step)`);
      continue;
    }

    try {
      await client.request(createField('transactions', field));
      console.log(`   ✅ ${field.field}`);
      await delay(200);
    } catch (error) {
      console.log(`   ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 5: Create relationships
  // ========================================
  console.log('\n   ⏳ Waiting for schema to sync...');
  await delay(2000);

  console.log('\n📋 Step 5: Creating relationships...');

  for (const relation of RELATIONS) {
    const { collection, field: fieldName, related_collection } = relation;

    // Ensure FK field exists
    let existingFields = [];
    try {
      existingFields = await client.request(readFields(collection));
    } catch (error) {
      // ok
    }

    const existingDbColumns = existingFields
      .filter((f) => f.schema !== null && f.schema !== undefined)
      .map((f) => f.field);

    if (!existingDbColumns.includes(fieldName)) {
      const fieldToCreate = {
        field: fieldName,
        type: related_collection === 'directus_users' || related_collection === 'directus_files' ? 'uuid' : 'integer',
        schema: { is_nullable: true },
        meta: {
          hidden: false,
          interface: related_collection === 'directus_files' ? 'file' : 'select-dropdown-m2o',
          special: related_collection === 'directus_files' ? ['file'] : ['m2o'],
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

    // Create the relation
    try {
      await client.request(createRelation(relation));
      console.log(`   ✅ ${collection}.${fieldName} -> ${related_collection}`);
      await delay(200);
    } catch (error) {
      const msg = error?.errors?.[0]?.message || error?.message || '';
      console.log(`   ⚠️  Relation ${collection}.${fieldName}: ${msg}`);
    }
  }

  // ========================================
  // Step 6: Create uploads folder
  // ========================================
  console.log('\n📋 Step 6: Creating file upload folder...');

  let transactionFilesFolderId = null;

  try {
    const existingFolders = await client.request(readFolders());
    const existing = existingFolders.find((f) => f.name === 'Transaction Documents');

    if (existing) {
      transactionFilesFolderId = existing.id;
      console.log(`   ⏭️  Folder already exists: ${transactionFilesFolderId}`);
    } else {
      // Find parent "Financial" folder if it exists
      const financialFolder = existingFolders.find(
        (f) => f.name === 'Financial' || f.name === 'Financials'
      );

      const folder = await client.request(
        createFolder({
          name: 'Transaction Documents',
          parent: financialFolder?.id || null,
        })
      );
      transactionFilesFolderId = folder.id;
      console.log(`   ✅ Created folder: ${transactionFilesFolderId}`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not create folder:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 7: Set up permissions
  // ========================================
  console.log('\n📋 Step 7: Setting up permissions...');

  // Board Members: Full CRUD on transaction_files
  const boardPermissions = [
    { action: 'create', fields: ['*'] },
    { action: 'read', fields: ['*'] },
    { action: 'update', fields: ['*'] },
    { action: 'delete' },
  ];

  for (const perm of boardPermissions) {
    try {
      await client.request(
        createPermission({
          collection: 'transaction_files',
          action: perm.action,
          policy: POLICIES.BOARD_MEMBER,
          fields: perm.fields || undefined,
        })
      );
      console.log(`   ✅ Board: transaction_files.${perm.action}`);
    } catch (error) {
      console.log(`   ⚠️  Board transaction_files.${perm.action} (may already exist)`);
    }
  }

  // Members: Read-only on transaction_files
  try {
    await client.request(
      createPermission({
        collection: 'transaction_files',
        action: 'read',
        policy: POLICIES.MEMBER,
        fields: ['*'],
      })
    );
    console.log('   ✅ Member: transaction_files.read');
  } catch (error) {
    console.log('   ⚠️  Member transaction_files.read (may already exist)');
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ Transaction Files & Review Setup Complete!\n');
  console.log('📊 Summary:');
  console.log('   New collection:');
  console.log('   - transaction_files: Junction for invoices/receipts/docs');
  console.log('');
  console.log('   New fields on transactions:');
  console.log('   - review_status: pending | reviewed | approved | flagged');
  console.log('   - reviewed_by: M2O to directus_users');
  console.log('   - reviewed_date: timestamp');
  console.log('   - review_notes: text');
  console.log('   - payment_method: ach | check | zelle | wire | cash | card | online | other');
  console.log('   - check_number: string');
  console.log('   - invoice_number: string');
  console.log('   - files: O2M alias to transaction_files');
  console.log('');
  if (transactionFilesFolderId) {
    console.log(`   📁 Upload folder ID: ${transactionFilesFolderId}`);
  }
  console.log('');
  console.log('   Permissions:');
  console.log('   - Board Members: Full CRUD on transaction_files');
  console.log('   - Members: Read-only on transaction_files');
  console.log('');
  console.log('🔑 Next steps:');
  console.log('   1. Update types/directus.ts with TransactionFile interface');
  console.log('   2. Add file upload UI to the transaction detail/edit view');
  console.log('   3. Add review workflow buttons (Approve/Flag) to reconciliation page');
  console.log('   4. Consider adding a "needs receipt" filter to the dashboard');
}

main().catch(console.error);
