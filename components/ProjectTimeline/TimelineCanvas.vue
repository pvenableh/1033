<template>
  <svg
    :width="canvasWidth"
    :height="canvasHeight"
    class="block"
  >
    <!-- Background grid pattern -->
    <defs>
      <pattern
        id="timeline-grid"
        :width="gridSpacing"
        :height="laneHeight"
        patternUnits="userSpaceOnUse"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          :y2="laneHeight"
          stroke="rgb(45 42 36 / 0.3)"
          stroke-width="1"
        />
      </pattern>
    </defs>
    <rect
      width="100%"
      height="100%"
      fill="url(#timeline-grid)"
    />

    <!-- Lane separators -->
    <line
      v-for="i in totalLanes"
      :key="`lane-${i}`"
      x1="0"
      :y1="i * laneHeight + headerHeight"
      :x2="canvasWidth"
      :y2="i * laneHeight + headerHeight"
      stroke="rgb(45 42 36 / 0.3)"
      stroke-width="1"
    />

    <!-- Time axis labels -->
    <g class="time-axis">
      <text
        v-for="(label, i) in timeLabels"
        :key="`time-${i}`"
        :x="label.x"
        :y="30"
        fill="#8A8680"
        font-size="11"
        text-anchor="middle"
        font-family="system-ui, sans-serif"
      >
        {{ label.text }}
      </text>
    </g>

    <!-- Today marker line -->
    <g v-if="showTodayMarker">
      <line
        :x1="todayX"
        :y1="headerHeight"
        :x2="todayX"
        :y2="canvasHeight - 20"
        stroke="#C4A052"
        stroke-width="2"
        stroke-dasharray="4 2"
        opacity="0.6"
      />
      <text
        :x="todayX"
        :y="headerHeight - 8"
        fill="#C4A052"
        font-size="10"
        text-anchor="middle"
        font-weight="500"
        font-family="system-ui, sans-serif"
      >
        TODAY
      </text>
    </g>

    <!-- Project lanes -->
    <TimelineLane
      v-for="lane in lanes"
      :key="lane.project.id"
      :project="lane.project"
      :lane-y="lane.yPosition"
      :date-range="dateRange"
      :canvas-width="canvasWidth"
      :selected-event-id="selectedEventId"
      :get-x-position="getXPosition"
      :today-x="todayX"
      @select-event="$emit('select-event', $event)"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectWithRelations } from '~/types/projects';

interface Props {
  projects: ProjectWithRelations[];
  zoom: number;
  selectedEventId: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'select-event': [id: string];
}>();

// Layout calculations
const {
  lanes,
  dateRange,
  totalLanes,
  laneHeight,
  headerHeight,
  canvasWidth,
  canvasHeight,
  gridSpacing,
  todayX,
  timeLabels,
  getXPosition,
} = useTimelineLayout(
  computed(() => props.projects),
  computed(() => props.zoom)
);

// Only show today marker if it's within the visible date range
const showTodayMarker = computed(() => {
  const today = Date.now();
  return today >= dateRange.value.start.getTime() && today <= dateRange.value.end.getTime();
});
</script>
