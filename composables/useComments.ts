/**
 * useComments composable
 *
 * Comprehensive comment management for any collection/item.
 * Supports rich text, @mentions, file attachments, and threaded replies.
 */

import type {
  Comment,
  CommentMention,
  CommentFile,
  CommentWithRelations,
  CreateCommentPayload,
  UpdateCommentPayload,
  CommentCountInfo,
} from '~/types/comments';

// Folder ID for comment file uploads (created by setup script)
const COMMENT_UPLOADS_FOLDER = 'comment-uploads';

export function useComments() {
  const comments = useDirectusItems<Comment>('comments');
  const commentMentions = useDirectusItems<CommentMention>('comment_mentions');
  const commentFiles = useDirectusItems<CommentFile>('comment_files');

  const { user } = useDirectusAuth();
  const { sendTo } = useDirectusNotifications();
  const { uploadFiles, updateFile } = useDirectusFiles();
  const { subscribe, useSubscription } = useDirectusWebSocket();

  // ==================== COMMENT OPERATIONS ====================

  /**
   * Get comments for a specific item
   */
  const getComments = async (
    targetCollection: string,
    targetId: string,
    options?: {
      includeReplies?: boolean;
      parentId?: string | null;
      limit?: number;
      offset?: number;
    }
  ): Promise<CommentWithRelations[]> => {
    const filter: Record<string, any> = {
      target_collection: { _eq: targetCollection },
      target_id: { _eq: targetId },
    };

    // Filter by parent (for getting root comments or replies)
    if (options?.parentId !== undefined) {
      filter.parent_id = options.parentId
        ? { _eq: options.parentId }
        : { _null: true };
    }

    const result = await comments.list({
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
        ...(options?.includeReplies ? [
          'replies.id',
          'replies.content',
          'replies.date_created',
          'replies.user_created.id',
          'replies.user_created.first_name',
          'replies.user_created.last_name',
          'replies.user_created.avatar',
        ] : []),
      ],
      filter,
      sort: ['date_created'],
      limit: options?.limit || 100,
      offset: options?.offset || 0,
    });

    return result as CommentWithRelations[];
  };

  /**
   * Get a single comment by ID
   */
  const getComment = async (commentId: string): Promise<CommentWithRelations> => {
    return await comments.get(commentId, {
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
        'files.id',
        'files.directus_files_id.*',
        'replies.id',
        'replies.content',
        'replies.date_created',
        'replies.user_created.id',
        'replies.user_created.first_name',
        'replies.user_created.last_name',
        'replies.user_created.avatar',
      ],
    }) as CommentWithRelations;
  };

  /**
   * Get replies for a comment
   */
  const getReplies = async (parentId: string): Promise<CommentWithRelations[]> => {
    return await comments.list({
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
        parent_id: { _eq: parentId },
      },
      sort: ['date_created'],
    }) as CommentWithRelations[];
  };

  /**
   * Create a new comment
   */
  const createComment = async (
    data: CreateCommentPayload
  ): Promise<Comment> => {
    const comment = await comments.create({
      content: data.content,
      target_collection: data.target_collection,
      target_id: data.target_id,
      parent_id: data.parent_id || null,
      is_edited: false,
      is_resolved: false,
    } as Partial<Comment>);

    // Create mention records and send notifications
    if (data.mentioned_user_ids && data.mentioned_user_ids.length > 0) {
      await createMentions(comment.id, data.mentioned_user_ids, data.target_collection, data.target_id);
    }

    return comment;
  };

  /**
   * Update a comment
   */
  const updateComment = async (
    commentId: string,
    data: UpdateCommentPayload
  ): Promise<Comment> => {
    return await comments.update(commentId, {
      content: data.content,
      is_edited: true,
      ...(data.is_resolved !== undefined && { is_resolved: data.is_resolved }),
    });
  };

  /**
   * Delete a comment
   */
  const deleteComment = async (commentId: string): Promise<boolean> => {
    return await comments.remove(commentId);
  };

  /**
   * Resolve/unresolve a comment
   */
  const toggleResolved = async (commentId: string, resolved: boolean): Promise<Comment> => {
    return await comments.update(commentId, { is_resolved: resolved });
  };

  // ==================== MENTION OPERATIONS ====================

  /**
   * Create mention records and send notifications
   */
  const createMentions = async (
    commentId: string,
    userIds: string[],
    targetCollection: string,
    targetId: string
  ): Promise<void> => {
    const currentUser = user.value;

    for (const userId of userIds) {
      // Don't notify yourself
      if (userId === currentUser?.id) continue;

      // Create mention record
      await commentMentions.create({
        comment_id: commentId,
        user_id: userId,
        notified: false,
      } as Partial<CommentMention>);

      // Send notification
      await sendTo(
        userId,
        `${currentUser?.first_name} mentioned you in a comment`,
        `You were mentioned in a comment on a ${targetCollection.slice(0, -1)}. Click to view.`,
        { collection: 'comments', item: commentId }
      );

      // Mark as notified
      const mention = await commentMentions.findFirst({
        filter: {
          comment_id: { _eq: commentId },
          user_id: { _eq: userId },
        },
      });

      if (mention) {
        await commentMentions.update(mention.id, { notified: true });
      }
    }
  };

  /**
   * Get unread mentions for current user
   */
  const getMyMentions = async (): Promise<CommentMention[]> => {
    if (!user.value?.id) return [];

    return await commentMentions.list({
      fields: [
        '*',
        'comment_id.id',
        'comment_id.content',
        'comment_id.target_collection',
        'comment_id.target_id',
        'comment_id.date_created',
        'comment_id.user_created.id',
        'comment_id.user_created.first_name',
        'comment_id.user_created.last_name',
        'comment_id.user_created.avatar',
      ],
      filter: {
        user_id: { _eq: user.value.id },
      },
      sort: ['-date_created'],
    });
  };

  // ==================== FILE OPERATIONS ====================

  /**
   * Upload and attach files to a comment
   */
  const uploadCommentFiles = async (
    commentId: string,
    files: File[],
    folderId?: string
  ): Promise<CommentFile[]> => {
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
    const attachments: CommentFile[] = [];
    for (let i = 0; i < filesArray.length; i++) {
      const attachment = await commentFiles.create({
        comment_id: commentId,
        directus_files_id: filesArray[i].id,
        sort: i,
      } as Partial<CommentFile>);
      attachments.push(attachment);
    }

    return attachments;
  };

  /**
   * Remove a file attachment from a comment
   */
  const removeCommentFile = async (attachmentId: number): Promise<boolean> => {
    return await commentFiles.remove(attachmentId);
  };

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to comments for an item in real-time
   */
  const useCommentsSubscription = (
    targetCollection: string,
    targetId: string | Ref<string>
  ) => {
    const id = isRef(targetId) ? targetId.value : targetId;

    return useSubscription({
      collection: 'comments',
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
          target_collection: { _eq: targetCollection },
          target_id: { _eq: id },
          parent_id: { _null: true }, // Only root comments
        },
        sort: 'date_created',
      },
      uid: `comments-${targetCollection}-${id}`,
    });
  };

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Get comment count for an item
   */
  const getCommentCount = async (
    targetCollection: string,
    targetId: string
  ): Promise<CommentCountInfo> => {
    const totalCount = await comments.count({
      target_collection: { _eq: targetCollection },
      target_id: { _eq: targetId },
    });

    const unresolvedCount = await comments.count({
      target_collection: { _eq: targetCollection },
      target_id: { _eq: targetId },
      is_resolved: { _eq: false },
    });

    return {
      target_collection: targetCollection,
      target_id: targetId,
      total_count: totalCount,
      unresolved_count: unresolvedCount,
    };
  };

  /**
   * Get reply count for a comment
   */
  const getReplyCount = async (commentId: string): Promise<number> => {
    return await comments.count({
      parent_id: { _eq: commentId },
    });
  };

  /**
   * Get mentionable users
   * Returns all active users who can be mentioned
   */
  const getMentionableUsers = async (): Promise<any[]> => {
    const { listUsers } = useDirectusUser();

    const users = await listUsers({
      fields: ['id', 'first_name', 'last_name', 'email', 'avatar'],
      filter: {
        status: { _eq: 'active' },
      },
    });

    // Filter out current user
    return (users || []).filter((u: any) => u.id !== user.value?.id);
  };

  /**
   * Check if current user can edit a comment
   */
  const canEditComment = (comment: Comment | CommentWithRelations): boolean => {
    if (!user.value?.id) return false;

    const authorId = typeof comment.user_created === 'string'
      ? comment.user_created
      : comment.user_created?.id;

    return authorId === user.value.id;
  };

  /**
   * Format collection name for display
   */
  const formatCollectionName = (collection: string): string => {
    // Remove trailing 's' and capitalize
    const singular = collection.endsWith('s') ? collection.slice(0, -1) : collection;
    return singular.charAt(0).toUpperCase() + singular.slice(1);
  };

  return {
    // Comment operations
    getComments,
    getComment,
    getReplies,
    createComment,
    updateComment,
    deleteComment,
    toggleResolved,

    // Mention operations
    createMentions,
    getMyMentions,

    // File operations
    uploadCommentFiles,
    removeCommentFile,

    // Real-time subscriptions
    useCommentsSubscription,

    // Utilities
    getCommentCount,
    getReplyCount,
    getMentionableUsers,
    canEditComment,
    formatCollectionName,

    // Folder ID for uploads
    COMMENT_UPLOADS_FOLDER,
  };
}
