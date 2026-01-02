<template>
  <div>
    <ProjectTimelineProjectTimeline :initial-focus="projectId" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const projectId = computed(() => route.params.id as string);

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

// Dynamic SEO meta
const { projects } = useProjectTimeline();
const project = computed(() => projects.value.find((p) => p.id === projectId.value));

useSeoMeta({
  title: () => (project.value ? `${project.value.name} | 1033 Lenox` : 'Project | 1033 Lenox'),
  description: () => project.value?.description || 'Project timeline and management',
});
</script>
