#!/usr/bin/env node

/**
 * Directus Project Timeline System Setup Script
 *
 * Collections created:
 * 1. project_categories - Project groupings
 * 2. projects - Main project records
 * 3. project_event_categories - Event type categorization
 * 4. project_events - Timeline events/milestones
 * 5. project_tasks - Tasks attached to events
 * 6. project_event_files - File attachments junction
 * 7. project_task_watchers - Users watching/following tasks
 *
 * Usage:
 *   node scripts/setup-projects.mjs
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

// Helper to add delay between operations
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

// ========================================
// Collection Definitions
// ========================================

const COLLECTIONS = {
  project_categories: {
    collection: 'project_categories',
    meta: {
      collection: 'project_categories',
      icon: 'folder',
      note: 'Categories for organizing projects',
      singleton: false,
      hidden: false,
    },
    schema: { name: 'project_categories' },
  },
  projects: {
    collection: 'projects',
    meta: {
      collection: 'projects',
      icon: 'timeline',
      note: 'Project timeline records',
      display_template: '{{name}}',
      sort_field: 'sort',
      singleton: false,
      hidden: false,
    },
    schema: { name: 'projects' },
  },
  project_event_categories: {
    collection: 'project_event_categories',
    meta: {
      collection: 'project_event_categories',
      icon: 'label',
      note: 'Event type categorization',
      singleton: false,
      hidden: false,
    },
    schema: { name: 'project_event_categories' },
  },
  project_events: {
    collection: 'project_events',
    meta: {
      collection: 'project_events',
      icon: 'event',
      note: 'Timeline events and milestones',
      display_template: '{{title}}',
      sort_field: 'event_date',
      singleton: false,
      hidden: false,
    },
    schema: { name: 'project_events' },
  },
  project_tasks: {
    collection: 'project_tasks',
    meta: {
      collection: 'project_tasks',
      icon: 'check_circle',
      note: 'Tasks attached to events',
      display_template: '{{title}}',
      sort_field: 'sort',
      singleton: false,
      hidden: false,
    },
    schema: { name: 'project_tasks' },
  },
  project_event_files: {
    collection: 'project_event_files',
    meta: {
      collection: 'project_event_files',
      icon: 'attach_file',
      note: 'File attachments for events',
      hidden: true,
    },
    schema: { name: 'project_event_files' },
  },
  project_task_watchers: {
    collection: 'project_task_watchers',
    meta: {
      collection: 'project_task_watchers',
      icon: 'visibility',
      note: 'Users watching/following tasks',
      hidden: true,
    },
    schema: { name: 'project_task_watchers' },
  },
};

// ========================================
// Field Definitions
// ========================================

const FIELDS = {
  project_categories: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Published', value: 'published' },
            { text: 'Draft', value: 'draft' },
          ],
        },
        width: 'half',
      },
      schema: { default_value: 'published' },
    },
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', hidden: true, special: ['sort'] },
    },
    {
      field: 'name',
      type: 'string',
      meta: { interface: 'input', width: 'half', required: true },
      schema: { is_nullable: false },
    },
    {
      field: 'color',
      type: 'string',
      meta: { interface: 'select-color', width: 'half' },
      schema: { default_value: '#C4A052' },
    },
    {
      field: 'icon',
      type: 'string',
      meta: { interface: 'input', width: 'half', note: 'Icon name (e.g., i-heroicons-folder)' },
    },
  ],

  projects: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Draft', value: 'draft' },
            { text: 'Active', value: 'active' },
            { text: 'Completed', value: 'completed' },
            { text: 'Archived', value: 'archived' },
          ],
        },
        width: 'half',
      },
      schema: { default_value: 'active' },
    },
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', hidden: true, special: ['sort'] },
    },
    {
      field: 'user_created',
      type: 'uuid',
      meta: {
        special: ['user-created'],
        interface: 'select-dropdown-m2o',
        readonly: true,
        width: 'half',
      },
    },
    {
      field: 'user_updated',
      type: 'uuid',
      meta: {
        special: ['user-updated'],
        interface: 'select-dropdown-m2o',
        readonly: true,
        width: 'half',
      },
    },
    {
      field: 'date_created',
      type: 'timestamp',
      meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half' },
    },
    {
      field: 'date_updated',
      type: 'timestamp',
      meta: { special: ['date-updated'], interface: 'datetime', readonly: true, width: 'half' },
    },
    {
      field: 'name',
      type: 'string',
      meta: { interface: 'input', width: 'full', required: true },
      schema: { is_nullable: false },
    },
    {
      field: 'description',
      type: 'text',
      meta: { interface: 'input-rich-text-html', width: 'full' },
    },
    {
      field: 'color',
      type: 'string',
      meta: { interface: 'select-color', width: 'half', note: 'Timeline line color' },
      schema: { default_value: '#C4A052' },
    },
    {
      field: 'icon',
      type: 'string',
      meta: { interface: 'input', width: 'half' },
    },
    {
      field: 'start_date',
      type: 'date',
      meta: { interface: 'datetime', width: 'half', required: true },
      schema: { is_nullable: false },
    },
    {
      field: 'target_end_date',
      type: 'date',
      meta: { interface: 'datetime', width: 'half' },
    },
    {
      field: 'actual_end_date',
      type: 'date',
      meta: { interface: 'datetime', width: 'half' },
    },
    // Alias fields for relations
    {
      field: 'events',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
      },
    },
    {
      field: 'children',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
        note: 'Sub-projects',
      },
    },
  ],

  project_event_categories: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Published', value: 'published' },
            { text: 'Draft', value: 'draft' },
          ],
        },
        width: 'half',
      },
      schema: { default_value: 'published' },
    },
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', hidden: true, special: ['sort'] },
    },
    {
      field: 'name',
      type: 'string',
      meta: { interface: 'input', width: 'half', required: true },
      schema: { is_nullable: false },
    },
    {
      field: 'color',
      type: 'string',
      meta: { interface: 'select-color', width: 'half', note: 'Badge background color' },
      schema: { default_value: '#2D2A24' },
    },
    {
      field: 'text_color',
      type: 'string',
      meta: { interface: 'select-color', width: 'half', note: 'Badge text color' },
      schema: { default_value: '#C4A052' },
    },
    {
      field: 'icon',
      type: 'string',
      meta: { interface: 'input', width: 'half' },
    },
  ],

  project_events: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Published', value: 'published' },
            { text: 'Draft', value: 'draft' },
          ],
        },
        width: 'half',
      },
      schema: { default_value: 'published' },
    },
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', hidden: true, special: ['sort'] },
    },
    {
      field: 'user_created',
      type: 'uuid',
      meta: {
        special: ['user-created'],
        interface: 'select-dropdown-m2o',
        readonly: true,
        width: 'half',
      },
    },
    {
      field: 'user_updated',
      type: 'uuid',
      meta: {
        special: ['user-updated'],
        interface: 'select-dropdown-m2o',
        readonly: true,
        width: 'half',
      },
    },
    {
      field: 'date_created',
      type: 'timestamp',
      meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half' },
    },
    {
      field: 'date_updated',
      type: 'timestamp',
      meta: { special: ['date-updated'], interface: 'datetime', readonly: true, width: 'half' },
    },
    {
      field: 'title',
      type: 'string',
      meta: { interface: 'input', width: 'full', required: true },
      schema: { is_nullable: false },
    },
    {
      field: 'description',
      type: 'text',
      meta: { interface: 'input-rich-text-html', width: 'full' },
    },
    {
      field: 'event_date',
      type: 'date',
      meta: { interface: 'datetime', width: 'half', required: true },
      schema: { is_nullable: false },
    },
    {
      field: 'is_milestone',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        width: 'half',
        note: 'Major milestone (larger node on timeline)',
      },
      schema: { default_value: false },
    },
    // Alias fields for relations
    {
      field: 'tasks',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
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
      field: 'spawned_projects',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
        note: 'Sub-projects that branch from this event',
      },
    },
  ],

  project_tasks: [
    {
      field: 'id',
      type: 'uuid',
      meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
      schema: { is_primary_key: true, is_nullable: false },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Published', value: 'published' },
            { text: 'Draft', value: 'draft' },
          ],
        },
        width: 'half',
      },
      schema: { default_value: 'published' },
    },
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', hidden: true, special: ['sort'] },
    },
    {
      field: 'user_created',
      type: 'uuid',
      meta: {
        special: ['user-created'],
        interface: 'select-dropdown-m2o',
        readonly: true,
        width: 'half',
      },
    },
    {
      field: 'date_created',
      type: 'timestamp',
      meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half' },
    },
    {
      field: 'title',
      type: 'string',
      meta: { interface: 'input', width: 'full', required: true },
      schema: { is_nullable: false },
    },
    {
      field: 'description',
      type: 'text',
      meta: { interface: 'input-multiline', width: 'full' },
    },
    {
      field: 'completed',
      type: 'boolean',
      meta: { interface: 'boolean', width: 'half' },
      schema: { default_value: false },
    },
    {
      field: 'completed_at',
      type: 'timestamp',
      meta: { interface: 'datetime', width: 'half', readonly: true },
    },
    {
      field: 'due_date',
      type: 'date',
      meta: { interface: 'datetime', width: 'half' },
    },
    {
      field: 'priority',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Low', value: 'low' },
            { text: 'Medium', value: 'medium' },
            { text: 'High', value: 'high' },
          ],
        },
        width: 'half',
      },
    },
    // Alias field for watchers
    {
      field: 'watchers',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        display: 'related-values',
      },
    },
  ],

  project_event_files: [
    {
      field: 'id',
      type: 'integer',
      meta: { hidden: true, interface: 'input' },
      schema: { is_primary_key: true, has_auto_increment: true },
    },
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', hidden: true },
    },
  ],

  project_task_watchers: [
    {
      field: 'id',
      type: 'integer',
      meta: { hidden: true, interface: 'input' },
      schema: { is_primary_key: true, has_auto_increment: true },
    },
    {
      field: 'date_created',
      type: 'timestamp',
      meta: { special: ['date-created'], interface: 'datetime', readonly: true },
    },
  ],
};

// ========================================
// Relationships
// ========================================

const RELATIONS = [
  // projects.category_id -> project_categories
  {
    collection: 'projects',
    field: 'category_id',
    related_collection: 'project_categories',
    meta: { one_field: 'projects', one_deselect_action: 'nullify' },
  },
  // projects.parent_id -> projects (self-referential)
  {
    collection: 'projects',
    field: 'parent_id',
    related_collection: 'projects',
    meta: { one_field: 'children', one_deselect_action: 'nullify' },
  },
  // projects.parent_event_id -> project_events
  {
    collection: 'projects',
    field: 'parent_event_id',
    related_collection: 'project_events',
    meta: { one_field: 'spawned_projects', one_deselect_action: 'nullify' },
  },
  // projects.user_created -> directus_users
  {
    collection: 'projects',
    field: 'user_created',
    related_collection: 'directus_users',
  },
  // projects.user_updated -> directus_users
  {
    collection: 'projects',
    field: 'user_updated',
    related_collection: 'directus_users',
  },

  // project_events.project_id -> projects
  {
    collection: 'project_events',
    field: 'project_id',
    related_collection: 'projects',
    meta: { one_field: 'events', one_deselect_action: 'nullify' },
  },
  // project_events.category_id -> project_event_categories
  {
    collection: 'project_events',
    field: 'category_id',
    related_collection: 'project_event_categories',
    meta: { one_deselect_action: 'nullify' },
  },
  // project_events.user_created -> directus_users
  {
    collection: 'project_events',
    field: 'user_created',
    related_collection: 'directus_users',
  },
  // project_events.user_updated -> directus_users
  {
    collection: 'project_events',
    field: 'user_updated',
    related_collection: 'directus_users',
  },

  // project_tasks.event_id -> project_events
  {
    collection: 'project_tasks',
    field: 'event_id',
    related_collection: 'project_events',
    meta: { one_field: 'tasks', one_deselect_action: 'nullify' },
  },
  // project_tasks.assignee_id -> directus_users
  {
    collection: 'project_tasks',
    field: 'assignee_id',
    related_collection: 'directus_users',
    meta: { one_deselect_action: 'nullify' },
  },
  // project_tasks.completed_by -> directus_users
  {
    collection: 'project_tasks',
    field: 'completed_by',
    related_collection: 'directus_users',
    meta: { one_deselect_action: 'nullify' },
  },
  // project_tasks.user_created -> directus_users
  {
    collection: 'project_tasks',
    field: 'user_created',
    related_collection: 'directus_users',
  },

  // project_event_files junction
  {
    collection: 'project_event_files',
    field: 'project_event_id',
    related_collection: 'project_events',
    meta: { one_field: 'files', junction_field: 'directus_files_id', one_deselect_action: 'nullify' },
  },
  {
    collection: 'project_event_files',
    field: 'directus_files_id',
    related_collection: 'directus_files',
    meta: { junction_field: 'project_event_id', one_deselect_action: 'nullify' },
  },

  // project_task_watchers junction
  {
    collection: 'project_task_watchers',
    field: 'task_id',
    related_collection: 'project_tasks',
    meta: { one_field: 'watchers', junction_field: 'user_id', one_deselect_action: 'nullify' },
  },
  {
    collection: 'project_task_watchers',
    field: 'user_id',
    related_collection: 'directus_users',
    meta: { junction_field: 'task_id', one_deselect_action: 'nullify' },
  },
];

// ========================================
// Permissions
// ========================================

const PROJECT_PERMISSIONS = {
  // Board Member permissions - full access
  [POLICIES.BOARD_MEMBER]: [
    // project_categories
    { collection: 'project_categories', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'project_categories', action: 'create', fields: ['*'], permissions: {} },
    { collection: 'project_categories', action: 'update', fields: ['*'], permissions: {} },
    { collection: 'project_categories', action: 'delete', permissions: {} },

    // projects
    { collection: 'projects', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'projects', action: 'create', fields: ['*'], permissions: {} },
    { collection: 'projects', action: 'update', fields: ['*'], permissions: {} },
    { collection: 'projects', action: 'delete', permissions: {} },

    // project_event_categories
    { collection: 'project_event_categories', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'project_event_categories', action: 'create', fields: ['*'], permissions: {} },
    { collection: 'project_event_categories', action: 'update', fields: ['*'], permissions: {} },
    { collection: 'project_event_categories', action: 'delete', permissions: {} },

    // project_events
    { collection: 'project_events', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'project_events', action: 'create', fields: ['*'], permissions: {} },
    { collection: 'project_events', action: 'update', fields: ['*'], permissions: {} },
    { collection: 'project_events', action: 'delete', permissions: {} },

    // project_tasks
    { collection: 'project_tasks', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'project_tasks', action: 'create', fields: ['*'], permissions: {} },
    { collection: 'project_tasks', action: 'update', fields: ['*'], permissions: {} },
    { collection: 'project_tasks', action: 'delete', permissions: {} },

    // project_event_files
    { collection: 'project_event_files', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'project_event_files', action: 'create', fields: ['*'], permissions: {} },
    { collection: 'project_event_files', action: 'delete', permissions: {} },

    // project_task_watchers
    { collection: 'project_task_watchers', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'project_task_watchers', action: 'create', fields: ['*'], permissions: {} },
    { collection: 'project_task_watchers', action: 'delete', permissions: {} },
  ],

  // Member permissions - read all, create/update limited
  [POLICIES.MEMBER]: [
    // project_categories - read only
    { collection: 'project_categories', action: 'read', fields: ['*'], permissions: {} },

    // projects - read all, create own
    { collection: 'projects', action: 'read', fields: ['*'], permissions: {} },
    {
      collection: 'projects',
      action: 'create',
      fields: ['name', 'description', 'color', 'icon', 'category_id', 'start_date', 'target_end_date'],
      permissions: {},
    },
    {
      collection: 'projects',
      action: 'update',
      fields: ['name', 'description', 'color', 'icon', 'target_end_date', 'actual_end_date', 'status'],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },

    // project_event_categories - read only
    { collection: 'project_event_categories', action: 'read', fields: ['*'], permissions: {} },

    // project_events - read all, create on accessible projects
    { collection: 'project_events', action: 'read', fields: ['*'], permissions: {} },
    {
      collection: 'project_events',
      action: 'create',
      fields: ['project_id', 'title', 'description', 'event_date', 'category_id', 'is_milestone'],
      permissions: {},
    },
    {
      collection: 'project_events',
      action: 'update',
      fields: ['title', 'description', 'event_date', 'category_id', 'is_milestone'],
      permissions: { user_created: { _eq: '$CURRENT_USER' } },
    },

    // project_tasks - full access for task management
    { collection: 'project_tasks', action: 'read', fields: ['*'], permissions: {} },
    {
      collection: 'project_tasks',
      action: 'create',
      fields: ['event_id', 'title', 'description', 'assignee_id', 'due_date', 'priority'],
      permissions: {},
    },
    {
      collection: 'project_tasks',
      action: 'update',
      fields: ['title', 'description', 'completed', 'completed_at', 'completed_by', 'due_date', 'priority', 'assignee_id'],
      permissions: {},
    },

    // project_event_files
    { collection: 'project_event_files', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'project_event_files', action: 'create', fields: ['*'], permissions: {} },

    // project_task_watchers
    { collection: 'project_task_watchers', action: 'read', fields: ['*'], permissions: {} },
    { collection: 'project_task_watchers', action: 'create', fields: ['*'], permissions: {} },
    {
      collection: 'project_task_watchers',
      action: 'delete',
      permissions: { user_id: { _eq: '$CURRENT_USER' } },
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
  console.log('📊 Directus Project Timeline System Setup Script');
  console.log('=================================================\n');

  // Get credentials
  const directusUrl =
    process.env.DIRECTUS_URL || (await prompt('Directus URL (e.g., https://admin.1033lenox.com): '));
  const email = process.env.DIRECTUS_EMAIL || (await prompt('Admin Email: '));
  const password = process.env.DIRECTUS_PASSWORD || (await prompt('Admin Password: '));

  console.log('\n📡 Connecting to Directus...');

  // Create client and authenticate
  const client = createDirectus(directusUrl).with(authentication()).with(rest());

  try {
    await client.login({ email, password });
    console.log('✅ Authentication successful\n');
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
    console.error('❌ Authentication failed:', errorMessage);
    process.exit(1);
  }

  // ========================================
  // Step 1: Create uploads folder for project files
  // ========================================
  console.log('📁 Step 1: Creating project files folder...');

  let projectsFolderId = null;
  try {
    const folders = await client.request(
      readFolders({
        filter: { name: { _eq: 'Project Files' } },
      })
    );

    if (folders && folders.length > 0) {
      projectsFolderId = folders[0].id;
      console.log(`   ✅ Folder already exists: ${projectsFolderId}`);
    } else {
      const newFolder = await client.request(
        createFolder({
          name: 'Project Files',
        })
      );
      projectsFolderId = newFolder.id;
      console.log(`   ✅ Created folder: ${projectsFolderId}`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not create folder:', error?.errors?.[0]?.message || error?.message);
  }

  // ========================================
  // Step 2: Create collections
  // ========================================
  console.log('\n📋 Step 2: Creating collections...');

  let existingCollections = [];
  try {
    existingCollections = await client.request(readCollections());
  } catch (error) {
    console.log('   ⚠️  Could not read collections:', error?.errors?.[0]?.message || error?.message);
  }

  const existingNames = existingCollections.map((c) => c.collection);

  for (const [name, config] of Object.entries(COLLECTIONS)) {
    if (existingNames.includes(name)) {
      console.log(`   ⏭️  Skipping ${name} (already exists)`);
      continue;
    }

    try {
      await client.request(createCollection(config));
      console.log(`   ✅ Created collection: ${name}`);
      await delay(500);
    } catch (error) {
      console.log(`   ❌ Error creating ${name}:`, error?.errors?.[0]?.message || error?.message);
    }
  }

  // ========================================
  // Step 3: Create fields for each collection
  // ========================================
  console.log('\n📋 Step 3: Creating fields...');

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
      .filter((f) => f.schema !== null && f.schema !== undefined)
      .map((f) => f.field);

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
      const isRelationField = fieldSpecials.some((s) => SKIP_SPECIALS.includes(s));

      if (isRelationField) {
        console.log(`      ⏭️  ${field.field} (deferred to relation step)`);
        continue;
      }

      try {
        await client.request(createField(collectionName, field));
        console.log(`      ✅ ${field.field}`);
        await delay(200);
      } catch (error) {
        console.log(`      ❌ ${field.field}:`, error?.errors?.[0]?.message || error?.message);
      }
    }
  }

  // Wait before creating relationships
  console.log('\n   ⏳ Waiting for schema to sync...');
  await delay(2000);

  // ========================================
  // Step 4: Create relationships (and their FK fields)
  // ========================================
  console.log('\n📋 Step 4: Creating relationships...');

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
      .filter((f) => f.schema !== null && f.schema !== undefined)
      .map((f) => f.field);

    const fieldExists = existingDbColumns.includes(fieldName);

    if (!fieldExists) {
      const fieldToCreate = {
        field: fieldName,
        type: 'uuid',
        schema: {
          is_nullable: true,
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
  // Step 5: Set up permissions
  // ========================================
  console.log('\n📋 Step 5: Setting up permissions...');

  let existingPermissions = [];
  try {
    existingPermissions = await client.request(readPermissions({ limit: -1 }));
    console.log(`   Found ${existingPermissions.length} existing permissions`);
  } catch (error) {
    console.log('   ⚠️  Could not read permissions:', error?.errors?.[0]?.message || error?.message);
  }

  for (const [policyId, permissions] of Object.entries(PROJECT_PERMISSIONS)) {
    const policyName = Object.keys(POLICIES).find((key) => POLICIES[key] === policyId);
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
  console.log('\n✨ Project Timeline system setup complete!\n');

  console.log('📊 Summary:');
  console.log('   Collections created:');
  console.log('   - project_categories: Project groupings');
  console.log('   - projects: Main project records');
  console.log('   - project_event_categories: Event type categorization');
  console.log('   - project_events: Timeline events and milestones');
  console.log('   - project_tasks: Tasks attached to events');
  console.log('   - project_event_files: File attachments');
  console.log('   - project_task_watchers: Users watching tasks');
  console.log('');
  console.log('   Features:');
  console.log('   - Horizontal timeline with colored project lines');
  console.log('   - Events as clickable nodes with tasks and files');
  console.log('   - Nested/sub-projects branching from parent events');
  console.log('   - Single task assignee + optional watchers');
  console.log('   - Polymorphic comments/reactions support');
  console.log('');
  if (projectsFolderId) {
    console.log(`   📁 Project files folder ID: ${projectsFolderId}`);
  }
  console.log('');
  console.log('🔑 Usage:');
  console.log('   Projects and events support polymorphic comments/reactions via:');
  console.log('   - target_collection: "project_events"');
  console.log('   - target_id: The event ID');
}

main().catch(console.error);
