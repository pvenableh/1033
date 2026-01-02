<template>
  <div class="flex flex-wrap items-center gap-3">
    <button
      v-for="project in projects"
      :key="project.id"
      class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all"
      :class="[
        focusedId === project.id
          ? 'bg-gray-900 text-white'
          : focusedId === null
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600',
      ]"
      @click="handleClick(project.id)"
    >
      <span
        class="w-2.5 h-2.5 rounded-full"
        :style="{ backgroundColor: project.color }"
      />
      <span class="font-medium">{{ project.name }}</span>
      <span class="text-xs opacity-70">({{ project.events?.length || 0 }})</span>
    </button>

    <!-- Clear filter button -->
    <button
      v-if="focusedId"
      class="text-xs text-gray-500 hover:text-gray-700 underline"
      @click="$emit('focus', null)"
    >
      Show all
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ProjectWithRelations } from '~/types/projects';

interface Props {
  projects: ProjectWithRelations[];
  focusedId: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  focus: [id: string | null];
}>();

const handleClick = (projectId: string) => {
  // Toggle: if already focused, clear focus
  if (props.focusedId === projectId) {
    emit('focus', null);
  } else {
    emit('focus', projectId);
  }
};
</script>
