<template>
  <g>
    <!-- Main project line -->
    <line
      :x1="lineStartX"
      :y1="laneY"
      :x2="lineEndX"
      :y2="laneY"
      :stroke="project.color"
      stroke-width="3"
      stroke-linecap="round"
    />

    <!-- Terminus: Arrow for ongoing, dot for completed -->
    <template v-if="isOngoing">
      <!-- Arrow head pointing forward -->
      <polygon
        :points="arrowPoints"
        :fill="project.color"
      />
    </template>
    <template v-else>
      <!-- Completed terminus dot -->
      <circle
        :cx="lineEndX"
        :cy="laneY"
        r="6"
        :fill="project.color"
      />
      <circle
        :cx="lineEndX"
        :cy="laneY"
        r="3"
        fill="#1A1916"
      />
    </template>

    <!-- Project label -->
    <text
      :x="lineStartX"
      :y="laneY - 20"
      :fill="project.color"
      font-size="12"
      font-weight="500"
      font-family="system-ui, sans-serif"
    >
      {{ project.name }}
    </text>

    <!-- Sub-project indicator -->
    <text
      v-if="isSubProject"
      :x="lineStartX - 12"
      :y="laneY - 20"
      fill="#8A8680"
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

const isOngoing = computed(() => !props.project.actual_end_date);

const isSubProject = computed(() => !!props.project.parent_id);

const sortedEvents = computed(() =>
  [...((props.project.events || []) as ProjectEventWithRelations[])].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )
);

const lastEventX = computed(() => {
  if (!sortedEvents.value.length) return 100;
  return props.getXPosition(sortedEvents.value[sortedEvents.value.length - 1].event_date);
});

const lineStartX = computed(() => {
  // Start from project start date or first event
  const projectStartX = props.getXPosition(props.project.start_date);

  if (!sortedEvents.value.length) return projectStartX;

  const firstEventX = props.getXPosition(sortedEvents.value[0].event_date);
  return Math.min(projectStartX, firstEventX - 30);
});

const lineEndX = computed(() => {
  if (isOngoing.value) {
    // Extend to today + some padding
    return Math.max(props.todayX + 60, lastEventX.value + 60);
  }
  return props.getXPosition(props.project.actual_end_date!);
});

const arrowPoints = computed(() => {
  const x = lineEndX.value;
  const y = props.laneY;
  return `${x},${y} ${x - 10},${y - 6} ${x - 10},${y + 6}`;
});
</script>
