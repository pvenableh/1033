/**
 * useReactions - Composable for managing reactions on content
 *
 * Provides functionality for adding, removing, and querying reactions
 * on any supported content type (channel messages, comments, etc.)
 */

import type {
  Reaction,
  ReactionWithUser,
  ReactionCount,
  ReactionSummary,
  ReactionType,
  ReactableCollection,
  CreateReactionPayload,
} from '~/types/reactions';
import { REACTION_TYPES, getReactionMeta } from '~/types/reactions';
import type { User } from '~/types/system/user';

export function useReactions() {
  const reactions = useDirectusItems<Reaction>('reactions');
  const { user } = useDirectusAuth();
  const { sendTo } = useDirectusNotifications();
  const { subscribe } = useDirectusWebSocket();

  // ==================== QUERY OPERATIONS ====================

  /**
   * Get all reactions for a specific item
   */
  const getReactions = async (
    collection: ReactableCollection,
    itemId: string
  ): Promise<ReactionWithUser[]> => {
    return await reactions.list({
      filter: {
        collection: { _eq: collection },
        item_id: { _eq: itemId },
      },
      fields: [
        '*',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_created.avatar',
        'user_created.email',
      ],
      sort: ['date_created'],
    }) as ReactionWithUser[];
  };

  /**
   * Get aggregated reaction summary for an item
   */
  const getReactionSummary = async (
    collection: ReactableCollection,
    itemId: string
  ): Promise<ReactionSummary> => {
    const allReactions = await getReactions(collection, itemId);
    const currentUserId = user.value?.id;

    // Group reactions by type
    const grouped = allReactions.reduce(
      (acc, reaction) => {
        const type = reaction.reaction_type;
        if (!acc[type]) {
          acc[type] = { users: [], hasReacted: false };
        }
        acc[type].users.push(reaction.user_created);
        if (reaction.user_created.id === currentUserId) {
          acc[type].hasReacted = true;
        }
        return acc;
      },
      {} as Record<ReactionType, { users: User[]; hasReacted: boolean }>
    );

    // Convert to ReactionCount array
    const reactionCounts: ReactionCount[] = Object.entries(grouped).map(
      ([type, data]) => ({
        reaction_type: type as ReactionType,
        count: data.users.length,
        users: data.users,
        hasReacted: data.hasReacted,
      })
    );

    // Sort by count (most popular first)
    reactionCounts.sort((a, b) => b.count - a.count);

    return {
      item_id: itemId,
      collection,
      reactions: reactionCounts,
      totalCount: allReactions.length,
    };
  };

  /**
   * Get reactions for multiple items (batch query for efficiency)
   */
  const getReactionsForItems = async (
    collection: ReactableCollection,
    itemIds: string[]
  ): Promise<Map<string, ReactionSummary>> => {
    if (itemIds.length === 0) return new Map();

    const allReactions = await reactions.list({
      filter: {
        collection: { _eq: collection },
        item_id: { _in: itemIds },
      },
      fields: [
        '*',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_created.avatar',
      ],
      sort: ['date_created'],
      limit: -1,
    }) as ReactionWithUser[];

    const currentUserId = user.value?.id;
    const summaryMap = new Map<string, ReactionSummary>();

    // Initialize empty summaries for all requested items
    itemIds.forEach((id) => {
      summaryMap.set(id, {
        item_id: id,
        collection,
        reactions: [],
        totalCount: 0,
      });
    });

    // Group reactions by item and type
    allReactions.forEach((reaction) => {
      const summary = summaryMap.get(reaction.item_id);
      if (!summary) return;

      let reactionCount = summary.reactions.find(
        (r) => r.reaction_type === reaction.reaction_type
      );

      if (!reactionCount) {
        reactionCount = {
          reaction_type: reaction.reaction_type,
          count: 0,
          users: [],
          hasReacted: false,
        };
        summary.reactions.push(reactionCount);
      }

      reactionCount.count++;
      reactionCount.users.push(reaction.user_created);
      if (reaction.user_created.id === currentUserId) {
        reactionCount.hasReacted = true;
      }
      summary.totalCount++;
    });

    // Sort reactions by count for each item
    summaryMap.forEach((summary) => {
      summary.reactions.sort((a, b) => b.count - a.count);
    });

    return summaryMap;
  };

  /**
   * Check if current user has reacted with a specific type
   */
  const hasUserReacted = async (
    collection: ReactableCollection,
    itemId: string,
    reactionType: ReactionType
  ): Promise<boolean> => {
    if (!user.value?.id) return false;

    const existing = await reactions.findFirst({
      filter: {
        collection: { _eq: collection },
        item_id: { _eq: itemId },
        reaction_type: { _eq: reactionType },
        user_created: { _eq: user.value.id },
      },
    });

    return !!existing;
  };

  /**
   * Get user's reaction on an item (if any)
   */
  const getUserReaction = async (
    collection: ReactableCollection,
    itemId: string
  ): Promise<Reaction | null> => {
    if (!user.value?.id) return null;

    return await reactions.findFirst({
      filter: {
        collection: { _eq: collection },
        item_id: { _eq: itemId },
        user_created: { _eq: user.value.id },
      },
    });
  };

  // ==================== MUTATION OPERATIONS ====================

  /**
   * Toggle a reaction on an item (add if not exists, remove if exists)
   * Returns the created reaction or null if removed
   */
  const toggleReaction = async (
    payload: CreateReactionPayload,
    options?: {
      notifyOwner?: boolean;
      ownerUserId?: string;
      itemContext?: { title?: string; channelName?: string };
    }
  ): Promise<{ action: 'added' | 'removed'; reaction?: ReactionWithUser }> => {
    if (!user.value?.id) {
      throw new Error('Must be logged in to react');
    }

    // Check for existing reaction of this type from this user
    const existing = await reactions.findFirst({
      filter: {
        collection: { _eq: payload.collection },
        item_id: { _eq: payload.item_id },
        reaction_type: { _eq: payload.reaction_type },
        user_created: { _eq: user.value.id },
      },
    });

    if (existing) {
      // Remove the reaction
      await reactions.remove(existing.id);
      return { action: 'removed' };
    }

    // Check if user already has a different reaction on this item
    // (Allow multiple different reactions from same user, or uncomment to limit to one)
    // const anyExisting = await getUserReaction(payload.collection, payload.item_id);
    // if (anyExisting) {
    //   await reactions.remove(anyExisting.id);
    // }

    // Create the new reaction
    const created = await reactions.create(
      {
        collection: payload.collection,
        item_id: payload.item_id,
        reaction_type: payload.reaction_type,
      } as Partial<Reaction>,
      {
        fields: [
          '*',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'user_created.avatar',
        ],
      }
    ) as ReactionWithUser;

    // Send notification to content owner (if different from reactor)
    if (
      options?.notifyOwner &&
      options.ownerUserId &&
      options.ownerUserId !== user.value.id
    ) {
      const reactionMeta = getReactionMeta(payload.reaction_type);
      const context = options.itemContext;

      let subject = `${user.value.first_name} ${user.value.last_name} reacted ${reactionMeta.emoji} to your message`;
      let message = `Your content received a ${reactionMeta.label.toLowerCase()} reaction.`;

      if (context?.channelName) {
        subject = `${user.value.first_name} reacted ${reactionMeta.emoji} in #${context.channelName}`;
        message = `${user.value.first_name} ${user.value.last_name} reacted to your message with ${reactionMeta.emoji}`;
      }

      // Don't let notification failure block the reaction
      try {
        await sendTo(options.ownerUserId, subject, message, {
          collection: payload.collection,
          item: payload.item_id,
        });
      } catch (e) {
        console.error('Failed to send reaction notification:', e);
      }
    }

    return { action: 'added', reaction: created };
  };

  /**
   * Add a reaction (creates if not exists)
   */
  const addReaction = async (
    payload: CreateReactionPayload,
    options?: {
      notifyOwner?: boolean;
      ownerUserId?: string;
      itemContext?: { title?: string; channelName?: string };
    }
  ): Promise<ReactionWithUser> => {
    if (!user.value?.id) {
      throw new Error('Must be logged in to react');
    }

    // Check for existing
    const existing = await reactions.findFirst({
      filter: {
        collection: { _eq: payload.collection },
        item_id: { _eq: payload.item_id },
        reaction_type: { _eq: payload.reaction_type },
        user_created: { _eq: user.value.id },
      },
    });

    if (existing) {
      return existing as unknown as ReactionWithUser;
    }

    const created = await reactions.create(
      {
        collection: payload.collection,
        item_id: payload.item_id,
        reaction_type: payload.reaction_type,
      } as Partial<Reaction>,
      {
        fields: [
          '*',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'user_created.avatar',
        ],
      }
    ) as ReactionWithUser;

    // Send notification
    if (
      options?.notifyOwner &&
      options.ownerUserId &&
      options.ownerUserId !== user.value.id
    ) {
      const reactionMeta = getReactionMeta(payload.reaction_type);
      try {
        await sendTo(
          options.ownerUserId,
          `${user.value.first_name} reacted ${reactionMeta.emoji} to your content`,
          `Your content received a ${reactionMeta.label.toLowerCase()} reaction.`,
          {
            collection: payload.collection,
            item: payload.item_id,
          }
        );
      } catch (e) {
        console.error('Failed to send reaction notification:', e);
      }
    }

    return created;
  };

  /**
   * Remove a specific reaction
   */
  const removeReaction = async (
    collection: ReactableCollection,
    itemId: string,
    reactionType: ReactionType
  ): Promise<boolean> => {
    if (!user.value?.id) {
      throw new Error('Must be logged in to remove reaction');
    }

    const existing = await reactions.findFirst({
      filter: {
        collection: { _eq: collection },
        item_id: { _eq: itemId },
        reaction_type: { _eq: reactionType },
        user_created: { _eq: user.value.id },
      },
    });

    if (existing) {
      await reactions.remove(existing.id);
      return true;
    }

    return false;
  };

  /**
   * Remove all reactions from current user on an item
   */
  const removeAllUserReactions = async (
    collection: ReactableCollection,
    itemId: string
  ): Promise<number> => {
    if (!user.value?.id) {
      throw new Error('Must be logged in to remove reactions');
    }

    const userReactions = await reactions.list({
      filter: {
        collection: { _eq: collection },
        item_id: { _eq: itemId },
        user_created: { _eq: user.value.id },
      },
      limit: -1,
    });

    if (userReactions.length > 0) {
      await reactions.remove(userReactions.map((r) => r.id));
    }

    return userReactions.length;
  };

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to reaction updates for specific items
   */
  const subscribeToReactions = (
    collection: ReactableCollection,
    itemIds: string[],
    callback: (event: {
      type: 'create' | 'delete';
      reaction: ReactionWithUser;
    }) => void
  ) => {
    if (itemIds.length === 0) return { unsubscribe: () => {} };

    return subscribe(
      'reactions',
      {
        filter: {
          collection: { _eq: collection },
          item_id: { _in: itemIds },
        },
        fields: [
          '*',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'user_created.avatar',
        ],
      },
      (event, data) => {
        if (event === 'create' || event === 'delete') {
          const reactionData = Array.isArray(data) ? data : [data];
          reactionData.forEach((reaction) => {
            callback({
              type: event,
              reaction: reaction as ReactionWithUser,
            });
          });
        }
      }
    );
  };

  // ==================== REACTIVE HELPERS ====================

  /**
   * Create a reactive reaction summary for an item
   * Auto-updates when reactions change
   */
  function useReactionSummary(
    collection: ReactableCollection,
    itemId: Ref<string> | string
  ) {
    const summary = ref<ReactionSummary>({
      item_id: typeof itemId === 'string' ? itemId : itemId.value,
      collection,
      reactions: [],
      totalCount: 0,
    });
    const loading = ref(true);
    const error = ref<string | null>(null);

    const fetch = async () => {
      try {
        const id = typeof itemId === 'string' ? itemId : itemId.value;
        summary.value = await getReactionSummary(collection, id);
        error.value = null;
      } catch (e: any) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    };

    // Initial fetch
    onMounted(() => {
      fetch();
    });

    // Watch for itemId changes
    if (typeof itemId !== 'string') {
      watch(itemId, () => {
        loading.value = true;
        fetch();
      });
    }

    return {
      summary,
      loading,
      error,
      refresh: fetch,
    };
  }

  return {
    // Query
    getReactions,
    getReactionSummary,
    getReactionsForItems,
    hasUserReacted,
    getUserReaction,

    // Mutations
    toggleReaction,
    addReaction,
    removeReaction,
    removeAllUserReactions,

    // Real-time
    subscribeToReactions,

    // Reactive helpers
    useReactionSummary,

    // Constants
    REACTION_TYPES,
  };
}
