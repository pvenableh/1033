/**
 * useChannels composable
 *
 * Comprehensive channel management for the Slack-like messaging system.
 * Handles channels, members, messages, mentions, and real-time updates.
 */

import type {
  Channel,
  ChannelMember,
  ChannelMessage,
  ChannelMessageMention,
  ChannelMessageFile,
  ChannelWithRelations,
  ChannelMessageWithRelations,
  CreateChannelPayload,
  CreateMessagePayload,
  ChannelUnreadInfo,
} from '~/types/channels';

// Folder ID for channel file uploads (created by setup script)
const CHANNEL_UPLOADS_FOLDER = 'channel-uploads';

export function useChannels() {
  const channels = useDirectusItems<Channel>('channels');
  const channelMembers = useDirectusItems<ChannelMember>('channel_members');
  const channelMessages = useDirectusItems<ChannelMessage>('channel_messages');
  const channelMentions = useDirectusItems<ChannelMessageMention>('channel_message_mentions');
  const channelFiles = useDirectusItems<ChannelMessageFile>('channel_message_files');

  const { user } = useDirectusAuth();
  const { sendTo } = useDirectusNotifications();
  const { uploadFiles, updateFile } = useDirectusFiles();
  const { subscribe, useSubscription } = useDirectusWebSocket();

  // ==================== CHANNEL OPERATIONS ====================

  /**
   * Get all channels accessible to the current user
   */
  const getChannels = async (options?: {
    includeArchived?: boolean;
  }): Promise<Channel[]> => {
    const filter: Record<string, any> = {};

    if (!options?.includeArchived) {
      filter.status = { _eq: 'active' };
    }

    return await channels.list({
      fields: [
        '*',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_created.avatar',
        'members.id',
        'members.user_id.id',
        'members.user_id.first_name',
        'members.user_id.last_name',
        'members.user_id.avatar',
        'members.role',
      ],
      filter,
      sort: ['sort', 'name'],
    });
  };

  /**
   * Get a single channel by ID
   */
  const getChannel = async (channelId: string): Promise<ChannelWithRelations> => {
    return await channels.get(channelId, {
      fields: [
        '*',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_created.avatar',
        'user_created.email',
        'members.id',
        'members.user_id.id',
        'members.user_id.first_name',
        'members.user_id.last_name',
        'members.user_id.avatar',
        'members.user_id.email',
        'members.role',
        'members.notifications_enabled',
        'members.last_read_at',
        'members.invited_by.id',
        'members.invited_by.first_name',
        'members.invited_by.last_name',
      ],
    }) as ChannelWithRelations;
  };

  /**
   * Create a new channel
   */
  const createChannel = async (data: CreateChannelPayload): Promise<Channel> => {
    return await channels.create({
      ...data,
      status: 'active',
      icon: data.icon || 'chat',
      is_private: data.is_private || false,
    });
  };

  /**
   * Update a channel
   */
  const updateChannel = async (
    channelId: string,
    data: Partial<Channel>
  ): Promise<Channel> => {
    return await channels.update(channelId, data);
  };

  /**
   * Archive a channel
   */
  const archiveChannel = async (channelId: string): Promise<Channel> => {
    return await channels.update(channelId, { status: 'archived' });
  };

  /**
   * Delete a channel (only creator can delete)
   */
  const deleteChannel = async (channelId: string): Promise<boolean> => {
    return await channels.remove(channelId);
  };

  // ==================== MEMBER OPERATIONS ====================

  /**
   * Get members of a channel
   */
  const getChannelMembers = async (channelId: string): Promise<ChannelMember[]> => {
    return await channelMembers.list({
      fields: [
        '*',
        'user_id.id',
        'user_id.first_name',
        'user_id.last_name',
        'user_id.email',
        'user_id.avatar',
        'invited_by.id',
        'invited_by.first_name',
        'invited_by.last_name',
      ],
      filter: {
        channel_id: { _eq: channelId },
      },
    });
  };

  /**
   * Invite a user to a channel
   */
  const inviteMember = async (
    channelId: string,
    userId: string,
    role: 'member' | 'moderator' = 'member'
  ): Promise<ChannelMember> => {
    // Check if already a member
    const existing = await channelMembers.findFirst({
      filter: {
        channel_id: { _eq: channelId },
        user_id: { _eq: userId },
      },
    });

    if (existing) {
      throw new Error('User is already a member of this channel');
    }

    const member = await channelMembers.create({
      channel_id: channelId,
      user_id: userId,
      role,
      notifications_enabled: true,
    } as Partial<ChannelMember>);

    // Send notification to invited user
    const channel = await getChannel(channelId);
    await sendTo(
      userId,
      `You've been invited to #${channel.name}`,
      `${user.value?.first_name} ${user.value?.last_name} invited you to the channel "${channel.name}".`,
      { collection: 'channels', item: channelId }
    );

    return member;
  };

  /**
   * Remove a member from a channel
   */
  const removeMember = async (memberId: number): Promise<boolean> => {
    return await channelMembers.remove(memberId);
  };

  /**
   * Update member settings (notifications, last read)
   */
  const updateMemberSettings = async (
    memberId: number,
    data: Partial<Pick<ChannelMember, 'notifications_enabled' | 'last_read_at'>>
  ): Promise<ChannelMember> => {
    return await channelMembers.update(memberId, data);
  };

  /**
   * Mark channel as read for current user
   */
  const markChannelAsRead = async (channelId: string): Promise<void> => {
    if (!user.value?.id) return;

    const membership = await channelMembers.findFirst({
      filter: {
        channel_id: { _eq: channelId },
        user_id: { _eq: user.value.id },
      },
    });

    if (membership) {
      await channelMembers.update(membership.id, {
        last_read_at: new Date().toISOString(),
      });
    }
  };

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Get messages for a channel
   */
  const getMessages = async (
    channelId: string,
    options?: {
      limit?: number;
      offset?: number;
      parentId?: string | null;
    }
  ): Promise<ChannelMessageWithRelations[]> => {
    const filter: Record<string, any> = {
      channel_id: { _eq: channelId },
    };

    // Filter by parent (for threads) or get root messages
    if (options?.parentId !== undefined) {
      filter.parent_id = options.parentId
        ? { _eq: options.parentId }
        : { _null: true };
    }

    return await channelMessages.list({
      fields: [
        '*',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_created.avatar',
        'user_created.email',
        'mentions.id',
        'mentions.user_id.id',
        'mentions.user_id.first_name',
        'mentions.user_id.last_name',
        'mentions.notified',
        'files.id',
        'files.directus_files_id.id',
        'files.directus_files_id.filename_download',
        'files.directus_files_id.type',
        'files.directus_files_id.filesize',
        'files.directus_files_id.title',
        'files.sort',
      ],
      filter,
      sort: ['date_created'],
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    }) as ChannelMessageWithRelations[];
  };

  /**
   * Get thread replies for a message
   */
  const getThreadReplies = async (
    messageId: string
  ): Promise<ChannelMessageWithRelations[]> => {
    return await channelMessages.list({
      fields: [
        '*',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_created.avatar',
        'mentions.id',
        'mentions.user_id.id',
        'mentions.user_id.first_name',
        'mentions.user_id.last_name',
        'files.id',
        'files.directus_files_id.*',
      ],
      filter: {
        parent_id: { _eq: messageId },
      },
      sort: ['date_created'],
    }) as ChannelMessageWithRelations[];
  };

  /**
   * Send a message to a channel
   */
  const sendMessage = async (
    data: CreateMessagePayload
  ): Promise<ChannelMessage> => {
    const message = await channelMessages.create({
      channel_id: data.channel_id,
      content: data.content,
      parent_id: data.parent_id || null,
      is_edited: false,
    } as Partial<ChannelMessage>);

    // Create mention records and send notifications
    if (data.mentioned_user_ids && data.mentioned_user_ids.length > 0) {
      await createMentions(message.id, data.mentioned_user_ids, data.channel_id);
    }

    return message;
  };

  /**
   * Update a message
   */
  const updateMessage = async (
    messageId: string,
    content: string
  ): Promise<ChannelMessage> => {
    return await channelMessages.update(messageId, {
      content,
      is_edited: true,
    });
  };

  /**
   * Delete a message
   */
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    return await channelMessages.remove(messageId);
  };

  // ==================== MENTION OPERATIONS ====================

  /**
   * Create mention records and send notifications
   */
  const createMentions = async (
    messageId: string,
    userIds: string[],
    channelId: string
  ): Promise<void> => {
    const channel = await getChannel(channelId);
    const currentUser = user.value;

    for (const userId of userIds) {
      // Create mention record
      await channelMentions.create({
        message_id: messageId,
        user_id: userId,
        notified: false,
      } as Partial<ChannelMessageMention>);

      // Send notification
      await sendTo(
        userId,
        `${currentUser?.first_name} mentioned you in #${channel.name}`,
        `You were mentioned in a message. Click to view the conversation.`,
        { collection: 'channel_messages', item: messageId }
      );

      // Mark as notified
      const mention = await channelMentions.findFirst({
        filter: {
          message_id: { _eq: messageId },
          user_id: { _eq: userId },
        },
      });

      if (mention) {
        await channelMentions.update(mention.id, { notified: true });
      }
    }
  };

  /**
   * Get unread mentions for current user
   */
  const getUnreadMentions = async (): Promise<ChannelMessageMention[]> => {
    if (!user.value?.id) return [];

    return await channelMentions.list({
      fields: [
        '*',
        'message_id.id',
        'message_id.content',
        'message_id.channel_id.id',
        'message_id.channel_id.name',
        'message_id.user_created.first_name',
        'message_id.user_created.last_name',
      ],
      filter: {
        user_id: { _eq: user.value.id },
      },
      sort: ['-date_created'],
    });
  };

  // ==================== FILE OPERATIONS ====================

  /**
   * Upload and attach files to a message
   */
  const uploadMessageFiles = async (
    messageId: string,
    files: File[],
    folderId?: string
  ): Promise<ChannelMessageFile[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file', file);
    });

    // Upload files to Directus
    const uploadedFiles = await uploadFiles(formData);
    const filesArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];

    // Update files with folder if provided
    if (folderId) {
      for (const file of filesArray) {
        await updateFile(file.id, { folder: folderId });
      }
    }

    // Create junction records
    const attachments: ChannelMessageFile[] = [];
    for (let i = 0; i < filesArray.length; i++) {
      const attachment = await channelFiles.create({
        message_id: messageId,
        directus_files_id: filesArray[i].id,
        sort: i,
      } as Partial<ChannelMessageFile>);
      attachments.push(attachment);
    }

    return attachments;
  };

  /**
   * Remove a file attachment from a message
   */
  const removeMessageFile = async (attachmentId: number): Promise<boolean> => {
    return await channelFiles.remove(attachmentId);
  };

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to channel messages in real-time
   */
  const useChannelMessagesSubscription = (channelId: string | Ref<string>) => {
    const id = isRef(channelId) ? channelId.value : channelId;

    return useSubscription({
      collection: 'channel_messages',
      query: {
        fields: [
          '*',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'user_created.avatar',
          'mentions.id',
          'mentions.user_id.id',
          'mentions.user_id.first_name',
          'mentions.user_id.last_name',
          'files.id',
          'files.directus_files_id.id',
          'files.directus_files_id.filename_download',
          'files.directus_files_id.type',
        ],
        filter: {
          channel_id: { _eq: id },
          parent_id: { _null: true },
        },
        sort: 'date_created',
      },
      uid: `channel-messages-${id}`,
    });
  };

  /**
   * Subscribe to all channels for updates
   */
  const useChannelsSubscription = () => {
    return useSubscription({
      collection: 'channels',
      query: {
        fields: [
          '*',
          'members.id',
          'members.user_id.id',
          'members.user_id.first_name',
          'members.user_id.last_name',
        ],
        filter: {
          status: { _eq: 'active' },
        },
        sort: ['sort', 'name'],
      },
      uid: 'channels-list',
    });
  };

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Check if current user has access to a channel
   */
  const hasChannelAccess = async (channelId: string): Promise<boolean> => {
    try {
      await getChannel(channelId);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Get unread message count for a channel
   */
  const getUnreadCount = async (channelId: string): Promise<number> => {
    if (!user.value?.id) return 0;

    // Get user's membership to find last_read_at
    const membership = await channelMembers.findFirst({
      filter: {
        channel_id: { _eq: channelId },
        user_id: { _eq: user.value.id },
      },
    });

    const lastReadAt = membership?.last_read_at;

    // Count messages after last_read_at
    const filter: Record<string, any> = {
      channel_id: { _eq: channelId },
      user_created: { _neq: user.value.id }, // Don't count own messages
    };

    if (lastReadAt) {
      filter.date_created = { _gt: lastReadAt };
    }

    return await channelMessages.count(filter);
  };

  /**
   * Get mentionable users for a channel
   * Returns all board members + invited channel members
   */
  const getMentionableUsers = async (channelId?: string): Promise<any[]> => {
    const { listUsers } = useDirectusUser();

    // Get board members (always mentionable)
    const boardMembers = await listUsers({
      fields: ['id', 'first_name', 'last_name', 'email', 'avatar'],
      filter: {
        role: { _eq: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2' }, // Board member role
        status: { _eq: 'active' },
      },
    });

    // If channel specified, also get invited members
    if (channelId) {
      const members = await getChannelMembers(channelId);
      const memberUserIds = members.map((m) =>
        typeof m.user_id === 'string' ? m.user_id : m.user_id.id
      );

      // Get user details for non-board members
      if (memberUserIds.length > 0) {
        const invitedUsers = await listUsers({
          fields: ['id', 'first_name', 'last_name', 'email', 'avatar'],
          filter: {
            id: { _in: memberUserIds },
            role: { _neq: '50deeb53-29e4-4e7a-9c21-9c571e78fcb2' }, // Not board members
          },
        });

        return [...(boardMembers || []), ...(invitedUsers || [])];
      }
    }

    return boardMembers || [];
  };

  return {
    // Channel operations
    getChannels,
    getChannel,
    createChannel,
    updateChannel,
    archiveChannel,
    deleteChannel,

    // Member operations
    getChannelMembers,
    inviteMember,
    removeMember,
    updateMemberSettings,
    markChannelAsRead,

    // Message operations
    getMessages,
    getThreadReplies,
    sendMessage,
    updateMessage,
    deleteMessage,

    // Mention operations
    createMentions,
    getUnreadMentions,

    // File operations
    uploadMessageFiles,
    removeMessageFile,

    // Real-time subscriptions
    useChannelMessagesSubscription,
    useChannelsSubscription,

    // Utilities
    hasChannelAccess,
    getUnreadCount,
    getMentionableUsers,

    // Folder ID for uploads
    CHANNEL_UPLOADS_FOLDER,
  };
}
