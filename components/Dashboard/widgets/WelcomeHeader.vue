<script setup lang="ts">
defineProps<{
  firstName: string
  dashboardType: 'owner' | 'tenant' | 'member'
}>()

const gradientClass = computed(() => {
  return {
    owner: 'from-purple-400 to-pink-600',
    tenant: 'from-emerald-400 to-teal-600',
    member: 'from-sky-400 to-sky-600',
  }
})

const dashboardLabel = computed(() => {
  return {
    owner: 'Owner Dashboard',
    tenant: 'Tenant Dashboard',
    member: 'Member Dashboard',
  }
})
</script>

<template>
  <div class="mb-8">
    <h2 class="text-3xl font-light">
      {{ greetUser() }}
      <span
        class="bg-clip-text text-transparent bg-gradient-to-r font-bold"
        :class="gradientClass[dashboardType]"
      >
        {{ firstName }}.
      </span>
    </h2>
    <p class="text-sm text-muted-foreground mt-2 uppercase tracking-wide">
      {{ dashboardLabel[dashboardType] }}
    </p>
  </div>
</template>
