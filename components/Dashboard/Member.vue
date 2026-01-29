<script setup lang="ts">
import type { DirectusUser } from '~/types/directus'

const props = defineProps<{
  user: DirectusUser
}>()

const { linkedPerson } = useRoles()

// Help items for member dashboard (only 2 items)
const helpItems = [
  {
    title: "Building Management",
    description: "Contact the building management for general inquiries and assistance.",
  },
  {
    title: "Submit a Request",
    description: "Have an issue or request? Let us know.",
    link: "/requests",
    linkText: "Submit Request",
  },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <DashboardWidgetsWelcomeHeader
      :first-name="user.first_name || ''"
      dashboard-type="member"
    />

    <!-- My Tasks -->
    <DashboardWidgetsTasksCard />

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Announcements - Important for all members -->
      <InsightsAnnouncements />

      <!-- Newsletter -->
      <InsightsNewsletter />
    </div>

    <!-- Board of Directors -->
    <InsightsBoard />

    <!-- Help Section -->
    <DashboardWidgetsHelpCard :items="helpItems" />
  </div>
</template>
