<script setup lang="ts">
import type { DirectusUser } from '~/types/directus'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

const props = defineProps<{
  user: DirectusUser
}>()

const { linkedPerson, isBoardMember } = useRoles()

// Get board member info for current year
function getBoardMemberByYear(obj: any, targetYear: string) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = getBoardMemberByYear(obj[i], targetYear)
      if (result) {
        return result
      }
    }
    return null
  } else if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (key === 'board_member' && Array.isArray(obj[key]) && obj[key].length > 0) {
        const matchingMember = obj[key].find((member: any) => member.year === targetYear)
        return matchingMember || null
      } else {
        const result = getBoardMemberByYear(obj[key], targetYear)
        if (result) {
          return result
        }
      }
    }
    return null
  }
  return null
}

const currentYear = new Date().getFullYear().toString()
const boardMember = getBoardMemberByYear(props.user, currentYear)

// Filter tenants from user units
function filterTenants(obj: any): any[] {
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => filterTenants(item))
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.people_id && obj.people_id.category === 'Tenant') {
      return [obj.people_id]
    } else {
      return Object.values(obj).flatMap((value) => filterTenants(value))
    }
  }
  return []
}

const extUser = props.user as any
const tenants = computed(() => filterTenants(extUser?.units || []))
const userUnits = computed(() => extUser?.units || [])

// Quick stats
const totalUnits = computed(() => userUnits.value.length)
const totalTenants = computed(() => tenants.value.length)
const totalVehicles = computed(() => {
  return userUnits.value.reduce((acc: number, unit: any) => {
    return acc + (unit.units_id?.vehicles?.length || 0)
  }, 0)
})
const totalPets = computed(() => {
  return userUnits.value.reduce((acc: number, unit: any) => {
    return acc + (unit.units_id?.pets?.length || 0)
  }, 0)
})

// Quick actions for owner dashboard
const quickActions = [
  { label: 'Documents', to: '/documents', icon: 'heroicons:document-text' },
  { label: 'Meetings', to: '/meetings', icon: 'heroicons:calendar' },
  { label: 'Requests', to: '/requests', icon: 'heroicons:clipboard-document-list' },
  { label: 'Projects', to: '/projects', icon: 'heroicons:rectangle-stack' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <DashboardWidgetsWelcomeHeader
      :first-name="user.first_name || ''"
      dashboard-type="owner"
    />

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <DashboardWidgetsStatCard
        title="Units"
        :value="totalUnits"
        icon="heroicons:home"
        description="Properties owned"
      />
      <DashboardWidgetsStatCard
        title="Tenants"
        :value="totalTenants"
        icon="heroicons:users"
        description="Active tenants"
      />
      <DashboardWidgetsStatCard
        title="Vehicles"
        :value="totalVehicles"
        icon="heroicons:truck"
        description="Registered vehicles"
      />
      <DashboardWidgetsStatCard
        title="Pets"
        :value="totalPets"
        icon="heroicons:heart"
        description="Registered pets"
      />
    </div>

    <!-- Board Member Status (if applicable) -->
    <InsightsBoardMember
      v-if="boardMember"
      :board-member="boardMember"
    />

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Units Summary -->
      <InsightsPerson :user="user" />

      <!-- Reserves -->
      <InsightsReserves />

      <!-- Board Meetings -->
      <InsightsMeetings />

      <!-- Announcements -->
      <InsightsAnnouncements />

      <!-- Newsletter -->
      <InsightsNewsletter />
    </div>

    <!-- Quick Actions -->
    <DashboardWidgetsQuickActionsCard :actions="quickActions" />

    <!-- Board of Directors -->
    <InsightsBoard />

    <!-- Full Units Summary -->
    <InsightsUnits />

    <!-- Manage Units Link -->
    <div class="flex justify-center">
      <nuxt-link
        to="/units"
        class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Manage All Units
        <Icon name="heroicons:arrow-right" class="h-4 w-4" />
      </nuxt-link>
    </div>
  </div>
</template>
