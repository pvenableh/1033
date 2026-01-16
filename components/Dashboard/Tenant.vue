<script setup lang="ts">
import type { DirectusUser } from '~/types/directus'

const props = defineProps<{
  user: DirectusUser
}>()

const { linkedPerson } = useRoles()

// Get lease info for the tenant
const activeLease = computed(() => {
  const person = linkedPerson.value as any
  if (person?.leases) {
    const now = new Date()
    return person.leases.find((lease: any) => {
      const start = new Date(lease.start)
      const finish = new Date(lease.finish)
      return start <= now && finish >= now
    })
  }
  return null
})

// Get unit info from user
const userUnits = computed(() => {
  const extUser = props.user as any
  return extUser?.units || []
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <DashboardWidgetsWelcomeHeader
      :first-name="user.first_name || ''"
      dashboard-type="tenant"
    />

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Lease Status Card -->
      <DashboardWidgetsLeaseStatusCard :lease="activeLease" />

      <!-- Unit Information -->
      <DashboardWidgetsUnitInfoCard :units="userUnits" />

      <!-- Registered Vehicles -->
      <DashboardWidgetsVehiclesCard :units="userUnits" />

      <!-- Registered Pets -->
      <DashboardWidgetsPetsCard :units="userUnits" />

      <!-- Announcements -->
      <InsightsAnnouncements />

      <!-- Newsletter -->
      <InsightsNewsletter />
    </div>

    <!-- Board of Directors -->
    <InsightsBoard />

    <!-- Help Section -->
    <DashboardWidgetsHelpCard />
  </div>
</template>
