/**
 * Reactions System Types
 *
 * TypeScript definitions for the polymorphic reactions system.
 * Supports reactions on any content type (messages, comments, etc.)
 */

import type { User } from '../system/user';

/**
 * Available reaction types with emoji and metadata
 */
export const REACTION_TYPES = {
  thumbs_up: { emoji: '👍', label: 'Like', shortcode: '+1' },
  thumbs_down: { emoji: '👎', label: 'Dislike', shortcode: '-1' },
  heart: { emoji: '❤️', label: 'Love', shortcode: 'heart' },
  laugh: { emoji: '😄', label: 'Haha', shortcode: 'laugh' },
  surprise: { emoji: '😮', label: 'Wow', shortcode: 'wow' },
  sad: { emoji: '😢', label: 'Sad', shortcode: 'sad' },
  angry: { emoji: '😠', label: 'Angry', shortcode: 'angry' },
  fire: { emoji: '🔥', label: 'Fire', shortcode: 'fire' },
  celebrate: { emoji: '🎉', label: 'Celebrate', shortcode: 'party' },
  think: { emoji: '🤔', label: 'Thinking', shortcode: 'think' },
  eyes: { emoji: '👀', label: 'Looking', shortcode: 'eyes' },
  rocket: { emoji: '🚀', label: 'Rocket', shortcode: 'rocket' },
} as const;

export type ReactionType = keyof typeof REACTION_TYPES;

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
  reaction_type: ReactionType;
}

/**
 * Reaction with populated user relation
 */
export interface ReactionWithUser extends Omit<Reaction, 'user_created'> {
  user_created: User;
}

/**
 * Aggregated reaction counts for display
 */
export interface ReactionCount {
  reaction_type: ReactionType;
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
  reaction_type: ReactionType;
}

/**
 * Reaction event for real-time updates
 */
export interface ReactionEvent {
  type: 'add' | 'remove';
  reaction: ReactionWithUser;
}

/**
 * Helper function to get reaction metadata
 */
export function getReactionMeta(type: ReactionType) {
  return REACTION_TYPES[type];
}

/**
 * Helper to get all available reaction types
 */
export function getAllReactionTypes(): { type: ReactionType; emoji: string; label: string }[] {
  return Object.entries(REACTION_TYPES).map(([type, meta]) => ({
    type: type as ReactionType,
    emoji: meta.emoji,
    label: meta.label,
  }));
}
