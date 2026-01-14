<template>
  <div class="projects-page min-h-screen">
    <!-- Timeline View -->
    <Timeline />
  </div>
</template>

<script setup lang="ts">
import Timeline from '~/components/ProjectTimeline/Timeline.vue';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

useSeoMeta({
  title: 'Projects | 1033 Lenox',
  description: 'View building projects and timelines',
});
</script>

<style scoped>
.projects-page {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
