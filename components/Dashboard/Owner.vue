<script setup lang="ts">
import type { DirectusUser } from '~/types/directus';

const props = defineProps<{
  user: DirectusUser;
}>();

const { linkedPerson, isBoardMember } = useRoles();

// Get board member info for current year
function getBoardMemberByYear(obj: any, targetYear: string) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = getBoardMemberByYear(obj[i], targetYear);
      if (result) {
        return result;
      }
    }
    return null;
  } else if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (key === 'board_member' && Array.isArray(obj[key]) && obj[key].length > 0) {
        const matchingMember = obj[key].find((member: any) => member.year === targetYear);
        return matchingMember || null;
      } else {
        const result = getBoardMemberByYear(obj[key], targetYear);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }
  return null;
}

const currentYear = new Date().getFullYear().toString();
const boardMember = getBoardMemberByYear(props.user, currentYear);

// Filter tenants from user units
function filterTenants(obj: any): any[] {
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => filterTenants(item));
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.people_id && obj.people_id.category === 'Tenant') {
      return [obj.people_id];
    } else {
      return Object.values(obj).flatMap((value) => filterTenants(value));
    }
  }
  return [];
}

const extUser = props.user as any;
const tenants = computed(() => filterTenants(extUser?.units || []));
const userUnits = computed(() => extUser?.units || []);

// Quick stats
const totalUnits = computed(() => userUnits.value.length);
const totalTenants = computed(() => tenants.value.length);
const totalVehicles = computed(() => {
  return userUnits.value.reduce((acc: number, unit: any) => {
    return acc + (unit.units_id?.vehicles?.length || 0);
  }, 0);
});
const totalPets = computed(() => {
  return userUnits.value.reduce((acc: number, unit: any) => {
    return acc + (unit.units_id?.pets?.length || 0);
  }, 0);
});
</script>

<template>
  <div class="grid grid-flow-row-dense grid-cols-2 gap-x-4 gap-y-12 lg:gap-y-20 lg:gap-x-10 dashboard">
    <div class="col-span-2 mt-8">
      <h2 class="text-3xl">
        {{ greetUser() }}
        <span class="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 font-bold">
          {{ user.first_name }}.
        </span>
      </h2>
      <p class="text-sm opacity-75 mt-2 uppercase tracking-wide">Owner Dashboard</p>
    </div>

    <!-- Board Member Status (if applicable) -->
    <InsightsBoardMember
      v-if="boardMember"
      :board-member="boardMember"
      class="col-span-2 lg:col-span-1"
    />

    <!-- Quick Stats -->
    <div class="col-span-2 lg:col-span-1 insight">
      <h1 class="insight__label mb-4">Property Overview</h1>
      <div class="grid grid-cols-2 gap-4">
        <div class="stat-card p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg text-center">
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">{{ totalUnits }}</p>
          <p class="text-xs uppercase tracking-wide opacity-75">Units</p>
        </div>
        <div class="stat-card p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg text-center">
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ totalTenants }}</p>
          <p class="text-xs uppercase tracking-wide opacity-75">Tenants</p>
        </div>
        <div class="stat-card p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg text-center">
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ totalVehicles }}</p>
          <p class="text-xs uppercase tracking-wide opacity-75">Vehicles</p>
        </div>
        <div class="stat-card p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg text-center">
          <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">{{ totalPets }}</p>
          <p class="text-xs uppercase tracking-wide opacity-75">Pets</p>
        </div>
      </div>
      <div class="mt-6 flex flex-wrap gap-2">
        <nuxt-link to="/units" class="insight__link text-sm">
          Manage Units
          <UIcon name="i-heroicons-arrow-right" />
        </nuxt-link>
      </div>
    </div>

    <!-- Units Summary -->
    <InsightsPerson :user="user" class="col-span-2 lg:col-span-1" />

    <!-- Reserves -->
    <InsightsReserves class="col-span-2 lg:col-span-1" />

    <!-- Board Meetings -->
    <InsightsMeetings class="col-span-2 lg:col-span-1" />

    <!-- Announcements -->
    <InsightsAnnouncements class="col-span-2 lg:col-span-1" />

    <!-- Newsletter -->
    <InsightsNewsletter class="col-span-2 lg:col-span-1" />

    <!-- Quick Actions -->
    <div class="col-span-2 insight">
      <h1 class="insight__label mb-4">Quick Actions</h1>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <nuxt-link
          to="/documents"
          class="action-card p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
        >
          <UIcon name="i-heroicons-document-text" class="text-2xl mb-2 opacity-75" />
          <p class="text-sm font-bold uppercase tracking-wide">Documents</p>
        </nuxt-link>
        <nuxt-link
          to="/meetings"
          class="action-card p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
        >
          <UIcon name="i-heroicons-calendar" class="text-2xl mb-2 opacity-75" />
          <p class="text-sm font-bold uppercase tracking-wide">Meetings</p>
        </nuxt-link>
        <nuxt-link
          to="/requests"
          class="action-card p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
        >
          <UIcon name="i-heroicons-clipboard-document-list" class="text-2xl mb-2 opacity-75" />
          <p class="text-sm font-bold uppercase tracking-wide">Requests</p>
        </nuxt-link>
        <nuxt-link
          to="/projects"
          class="action-card p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
        >
          <UIcon name="i-heroicons-rectangle-stack" class="text-2xl mb-2 opacity-75" />
          <p class="text-sm font-bold uppercase tracking-wide">Projects</p>
        </nuxt-link>
      </div>
    </div>

    <!-- Board of Directors -->
    <InsightsBoard class="col-span-2" />

    <!-- Full Units Summary -->
    <InsightsUnits class="col-span-2" />
  </div>
</template>

<style scoped>
.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
