<template>
  <div class="space-y-2">
    <ProjectTimelineTimelineTaskItem
      v-for="task in sortedTasks"
      :key="task.id"
      :task="task"
      @toggle="handleToggle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectTaskWithRelations } from '~/types/projects';

interface Props {
  tasks: ProjectTaskWithRelations[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  toggle: [taskId: string, completed: boolean];
}>();

// Sort: incomplete first, then by sort order, then by priority
const sortedTasks = computed(() =>
  [...props.tasks].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Then by sort order if available
    if (a.sort !== null && b.sort !== null) {
      return a.sort - b.sort;
    }

    // Then by priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = a.priority ? priorityOrder[a.priority] : 3;
    const bPriority = b.priority ? priorityOrder[b.priority] : 3;
    return aPriority - bPriority;
  })
);

const handleToggle = (taskId: string, completed: boolean) => {
  emit('toggle', taskId, completed);
};
</script>
