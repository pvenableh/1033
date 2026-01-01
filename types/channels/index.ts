/**
 * Channel System Types
 *
 * TypeScript definitions for the Slack-like channel system.
 */

import type { User } from '../system/user';
import type { File } from '../system/file';

/**
 * Channel - A communication channel/room
 */
export interface Channel {
  id: string;
  status: 'active' | 'archived';
  sort: number | null;
  user_created: string | User | null;
  date_created: string | null;
  user_updated: string | User | null;
  date_updated: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  is_private: boolean;
  members?: ChannelMember[];
  messages?: ChannelMessage[];
}

/**
 * ChannelMember - Junction table for channel invitations
 */
export interface ChannelMember {
  id: number;
  channel_id: string | Channel;
  user_id: string | User;
  date_created: string | null;
  invited_by: string | User | null;
  role: 'member' | 'moderator';
  notifications_enabled: boolean;
  last_read_at: string | null;
}

/**
 * ChannelMessage - A message within a channel
 */
export interface ChannelMessage {
  id: string;
  channel_id: string | Channel;
  user_created: string | User | null;
  date_created: string | null;
  date_updated: string | null;
  content: string | null;
  is_edited: boolean;
  parent_id: string | ChannelMessage | null;
  mentions?: ChannelMessageMention[];
  files?: ChannelMessageFile[];
}

/**
 * ChannelMessageMention - Tracking @mentions for notifications
 */
export interface ChannelMessageMention {
  id: number;
  message_id: string | ChannelMessage;
  user_id: string | User;
  notified: boolean;
  date_created: string | null;
}

/**
 * ChannelMessageFile - File attachments for messages
 */
export interface ChannelMessageFile {
  id: number;
  message_id: string | ChannelMessage;
  directus_files_id: string | File;
  sort: number | null;
}

/**
 * Channel with fully populated relations
 */
export interface ChannelWithRelations extends Omit<Channel, 'user_created' | 'members' | 'messages'> {
  user_created: User | null;
  members: (Omit<ChannelMember, 'user_id' | 'invited_by'> & {
    user_id: User;
    invited_by: User | null;
  })[];
  messages: ChannelMessageWithRelations[];
}

/**
 * Channel message with fully populated relations
 */
export interface ChannelMessageWithRelations extends Omit<ChannelMessage, 'user_created' | 'channel_id' | 'parent_id' | 'mentions' | 'files'> {
  user_created: User | null;
  channel_id: Channel;
  parent_id: ChannelMessage | null;
  mentions: (Omit<ChannelMessageMention, 'user_id'> & {
    user_id: User;
  })[];
  files: (Omit<ChannelMessageFile, 'directus_files_id'> & {
    directus_files_id: File;
  })[];
}

/**
 * Create channel payload
 */
export interface CreateChannelPayload {
  name: string;
  description?: string;
  icon?: string;
  is_private?: boolean;
}

/**
 * Create message payload
 */
export interface CreateMessagePayload {
  channel_id: string;
  content: string;
  parent_id?: string;
  mentioned_user_ids?: string[];
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
 * Channel unread count info
 */
export interface ChannelUnreadInfo {
  channel_id: string;
  unread_count: number;
  last_message_at: string | null;
}

/**
 * User presence in channel
 */
export interface ChannelPresence {
  user_id: string;
  channel_id: string;
  is_online: boolean;
  last_seen: string;
}
