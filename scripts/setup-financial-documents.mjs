#!/usr/bin/env node

/**
 * Directus Financial Documents Collection Setup Script
 *
 * This script creates the financial_documents collection for storing
 * accountant-uploaded financial reports (reconciliation reports, audit reports,
 * reserve studies, budgets, etc.).
 *
 * Changes:
 * 1. financial_documents - Collection for structured financial reports
 *    - title, category, period, fiscal_year, file, description, report_date, uploaded_by
 *    - Status workflow: draft -> published -> archived
 *    - M2O relations to fiscal_years, directus_files, directus_users
 *
 * 2. "Financial Documents" file folder in Directus
 *
 * 3. Permissions:
 *    - Board Members: Full CRUD
 *    - Members: Read-only (published items only)
 *
 * Usage:
 *   node scripts/setup-financial-documents.mjs
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
// Collection Definition
// ========================================

const COLLECTION = {
  collection: 'financial_documents',
  meta: {
    collection: 'financial_documents',
    icon: 'account_balance',
    note: 'Accountant-uploaded financial reports organized by fiscal year',
    hidden: false,
    singleton: false,
    archive_field: 'status',
    archive_value: 'archived',
    unarchive_value: 'draft',
    archive_app_filter: true,
    sort_field: 'sort',
    accountability: 'all',
    color: '#2E7D32',
    collapse: 'open',
    display_template: '{{title}} - {{category}}',
  },
  schema: { name: 'financial_documents' },
};

// ========================================
// Field Definitions
// ========================================

const FIELDS = [
  // Primary key
  {
    field: 'id',
    type: 'uuid',
    schema: { is_primary_key: true, has_auto_increment: false },
    meta: {
      hidden: true,
      readonly: true,
      interface: 'input',
      special: ['uuid'],
    },
  },

  // Status
  {
    field: 'status',
    type: 'string',
    schema: { default_value: 'draft', is_nullable: false },
    meta: {
      width: 'half',
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Published', value: 'published' },
          { text: 'Draft', value: 'draft' },
          { text: 'Archived', value: 'archived' },
        ],
      },
      display: 'labels',
      display_options: {
        choices: [
          { text: 'Published', value: 'published', foreground: '#FFFFFF', background: '#4CAF50' },
          { text: 'Draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
          { text: 'Archived', value: 'archived', foreground: '#FFFFFF', background: '#F44336' },
        ],
      },
    },
  },

  // Sort
  {
    field: 'sort',
    type: 'integer',
    schema: { is_nullable: true },
    meta: { hidden: true, interface: 'input' },
  },

  // System tracking fields
  {
    field: 'user_created',
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      special: ['user-created'],
      interface: 'select-dropdown-m2o',
      display: 'user',
      readonly: true,
      hidden: true,
      width: 'half',
    },
  },
  {
    field: 'date_created',
    type: 'timestamp',
    schema: { is_nullable: true },
    meta: {
      special: ['date-created'],
      interface: 'datetime',
      display: 'datetime',
      readonly: true,
      hidden: true,
      width: 'half',
    },
  },
  {
    field: 'user_updated',
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      special: ['user-updated'],
      interface: 'select-dropdown-m2o',
      display: 'user',
      readonly: true,
      hidden: true,
      width: 'half',
    },
  },
  {
    field: 'date_updated',
    type: 'timestamp',
    schema: { is_nullable: true },
    meta: {
      special: ['date-updated'],
      interface: 'datetime',
      display: 'datetime',
      readonly: true,
      hidden: true,
      width: 'half',
    },
  },

  // ===== Content Fields =====

  // Title
  {
    field: 'title',
    type: 'string',
    schema: { is_nullable: false },
    meta: {
      width: 'full',
      interface: 'input',
      note: 'e.g., "March 2025 Treasurer\'s Report" or "2025 Annual Audit Report"',
      required: true,
      sort: 1,
    },
  },

  // Category (enum dropdown)
  {
    field: 'category',
    type: 'string',
    schema: { is_nullable: false, default_value: 'monthly_report' },
    meta: {
      width: 'half',
      interface: 'select-dropdown',
      required: true,
      sort: 2,
      options: {
        choices: [
          { text: 'Monthly Report', value: 'monthly_report' },
          { text: 'Annual Report', value: 'annual_report' },
          { text: 'Budget Document', value: 'budget' },
          { text: 'Reserve Study', value: 'reserve_study' },
          { text: 'Compliance / Insurance', value: 'compliance' },
          { text: 'Assessment Report', value: 'assessment' },
          { text: 'Tax Filing', value: 'tax_filing' },
          { text: 'Audit Report', value: 'audit' },
          { text: 'Other', value: 'other' },
        ],
      },
      display: 'labels',
      display_options: {
        choices: [
          { text: 'Monthly Report', value: 'monthly_report', foreground: '#1565C0', background: '#E3F2FD' },
          { text: 'Annual Report', value: 'annual_report', foreground: '#4A148C', background: '#F3E5F5' },
          { text: 'Budget', value: 'budget', foreground: '#E65100', background: '#FFF3E0' },
          { text: 'Reserve Study', value: 'reserve_study', foreground: '#1B5E20', background: '#E8F5E9' },
          { text: 'Compliance', value: 'compliance', foreground: '#BF360C', background: '#FBE9E7' },
          { text: 'Assessment', value: 'assessment', foreground: '#006064', background: '#E0F7FA' },
          { text: 'Tax Filing', value: 'tax_filing', foreground: '#4E342E', background: '#EFEBE9' },
          { text: 'Audit', value: 'audit', foreground: '#1A237E', background: '#E8EAF6' },
          { text: 'Other', value: 'other', foreground: '#424242', background: '#F5F5F5' },
        ],
      },
    },
  },

  // Period (month or quarter identifier)
  {
    field: 'period',
    type: 'string',
    schema: { is_nullable: true },
    meta: {
      width: 'half',
      interface: 'select-dropdown',
      sort: 3,
      note: 'Month or quarter this report covers. Leave blank for annual reports.',
      options: {
        allowOther: true,
        choices: [
          { text: 'January', value: '01' },
          { text: 'February', value: '02' },
          { text: 'March', value: '03' },
          { text: 'April', value: '04' },
          { text: 'May', value: '05' },
          { text: 'June', value: '06' },
          { text: 'July', value: '07' },
          { text: 'August', value: '08' },
          { text: 'September', value: '09' },
          { text: 'October', value: '10' },
          { text: 'November', value: '11' },
          { text: 'December', value: '12' },
          { text: 'Q1 (Jan-Mar)', value: 'Q1' },
          { text: 'Q2 (Apr-Jun)', value: 'Q2' },
          { text: 'Q3 (Jul-Sep)', value: 'Q3' },
          { text: 'Q4 (Oct-Dec)', value: 'Q4' },
        ],
      },
    },
  },

  // Fiscal Year (M2O - deferred to relation step)
  {
    field: 'fiscal_year',
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      width: 'half',
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      sort: 4,
      note: 'Which fiscal year this document belongs to',
      display: 'related-values',
      display_options: {
        template: '{{year}}',
      },
    },
  },

  // File (M2O to directus_files - deferred to relation step)
  {
    field: 'file',
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      width: 'half',
      interface: 'file',
      special: ['file'],
      sort: 5,
      note: 'The uploaded PDF or document file',
    },
  },

  // Description
  {
    field: 'description',
    type: 'text',
    schema: { is_nullable: true },
    meta: {
      width: 'full',
      interface: 'input-multiline',
      sort: 6,
      note: 'Optional description or notes about this document',
    },
  },

  // Report Date (the date the report covers or was produced)
  {
    field: 'report_date',
    type: 'date',
    schema: { is_nullable: true },
    meta: {
      width: 'half',
      interface: 'datetime',
      sort: 7,
      note: 'Date the report was produced or covers',
    },
  },

  // Uploaded By (M2O to directus_users - deferred to relation step)
  {
    field: 'uploaded_by',
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      width: 'half',
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      display: 'user',
      sort: 8,
      note: 'Who uploaded this document',
    },
  },
];

// ========================================
// Relation Definitions
// ========================================

const RELATIONS = [
  // fiscal_year -> fiscal_years (M2O)
  {
    collection: 'financial_documents',
    field: 'fiscal_year',
    related_collection: 'fiscal_years',
    meta: {
      sort_field: null,
    },
    schema: {
      on_delete: 'SET NULL',
    },
  },

  // file -> directus_files (M2O)
  {
    collection: 'financial_documents',
    field: 'file',
    related_collection: 'directus_files',
    meta: {
      sort_field: null,
    },
    schema: {
      on_delete: 'SET NULL',
    },
  },

  // uploaded_by -> directus_users (M2O)
  {
    collection: 'financial_documents',
    field: 'uploaded_by',
    related_collection: 'directus_users',
    meta: {
      sort_field: null,
    },
    schema: {
      on_delete: 'SET NULL',
    },
  },

  // user_created -> directus_users (system)
  {
    collection: 'financial_documents',
    field: 'user_created',
    related_collection: 'directus_users',
    schema: { on_delete: 'SET NULL' },
  },

  // user_updated -> directus_users (system)
  {
    collection: 'financial_documents',
    field: 'user_updated',
    related_collection: 'directus_users',
    schema: { on_delete: 'SET NULL' },
  },
];

// ========================================
// Permission Definitions
// ========================================

const PERMISSIONS = [
  // Board Member - full CRUD
  { policy: POLICIES.BOARD_MEMBER, collection: 'financial_documents', action: 'create', fields: ['*'] },
  { policy: POLICIES.BOARD_MEMBER, collection: 'financial_documents', action: 'read', fields: ['*'] },
  { policy: POLICIES.BOARD_MEMBER, collection: 'financial_documents', action: 'update', fields: ['*'] },
  { policy: POLICIES.BOARD_MEMBER, collection: 'financial_documents', action: 'delete', fields: ['*'] },

  // Member - read only, published items only
  {
    policy: POLICIES.MEMBER,
    collection: 'financial_documents',
    action: 'read',
    fields: ['*'],
    permissions: { status: { _eq: 'published' } },
  },
];

// ========================================
// Main
// ========================================

async function main() {
  console.log('💰 Directus Financial Documents Setup');
  console.log('=======================================\n');

  // Get credentials
  const directusUrl =
    process.env.DIRECTUS_URL ||
    (await prompt('Directus URL (e.g., https://admin.1033lenox.com): '));
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
  // Step 2: Create financial_documents collection
  // ========================================
  console.log('\n📋 Step 2: Creating financial_documents collection...');

  if (existingNames.includes('financial_documents')) {
    console.log('   ⏭️  financial_documents already exists');
  } else {
    try {
      await client.request(createCollection(COLLECTION));
      console.log('   ✅ Created financial_documents collection');
      await delay(500);
    } catch (error) {
      console.log('   ❌ Error:', error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 3: Create non-relation fields
  // ========================================
  console.log('\n📋 Step 3: Creating fields (non-relation)...');

  const SKIP_SPECIALS = ['m2o', 'file', 'user-created', 'user-updated'];

  let existingFields = [];
  try {
    existingFields = await client.request(readFields('financial_documents'));
  } catch (error) {
    // Collection might have just been created
  }
  const existingFieldColumns = existingFields
    .filter((f) => f.schema !== null && f.schema !== undefined)
    .map((f) => f.field);

  for (const field of FIELDS) {
    if (field.type === 'alias') {
      console.log(`   ⏭️  ${field.field} (alias field)`);
      continue;
    }
    if (existingFieldColumns.includes(field.field)) {
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
      await client.request(createField('financial_documents', field));
      console.log(`   ✅ ${field.field}`);
      await delay(200);
    } catch (error) {
      console.log(`   ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 4: Wait for schema sync then create relations
  // ========================================
  console.log('\n   ⏳ Waiting for schema to sync...');
  await delay(2000);

  console.log('\n📋 Step 4: Creating relationships...');

  for (const relation of RELATIONS) {
    const { collection, field: fieldName, related_collection } = relation;

    // Ensure FK field exists as a DB column
    let currentFields = [];
    try {
      currentFields = await client.request(readFields(collection));
    } catch (error) {
      // ok
    }

    const currentDbColumns = currentFields
      .filter((f) => f.schema !== null && f.schema !== undefined)
      .map((f) => f.field);

    if (!currentDbColumns.includes(fieldName)) {
      // Find the field definition from FIELDS array
      const fieldDef = FIELDS.find((f) => f.field === fieldName);
      const fieldToCreate = fieldDef || {
        field: fieldName,
        type: related_collection === 'directus_users' || related_collection === 'directus_files' ? 'uuid' : 'uuid',
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
  // Step 5: Create file folder
  // ========================================
  console.log('\n📋 Step 5: Creating file upload folder...');

  let financialDocsFolderId = null;

  try {
    const existingFolders = await client.request(readFolders());
    const existing = existingFolders.find((f) => f.name === 'Financial Documents');

    if (existing) {
      financialDocsFolderId = existing.id;
      console.log(`   ⏭️  "Financial Documents" folder already exists: ${financialDocsFolderId}`);
    } else {
      const folder = await client.request(
        createFolder({
          name: 'Financial Documents',
        })
      );
      financialDocsFolderId = folder.id;
      console.log(`   ✅ Created "Financial Documents" folder: ${financialDocsFolderId}`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not create folder:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 6: Set up permissions
  // ========================================
  console.log('\n📋 Step 6: Setting up permissions...');

  for (const perm of PERMISSIONS) {
    try {
      await client.request(
        createPermission({
          collection: perm.collection,
          action: perm.action,
          policy: perm.policy,
          fields: perm.fields || undefined,
          permissions: perm.permissions || undefined,
        })
      );
      const policyName = perm.policy === POLICIES.BOARD_MEMBER ? 'Board' : 'Member';
      console.log(`   ✅ ${policyName}: financial_documents.${perm.action}`);
    } catch (error) {
      const policyName = perm.policy === POLICIES.BOARD_MEMBER ? 'Board' : 'Member';
      console.log(`   ⚠️  ${policyName} financial_documents.${perm.action} (may already exist)`);
    }
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n✨ Financial Documents Setup Complete!\n');
  console.log('📊 Summary:');
  console.log('   Collection:');
  console.log('   - financial_documents: Accountant-uploaded financial reports');
  console.log('');
  console.log('   Fields:');
  console.log('   - title: Document title (required)');
  console.log('   - category: monthly_report | annual_report | budget | reserve_study | compliance | assessment | tax_filing | audit | other');
  console.log('   - period: Month (01-12) or quarter (Q1-Q4)');
  console.log('   - fiscal_year: M2O to fiscal_years');
  console.log('   - file: M2O to directus_files');
  console.log('   - description: Optional notes');
  console.log('   - report_date: Date the report covers');
  console.log('   - uploaded_by: M2O to directus_users');
  console.log('');
  if (financialDocsFolderId) {
    console.log(`   📁 Upload folder ID: ${financialDocsFolderId}`);
  }
  console.log('');
  console.log('   Permissions:');
  console.log('   - Board Members: Full CRUD on financial_documents');
  console.log('   - Members: Read-only (published items only)');
  console.log('');
  console.log('🔑 Next steps:');
  console.log('   1. Update types/directus.ts with FinancialDocument interface');
  console.log('   2. Update pages/documents/index.vue to fetch from financial_documents');
  console.log('   3. Create a test document in Directus admin to verify');
}

main().catch(console.error);
