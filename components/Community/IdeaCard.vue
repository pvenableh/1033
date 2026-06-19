<script setup lang="ts">
import type { Idea } from '~/composables/useIdeas';

const props = defineProps<{ idea: Idea; showStatus?: boolean }>();

const { getImageUrl } = useDirectusFiles();

const statusLabel: Record<string, string> = {
  pending: 'Pending review',
  published: 'Published',
  rejected: 'Not approved',
  archived: 'Archived',
};
const statusClass: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  published: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const imageIds = computed(() =>
  (props.idea.images || [])
    .map((img) => (typeof img.directus_files_id === 'string' ? img.directus_files_id : img.directus_files_id?.id))
    .filter(Boolean) as string[]
);

const formattedDate = computed(() => {
  if (!props.idea.date_created) return '';
  return new Date(props.idea.date_created).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

const initials = computed(() => {
  const n = props.idea.name?.trim();
  if (!n) return '🏠';
  return n
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
});
</script>

<template>
  <Card class="w-full break-inside-avoid overflow-hidden">
    <CardHeader class="pb-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
          {{ initials }}
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium truncate">{{ idea.name || 'Resident' }}</span>
            <Icon
              v-if="idea.verified_resident"
              name="lucide:badge-check"
              class="w-3.5 h-3.5 text-emerald-600 shrink-0"
              title="Verified resident" />
          </div>
          <div class="text-xs text-muted-foreground">
            <span v-if="idea.unit_number">Unit {{ idea.unit_number }}</span>
            <span v-if="idea.unit_number && formattedDate"> · </span>
            <span>{{ formattedDate }}</span>
          </div>
        </div>
        <span
          v-if="showStatus"
          class="ml-auto shrink-0 text-xs px-2 py-0.5 rounded-full"
          :class="statusClass[idea.status]">
          {{ statusLabel[idea.status] || idea.status }}
        </span>
        <Badge v-if="idea.category" :class="showStatus ? 'shrink-0' : 'ml-auto shrink-0'" variant="outline">
          {{ idea.category }}
        </Badge>
      </div>
    </CardHeader>

    <!-- Images -->
    <div v-if="imageIds.length" class="px-6 pb-3">
      <div
        class="grid gap-1.5 rounded-lg overflow-hidden"
        :class="imageIds.length === 1 ? 'grid-cols-1' : 'grid-cols-2'">
        <img
          v-for="(id, i) in imageIds.slice(0, 4)"
          :key="id"
          :src="getImageUrl(id, { width: 600, quality: 75, fit: 'cover' })"
          :alt="idea.title"
          loading="lazy"
          class="w-full h-40 object-cover rounded-md" />
      </div>
    </div>

    <CardContent class="space-y-1.5">
      <h3 class="font-semibold leading-snug">{{ idea.title }}</h3>
      <p class="text-sm text-muted-foreground whitespace-pre-line">{{ idea.description }}</p>
    </CardContent>
  </Card>
</template>
