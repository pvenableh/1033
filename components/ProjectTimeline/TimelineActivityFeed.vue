<template>
  <div>
    <div
      v-if="loading"
      class="flex justify-center py-4"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-5 h-5 animate-spin text-gray-400"
      />
    </div>

    <div
      v-else-if="activities.length === 0"
      class="text-sm text-gray-400 text-center py-4"
    >
      No recent activity
    </div>

    <div
      v-else
      class="space-y-3 max-h-48 overflow-y-auto"
    >
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-3"
      >
        <UAvatar
          :src="getAvatarUrl(activity.user)"
          :alt="activity.user?.first_name || 'User'"
          size="xs"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-900">
            <span class="font-medium">{{ activity.user?.first_name }}</span>
            {{ activity.action }}
            <span class="text-gray-500">{{ activity.targetTitle }}</span>
          </p>
          <p class="text-xs text-gray-400">{{ timeAgo(activity.date) }}</p>
        </div>
        <UIcon
          :name="activity.icon"
          class="w-4 h-4 text-gray-400 flex-shrink-0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DirectusUser } from '~/types/directus';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const { activities, loading } = useProjectActivity(computed(() => props.projectId));
const { getImageUrl } = useDirectusFiles();
const { timeAgo } = useTimeAgo();

const getAvatarUrl = (user: DirectusUser | null) => {
  if (user?.avatar) {
    const avatarId = typeof user.avatar === 'string' ? user.avatar : user.avatar?.id;
    if (avatarId) return getImageUrl(avatarId);
  }
  return '/images/default-avatar.png';
};
</script>
