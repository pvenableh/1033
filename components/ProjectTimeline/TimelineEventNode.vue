<template>
  <g
    :transform="`translate(${x}, ${y})`"
    style="cursor: pointer"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="$emit('select', event.id)"
  >
    <!-- Invisible larger hit area to prevent hover jitter -->
    <circle
      :r="nodeRadius + 20"
      fill="transparent"
      class="hit-area"
    />

    <!-- Glow effect on hover/select -->
    <circle
      :r="isHovered || isSelected ? nodeRadius + 6 : nodeRadius + 4"
      :fill="projectColor"
      class="glow-ring"
      :opacity="isHovered || isSelected ? 0.3 : 0"
    />

    <!-- Main node (solid) -->
    <circle
      :r="nodeRadius"
      :fill="projectColor"
      :stroke="projectColor"
      stroke-width="3"
    />

    <!-- Milestone indicator (inner dot) -->
    <circle
      v-if="event.is_milestone"
      :r="nodeRadius * 0.4"
      :fill="projectColor"
    />

    <!-- Task badge -->
    <g
      v-if="incompleteTasks > 0"
      :transform="`translate(${nodeRadius - 4}, ${-nodeRadius})`"
    >
      <circle
        r="10"
        :fill="categoryColors.bg"
        :stroke="categoryColors.text"
        stroke-width="1"
      />
      <text
        y="4"
        text-anchor="middle"
        :fill="categoryColors.text"
        font-size="10"
        font-weight="600"
        font-family="system-ui, sans-serif"
      >
        {{ incompleteTasks > 9 ? '9+' : incompleteTasks }}
      </text>
    </g>

    <!-- Labels below node -->
    <text
      :y="nodeRadius + 24"
      text-anchor="middle"
      :fill="isHovered || isSelected ? '#1A1916' : '#4A4A4A'"
      font-size="11"
      font-weight="500"
      font-family="system-ui, sans-serif"
      class="event-label"
    >
      {{ truncatedTitle }}
    </text>

    <text
      :y="nodeRadius + 38"
      text-anchor="middle"
      fill="#6A6A6A"
      font-size="10"
      font-family="system-ui, sans-serif"
      class="event-label"
    >
      {{ formattedDate }}
    </text>

    <!-- Engagement indicators -->
    <text
      v-if="hasEngagement"
      :y="nodeRadius + 52"
      text-anchor="middle"
      fill="#6A6A6A"
      font-size="9"
      font-family="system-ui, sans-serif"
      class="event-label"
    >
      {{ engagementText }}
    </text>
  </g>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ProjectEventWithRelations } from '~/types/projects';

interface Props {
  event: ProjectEventWithRelations;
  x: number;
  y: number;
  projectColor: string;
  isSelected: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  select: [id: string];
}>();

const isHovered = ref(false);

const nodeRadius = computed(() => (props.event.is_milestone ? 18 : 14));

const incompleteTasks = computed(
  () => props.event.tasks?.filter((t) => !t.completed).length || 0
);

const truncatedTitle = computed(() => {
  const title = props.event.title;
  return title.length > 18 ? title.slice(0, 16) + '…' : title;
});

const formattedDate = computed(() =>
  new Date(props.event.event_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
);

const categoryColors = computed(() => {
  const cat = props.event.category_id;
  if (cat && typeof cat === 'object') {
    return { bg: cat.color, text: cat.text_color };
  }
  return { bg: '#2D2A24', text: '#C4A052' };
});

const hasEngagement = computed(
  () => (props.event.comment_count || 0) > 0 || (props.event.reaction_count || 0) > 0
);

const engagementText = computed(() => {
  const parts = [];
  if (props.event.comment_count) parts.push(`💬${props.event.comment_count}`);
  if (props.event.reaction_count) parts.push(`❤️${props.event.reaction_count}`);
  return parts.join(' ');
});
</script>

<style scoped>
.hit-area {
  pointer-events: all;
}
.glow-ring {
  transition: opacity 0.2s ease, r 0.2s ease;
}
.event-label {
  transition: fill 0.2s ease;
  pointer-events: none;
}
</style>
