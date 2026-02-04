<script setup lang="ts">
const { user } = useDirectusAuth()

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
})

useSeoMeta({
  title: 'Dashboard - 1033 Lenox',
})
</script>

<template>
  <div class="container mx-auto min-h-svh p-6">
    <Dashboard v-if="user" :user="user" />
    <div v-else class="min-h-[50vh] flex items-center justify-center">
      <p class="text-sm tracking-wide uppercase text-muted-foreground">Loading...</p>
    </div>
  </div>
</template>
