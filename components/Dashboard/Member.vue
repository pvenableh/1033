<script setup lang="ts">
import type { DirectusUser } from '~/types/directus';

const props = defineProps<{
  user: DirectusUser;
}>();

const { linkedPerson } = useRoles();
</script>

<template>
  <div class="grid grid-flow-row-dense grid-cols-2 gap-x-4 gap-y-12 lg:gap-y-20 lg:gap-x-10 dashboard">
    <div class="col-span-2 mt-8">
      <h2 class="text-3xl">
        {{ greetUser() }}
        <span class="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-600 font-bold">
          {{ user.first_name }}.
        </span>
      </h2>
      <p class="text-sm opacity-75 mt-2 uppercase tracking-wide">Member Dashboard</p>
    </div>

    <!-- Announcements - Important for all members -->
    <InsightsAnnouncements class="col-span-2 lg:col-span-1" />

    <!-- Newsletter -->
    <InsightsNewsletter class="col-span-2 lg:col-span-1" />

    <!-- Board of Directors -->
    <InsightsBoard class="col-span-2" />

    <!-- Contact information section -->
    <div class="col-span-2 insight">
      <h1 class="insight__label mb-4">Need Help?</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="uppercase tracking-wide text-sm font-bold mb-2">Building Management</h3>
          <p class="text-sm opacity-75">
            Contact the building management for general inquiries and assistance.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="uppercase tracking-wide text-sm font-bold mb-2">Submit a Request</h3>
          <p class="text-sm opacity-75 mb-3">
            Have an issue or request? Let us know.
          </p>
          <nuxt-link to="/requests" class="insight__link text-sm">
            Submit Request
            <UIcon name="i-heroicons-arrow-right" />
          </nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>
