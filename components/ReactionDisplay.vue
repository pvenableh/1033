<script setup lang="ts">
import type { ReactionSummary, ReactionTypeRecord } from '~/types/reactions';
import { getReactionIcon } from '~/types/reactions';

interface Props {
  collection: string;
  itemId: string | number;
  ownerUserId?: string;
  itemContext?: Record<string, any>;
  showPicker?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPicker: true,
  compact: false,
});

const { user } = useDirectusAuth();
const {
  getReactionSummary,
  getReactionTypes,
  toggleReaction,
  subscribeToReactions,
} = useReactions();

// Helper to get icon name for a reaction type
const getIconName = (reactionType: ReactionTypeRecord): string => {
  return getReactionIcon(reactionType);
};

// Check if reaction type uses icon instead of emoji
const usesIcon = (reactionType: ReactionTypeRecord): boolean => {
  return !!reactionType.icon && !!reactionType.icon_family;
};

const summary = ref<ReactionSummary | null>(null);
const reactionTypes = ref<ReactionTypeRecord[]>([]);
const loading = ref(true);
const showPickerMenu = ref(false);

// Store subscription cleanup function
let unsubscribe: (() => void) | null = null;

// Fetch reactions and types
const fetchData = async () => {
  loading.value = true;
  try {
    const [reactionSummary, types] = await Promise.all([
      getReactionSummary(props.collection as any, String(props.itemId)),
      getReactionTypes(),
    ]);
    summary.value = reactionSummary;
    reactionTypes.value = types;
  } catch (error) {
    console.error('Failed to fetch reactions:', error);
  } finally {
    loading.value = false;
  }
};

// Setup real-time subscription
const setupSubscription = () => {
  // Cleanup previous subscription
  if (unsubscribe) {
    unsubscribe();
  }

  // Subscribe to reaction changes for this item
  const subscription = subscribeToReactions(
    props.collection as any,
    [String(props.itemId)],
    async (event) => {
      // Refresh the summary when reactions change
      const reactionSummary = await getReactionSummary(props.collection as any, String(props.itemId));
      summary.value = reactionSummary;
    }
  );

  unsubscribe = subscription.unsubscribe;
};

// Handle reaction toggle
const handleReaction = async (reactionTypeId: number) => {
  if (!user.value) return;

  try {
    await toggleReaction(
      {
        collection: props.collection as any,
        item_id: String(props.itemId),
        reaction_type: reactionTypeId,
      },
      {
        notifyOwner: true,
        ownerUserId: props.ownerUserId,
      }
    );
    // Real-time subscription will handle the update, but also do optimistic update
    const reactionSummary = await getReactionSummary(props.collection as any, String(props.itemId));
    summary.value = reactionSummary;
    showPickerMenu.value = false;
  } catch (error) {
    console.error('Failed to toggle reaction:', error);
  }
};

// Format users tooltip
const getUsersTooltip = (users: any[]): string => {
  if (!users || users.length === 0) return '';
  const names = users.map((u) => `${u.first_name || ''} ${u.last_name || ''}`.trim());
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} others`;
};

onMounted(() => {
  fetchData();
  setupSubscription();
});

// Cleanup subscription on unmount
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

// Watch for prop changes
watch([() => props.collection, () => props.itemId], () => {
  fetchData();
  setupSubscription();
});
</script>

<template>
  <div class="flex items-center gap-1 flex-wrap" :class="{ 'text-xs': compact }">
    <!-- Loading state -->
    <template v-if="loading">
      <div class="w-4 h-4 bg-muted rounded animate-pulse"></div>
    </template>

    <template v-else>
      <!-- Existing reactions -->
      <button
        v-for="reactionCount in summary?.reactions || []"
        :key="reactionCount.reaction_type.id"
        @click="handleReaction(reactionCount.reaction_type.id)"
        :title="getUsersTooltip(reactionCount.users)"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors"
        :class="[
          reactionCount.hasReacted
            ? 'bg-primary/20 text-primary hover:bg-primary/30'
            : 'bg-muted hover:bg-muted/80 t-text-secondary',
        ]"
      >
        <Icon
          v-if="usesIcon(reactionCount.reaction_type)"
          :name="getIconName(reactionCount.reaction_type)"
          class="w-4 h-4"
        />
        <span v-else>{{ reactionCount.reaction_type.emoji || reactionCount.reaction_type.name }}</span>
        <span class="font-medium">{{ reactionCount.count }}</span>
      </button>

      <!-- Add reaction button with picker -->
      <div v-if="showPicker && user" class="relative">
        <button
          @click="showPickerMenu = !showPickerMenu"
          class="inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted transition-colors t-text-muted hover:t-text"
          :class="{ 'w-5 h-5': compact }"
        >
          <Icon name="i-heroicons-face-smile" class="w-4 h-4" :class="{ 'w-3 h-3': compact }" />
        </button>

        <!-- Reaction picker dropdown -->
        <div
          v-if="showPickerMenu"
          class="absolute z-50 bottom-full left-0 mb-1 bg-background border border-border rounded-lg shadow-lg p-1.5 flex gap-1"
        >
          <button
            v-for="type in reactionTypes"
            :key="type.id"
            @click="handleReaction(type.id)"
            :title="type.name"
            class="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-base"
          >
            <Icon
              v-if="usesIcon(type)"
              :name="getIconName(type)"
              class="w-5 h-5"
            />
            <span v-else>{{ type.emoji || type.name.charAt(0) }}</span>
          </button>
        </div>

        <!-- Click outside to close -->
        <div
          v-if="showPickerMenu"
          @click="showPickerMenu = false"
          class="fixed inset-0 z-40"
        ></div>
      </div>
    </template>
  </div>
</template>
