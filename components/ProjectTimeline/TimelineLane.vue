<template>
  <g>
    <!-- Main project line (solid portion) -->
    <line
      :x1="projectStartX"
      :y1="laneY"
      :x2="solidLineEndX"
      :y2="laneY"
      :stroke="project.color"
      stroke-width="3"
      stroke-linecap="round"
    />

    <!-- Dotted line to target end date (for active projects) -->
    <line
      v-if="showDottedLine"
      :x1="solidLineEndX"
      :y1="laneY"
      :x2="targetEndX"
      :y2="laneY"
      :stroke="project.color"
      stroke-width="2"
      stroke-dasharray="6 4"
      opacity="0.5"
    />

    <!-- Start marker (small solid dot) -->
    <circle
      :cx="projectStartX"
      :cy="laneY"
      r="5"
      :fill="project.color"
    />

    <!-- Start label -->
    <text
      :x="projectStartX"
      :y="laneY + 50"
      fill="#6A6A6A"
      font-size="9"
      text-anchor="middle"
      font-family="system-ui, sans-serif"
    >
      Start
    </text>

    <!-- Today marker with pulse (for active projects) -->
    <g v-if="isActive && !project.actual_end_date">
      <circle
        :cx="todayX"
        :cy="laneY"
        r="6"
        :fill="project.color"
        class="pulse-dot"
      />
      <circle
        :cx="todayX"
        :cy="laneY"
        r="3"
        fill="white"
      />
    </g>

    <!-- End marker for completed/paused projects -->
    <template v-if="project.actual_end_date || project.status === 'paused'">
      <circle
        :cx="endMarkerX"
        :cy="laneY"
        r="6"
        :fill="project.color"
      />
      <circle
        :cx="endMarkerX"
        :cy="laneY"
        r="3"
        fill="white"
      />
      <!-- End status label -->
      <text
        :x="endMarkerX"
        :y="laneY + 50"
        fill="#6A6A6A"
        font-size="9"
        text-anchor="middle"
        font-family="system-ui, sans-serif"
      >
        {{ endStatusLabel }}
      </text>
    </template>

    <!-- Target end marker (hollow dot) for active projects with target -->
    <template v-if="showDottedLine && project.target_end_date">
      <circle
        :cx="targetEndX"
        :cy="laneY"
        r="5"
        fill="none"
        :stroke="project.color"
        stroke-width="2"
        opacity="0.5"
      />
      <text
        :x="targetEndX"
        :y="laneY + 50"
        fill="#9A9A9A"
        font-size="9"
        text-anchor="middle"
        font-family="system-ui, sans-serif"
      >
        Target
      </text>
    </template>

    <!-- Project label (centered above timeline) -->
    <text
      :x="projectCenterX"
      :y="laneY - 25"
      :fill="project.color"
      font-size="13"
      font-weight="600"
      text-anchor="middle"
      font-family="system-ui, sans-serif"
    >
      {{ project.name }}
    </text>

    <!-- Sub-project indicator -->
    <text
      v-if="isSubProject"
      :x="projectCenterX - (project.name.length * 4) - 12"
      :y="laneY - 25"
      fill="#8A8A8A"
      font-size="10"
      font-family="system-ui, sans-serif"
    >
      └
    </text>

    <!-- Event nodes -->
    <TimelineEventNode
      v-for="event in sortedEvents"
      :key="event.id"
      :event="event"
      :x="getXPosition(event.event_date)"
      :y="laneY"
      :project-color="project.color"
      :is-selected="selectedEventId === event.id"
      @select="$emit('select-event', $event)"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectWithRelations, ProjectEventWithRelations } from '~/types/projects';
import TimelineEventNode from './TimelineEventNode.vue';

interface Props {
  project: ProjectWithRelations;
  laneY: number;
  dateRange: { start: Date; end: Date };
  canvasWidth: number;
  selectedEventId: string | null;
  getXPosition: (date: string) => number;
  todayX: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'select-event': [id: string];
}>();

const isActive = computed(() => props.project.status === 'active');
const isPaused = computed(() => props.project.status === 'paused');
const isCompleted = computed(() => props.project.status === 'completed');
const isSubProject = computed(() => !!props.project.parent_id);

const sortedEvents = computed(() =>
  [...((props.project.events || []) as ProjectEventWithRelations[])].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )
);

// Project start position
const projectStartX = computed(() => props.getXPosition(props.project.start_date));

// Last event position
const lastEventX = computed(() => {
  if (!sortedEvents.value.length) return projectStartX.value;
  return props.getXPosition(sortedEvents.value[sortedEvents.value.length - 1].event_date);
});

// Target end position
const targetEndX = computed(() => {
  if (props.project.target_end_date) {
    return props.getXPosition(props.project.target_end_date);
  }
  return Math.max(props.todayX + 100, lastEventX.value + 100);
});

// End marker position (for completed/paused)
const endMarkerX = computed(() => {
  if (props.project.actual_end_date) {
    return props.getXPosition(props.project.actual_end_date);
  }
  // For paused without actual_end_date, use today
  return props.todayX;
});

// Solid line end position
const solidLineEndX = computed(() => {
  if (props.project.actual_end_date) {
    return props.getXPosition(props.project.actual_end_date);
  }
  if (isPaused.value) {
    return props.todayX;
  }
  // For active projects, solid line goes to today
  return props.todayX;
});

// Show dotted line for active projects with a target end date
const showDottedLine = computed(() => {
  return isActive.value && !props.project.actual_end_date && props.project.target_end_date;
});

// Center position for project name
const projectCenterX = computed(() => {
  const startX = projectStartX.value;
  const endX = props.project.actual_end_date
    ? props.getXPosition(props.project.actual_end_date)
    : props.project.target_end_date
      ? targetEndX.value
      : props.todayX;
  return (startX + endX) / 2;
});

// End status label
const endStatusLabel = computed(() => {
  if (isCompleted.value) return 'Completed';
  if (isPaused.value) return 'Paused';
  return '';
});
</script>

<style scoped>
.pulse-dot {
  animation: pulse-scale 2s ease-in-out infinite;
}

@keyframes pulse-scale {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
