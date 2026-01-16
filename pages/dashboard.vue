<script setup lang="ts">
const { user } = useDirectusAuth()

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
})
</script>

<template>
  <div class="relative w-full min-h-screen scroll-smooth">
    <div class="page__content-container">
      <h1 class="page__content-title">Dashboard</h1>
      <Dashboard v-if="user" :user="user" />
      <div v-else class="min-h-[50vh] flex items-center justify-center">
        <p class="text-sm tracking-wide uppercase text-muted-foreground">Loading...</p>
      </div>
    </div>
  </div>
</template>
