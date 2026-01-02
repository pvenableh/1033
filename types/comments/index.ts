/**
 * Comments System Types
 *
 * TypeScript definitions for the improved comments system.
 * Supports rich text, @mentions, file attachments, and threaded replies.
 */

import type { DirectusUser, DirectusFile } from '../directus';

// Alias for backwards compatibility with existing code
type User = DirectusUser;
type File = DirectusFile;

/**
 * Comment - A rich text comment on any item
 */
export interface Comment {
  id: string;
  user_created: string | User | null;
  date_created: string | null;
  date_updated: string | null;
  content: string;
  target_collection: string;
  target_id: string;
  parent_id: string | Comment | null;
  is_edited: boolean;
  is_resolved: boolean;
  mentions?: CommentMention[];
  files?: CommentFile[];
  replies?: Comment[];
}

/**
 * CommentMention - Tracking @mentions for notifications
 */
export interface CommentMention {
  id: number;
  comment_id: string | Comment;
  user_id: string | User;
  notified: boolean;
  date_created: string | null;
}

/**
 * CommentFile - File attachments for comments
 */
export interface CommentFile {
  id: number;
  comment_id: string | Comment;
  directus_files_id: string | File;
  sort: number | null;
}

/**
 * Comment with fully populated relations
 */
export interface CommentWithRelations extends Omit<Comment, 'user_created' | 'parent_id' | 'mentions' | 'files' | 'replies'> {
  user_created: User | null;
  parent_id: Comment | null;
  mentions: (Omit<CommentMention, 'user_id'> & {
    user_id: User;
  })[];
  files: (Omit<CommentFile, 'directus_files_id'> & {
    directus_files_id: File;
  })[];
  replies: CommentWithRelations[];
  reply_count?: number;
}

/**
 * Create comment payload
 */
export interface CreateCommentPayload {
  content: string;
  target_collection: string;
  target_id: string;
  parent_id?: string;
  mentioned_user_ids?: string[];
}

/**
 * Update comment payload
 */
export interface UpdateCommentPayload {
  content: string;
  is_resolved?: boolean;
}

/**
 * Mention data from Tiptap editor
 */
export interface MentionData {
  id: string;
  label: string;
  email?: string;
  avatar?: string | null;
}

/**
 * Comment count info for an item
 */
export interface CommentCountInfo {
  target_collection: string;
  target_id: string;
  total_count: number;
  unresolved_count: number;
}

/**
 * Comment subscription event
 */
export interface CommentEvent {
  type: 'init' | 'create' | 'update' | 'delete';
  data: CommentWithRelations[];
}

/**
 * Props for comment components
 */
export interface CommentTargetProps {
  targetCollection: string;
  targetId: string;
}
