<template>
  <g
    :class="['event-node', { 'is-selected': isSelected, 'is-hovered': isHovered }]"
    :transform="`translate(${x}, ${y})`"
    style="cursor: pointer"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="$emit('select', event.id)"
  >
    <!-- Glow effect on hover/select -->
    <circle
      v-if="isHovered || isSelected"
      :r="nodeRadius + 4"
      :fill="projectColor"
      opacity="0.2"
      class="glow-ring"
    />

    <!-- Main node -->
    <circle
      :r="nodeRadius"
      :fill="isSelected ? projectColor : '#1A1916'"
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
      :fill="isHovered || isSelected ? '#E8E4DC' : '#8A8680'"
      font-size="11"
      font-weight="500"
      font-family="system-ui, sans-serif"
    >
      {{ truncatedTitle }}
    </text>

    <text
      :y="nodeRadius + 38"
      text-anchor="middle"
      fill="#5A5650"
      font-size="10"
      font-family="system-ui, sans-serif"
    >
      {{ formattedDate }}
    </text>

    <!-- Engagement indicators -->
    <text
      v-if="hasEngagement"
      :y="nodeRadius + 52"
      text-anchor="middle"
      fill="#5A5650"
      font-size="9"
      font-family="system-ui, sans-serif"
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
.event-node {
  transition: transform 0.2s ease;
}
.event-node:hover {
  transform: scale(1.05);
}
.glow-ring {
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
