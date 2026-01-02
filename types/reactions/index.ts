/**
 * Reactions System Types
 *
 * TypeScript definitions for the polymorphic reactions system.
 * Supports reactions on any content type (messages, comments, etc.)
 */

import type { DirectusUser } from '../directus';

// Alias for backwards compatibility with existing code
type User = DirectusUser;

/**
 * Icon families supported for reaction types
 */
export type IconFamily = 'heroicons' | 'lucide' | 'fluent-emoji-flat' | 'emoji';

/**
 * Reaction Type record from Directus
 */
export interface ReactionTypeRecord {
  id: number;
  status: 'published' | 'draft';
  sort: number | null;
  name: string;
  emoji: string | null;
  icon: string | null;
  icon_family: IconFamily | null;
  user_created: string | User | null;
  user_updated: string | User | null;
  date_created: string | null;
  date_updated: string | null;
}

/**
 * Supported collection types that can have reactions
 */
export type ReactableCollection = 'channel_messages' | 'comments';

/**
 * Reaction - A single reaction on a piece of content
 */
export interface Reaction {
  id: number;
  user_created: string | User;
  date_created: string | null;
  collection: ReactableCollection;
  item_id: string;
  reaction_type: number | ReactionTypeRecord;
}

/**
 * Reaction with populated relations
 */
export interface ReactionWithRelations extends Omit<Reaction, 'user_created' | 'reaction_type'> {
  user_created: User;
  reaction_type: ReactionTypeRecord;
}

/**
 * Aggregated reaction counts for display
 */
export interface ReactionCount {
  reaction_type: ReactionTypeRecord;
  count: number;
  users: User[];
  hasReacted: boolean;
}

/**
 * Summary of all reactions on an item
 */
export interface ReactionSummary {
  item_id: string;
  collection: ReactableCollection;
  reactions: ReactionCount[];
  totalCount: number;
}

/**
 * Payload for creating/toggling a reaction
 */
export interface CreateReactionPayload {
  collection: ReactableCollection;
  item_id: string;
  reaction_type: number; // ID of the reaction_type
}

/**
 * Helper to get the icon name for a reaction type based on its family
 */
export function getReactionIcon(reactionType: ReactionTypeRecord): string {
  if (!reactionType.icon_family || !reactionType.icon) {
    return '';
  }

  switch (reactionType.icon_family) {
    case 'heroicons':
      return `i-heroicons-${reactionType.icon}`;
    case 'lucide':
      return `i-lucide-${reactionType.icon}`;
    case 'fluent-emoji-flat':
      return `i-fluent-emoji-flat-${reactionType.icon}`;
    default:
      return '';
  }
}

/**
 * Helper to get the filled/solid icon variant for selected state
 */
export function getReactionIconFilled(reactionType: ReactionTypeRecord): string {
  if (!reactionType.icon_family || !reactionType.icon) {
    return '';
  }

  switch (reactionType.icon_family) {
    case 'heroicons':
      // Heroicons uses -solid suffix for filled variants
      return `i-heroicons-${reactionType.icon}-solid`;
    case 'lucide':
      // Lucide doesn't have filled variants, use same icon
      return `i-lucide-${reactionType.icon}`;
    case 'fluent-emoji-flat':
      // Fluent emoji are already flat/filled
      return `i-fluent-emoji-flat-${reactionType.icon}`;
    default:
      return '';
  }
}

/**
 * Helper to check if reaction type uses emoji or icon
 */
export function usesEmoji(reactionType: ReactionTypeRecord): boolean {
  return !!reactionType.emoji && !reactionType.icon;
}
