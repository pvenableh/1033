<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

const { isAdmin } = useRoles();

const adminLinks = [
  {
    title: 'User Management',
    description: 'Approve access requests and manage user roles',
    icon: 'i-heroicons-users',
    to: '/admin/users',
  },
  {
    title: 'User Permissions',
    description: 'Configure granular CRUD permissions for individual users',
    icon: 'i-heroicons-key',
    to: '/admin/permissions',
  },
  {
    title: 'Project Management',
    description: 'Manage projects, timelines, events, and tasks',
    icon: 'i-heroicons-folder',
    to: '/admin/projects',
  },
  {
    title: 'Pending Requests',
    description: 'View and approve pending access requests',
    icon: 'i-heroicons-clock',
    to: '/admin/users?status=draft',
  },
  {
    title: 'Invite User',
    description: 'Send an invitation to a new resident',
    icon: 'i-heroicons-envelope',
    to: '/admin/invite',
  },
];
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
  <div class="container mx-auto px-6 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Admin Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Manage users, roles, and access permissions
      </p>
    </div>

    <div v-if="!isAdmin" class="text-center py-12">
      <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-400">
        You do not have administrator privileges.
      </p>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="link in adminLinks"
        :key="link.to"
        :to="link.to"
        class="block p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
        <UIcon :name="link.icon" class="w-8 h-8 text-primary-500 mb-4" />
        <h3 class="font-semibold text-lg mb-2">{{ link.title }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ link.description }}</p>
      </NuxtLink>
    </div>
  </div>
  </div>
</template>
