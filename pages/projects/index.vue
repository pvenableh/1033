<template>
  <div>
    <ProjectTimelineProjectTimeline />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useSeoMeta({
  title: 'Projects | 1033 Lenox',
  description: 'Project timeline and management',
});
</script>
