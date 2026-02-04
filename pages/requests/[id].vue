<script setup lang="ts">
import type { Request, Comment, Task } from '~/types/directus';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();
const { user } = useDirectusAuth();
const { get: getRequest } = useDirectusItems<Request>('requests');
const toast = useToast();

// Tasks
const {
  fetchRelatedTasks,
  priorityLabel,
  priorityColor,
  statusLabel,
  statusColor,
} = useTasks();
const relatedTasks = ref<Task[]>([]);
const loadingTasks = ref(true);

const requestId = computed(() => route.params.id as string);

// Fetch request details
const { data: request, pending: requestPending, error: requestError, refresh: refreshRequest } = await useAsyncData(
  `request-${requestId.value}`,
  async () => {
    const result = await getRequest(requestId.value, {
      fields: [
        'id',
        'subject',
        'description',
        'status',
        'category',
        'priority',
        'contact_preference',
        'name',
        'email',
        'phone',
        'unit',
        'date_created',
        'date_updated',
        'user_created.id',
        'user_created.email',
      ],
    });
    return result;
  }
);

// Verify ownership
const isOwner = computed(() => {
  if (!request.value || !user.value) return false;
  const creatorId = typeof request.value.user_created === 'string'
    ? request.value.user_created
    : request.value.user_created?.id;
  return creatorId === user.value.id || request.value.email === user.value.email;
});

// Comments/Messages
const { getComments, createComment, useCommentsSubscription } = useComments();
const { sanitizeSync, initSanitizer } = useSanitize();
const comments = ref<Comment[]>([]);
const loadingComments = ref(true);
const sendingMessage = ref(false);
const editorRef = ref<any>(null);

// Real-time comments subscription
const { data: realtimeComments } = useCommentsSubscription('requests', requestId);

// Watch for real-time comment updates
watch(realtimeComments, (newComments) => {
  if (newComments && newComments.length > 0) {
    // Merge real-time comments with existing ones, preserving user data
    const existingCommentsMap = new Map(
      comments.value.map(c => [c.id, c])
    );

    const mergedComments = newComments.map((newComment: any) => {
      const existing = existingCommentsMap.get(newComment.id);
      // If existing comment has user data and new one doesn't, preserve existing user data
      if (existing && existing.user_created && typeof existing.user_created === 'object') {
        if (!newComment.user_created || typeof newComment.user_created === 'string') {
          return { ...newComment, user_created: existing.user_created };
        }
      }
      return newComment;
    });

    comments.value = mergedComments as Comment[];

    // Scroll to bottom if new comments added
    if (mergedComments.length > existingCommentsMap.size) {
      nextTick(() => {
        const container = document.getElementById('messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }
});

// Load comments
const loadComments = async () => {
  loadingComments.value = true;
  try {
    const result = await getComments('requests', requestId.value, {
      includeReplies: false,
    });
    comments.value = result || [];
  } catch (error) {
    console.error('Failed to load comments:', error);
  } finally {
    loadingComments.value = false;
  }
};

// Send a new message using CommentEditor
const handleSendMessage = async (payload: { content: string; mentionedUserIds: string[] }) => {
  if (sendingMessage.value) return;

  sendingMessage.value = true;
  try {
    const newComment = await createComment({
      content: payload.content,
      target_collection: 'requests',
      target_id: requestId.value,
      mentioned_user_ids: payload.mentionedUserIds,
    });

    // Optimistically add the comment with current user data
    // Real-time subscription will update with complete data
    const optimisticComment = {
      ...newComment,
      user_created: user.value,
    };

    // Check if comment already exists (from real-time subscription race)
    const existingIndex = comments.value.findIndex(c => c.id === newComment.id);
    if (existingIndex === -1) {
      comments.value.push(optimisticComment as any);
    }

    // Clear editor
    editorRef.value?.clearEditor();

    // Scroll to bottom
    nextTick(() => {
      const container = document.getElementById('messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  } catch (error: any) {
    toast.add({
      icon: 'i-heroicons-exclamation-triangle',
      title: 'Failed to send message',
      description: error.message || 'Please try again',
      color: 'red',
    });
  } finally {
    sendingMessage.value = false;
  }
};

// Sanitize HTML content for display
const getSanitizedContent = (content: string) => {
  return sanitizeSync(content);
};

// Load tasks related to this request
async function loadRelatedTasks() {
  loadingTasks.value = true;
  try {
    relatedTasks.value = await fetchRelatedTasks('requests', requestId.value);
  } catch (error) {
    console.error('Failed to load tasks:', error);
  } finally {
    loadingTasks.value = false;
  }
}

// Format task date
const formatTaskDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Load comments and tasks on mount
onMounted(() => {
  initSanitizer();
  loadComments();
  loadRelatedTasks();
});

// Status badge colors
const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'in progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

// Format date
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Format time for chat
const formatMessageTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Check if message is from current user
const isOwnMessage = (comment: Comment) => {
  if (!user.value) return false;
  const creatorId = typeof comment.user_created === 'string'
    ? comment.user_created
    : comment.user_created?.id;
  return creatorId === user.value.id;
};

// Get user display name for comment
const getCommentAuthor = (comment: Comment) => {
  if (typeof comment.user_created === 'string') return 'Unknown';
  return `${comment.user_created?.first_name || ''} ${comment.user_created?.last_name || ''}`.trim() || 'Unknown';
};

// Get comment owner ID for reactions
const getCommentOwnerId = (comment: Comment): string | undefined => {
  if (typeof comment.user_created === 'string') return comment.user_created;
  return comment.user_created?.id;
};

// Get avatar URL for comment author
const config = useRuntimeConfig();
const getCommentAvatarUrl = (comment: Comment): string => {
  if (typeof comment.user_created === 'string') {
    return `https://ui-avatars.com/api/?name=U&background=eeeeee&color=00bfff`;
  }
  const userCreated = comment.user_created;
  if (userCreated?.avatar) {
    return `${config.public.assetsUrl}${userCreated.avatar}?key=medium`;
  }
  const name = `${userCreated?.first_name || ''} ${userCreated?.last_name || ''}`.trim() || 'Unknown';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eeeeee&color=00bfff`;
};

// SEO
useSeoMeta({
  title: computed(() => request.value?.subject ? `${request.value.subject} - My Requests` : 'Request Details'),
});
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Back button -->
    <NuxtLink
      to="/requests"
      class="inline-flex items-center gap-2 text-sm t-text-secondary hover:t-text mb-6"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
      Back to My Requests
    </NuxtLink>

    <!-- Loading State -->
    <div v-if="requestPending" class="bg-card rounded-lg p-8 animate-pulse">
      <div class="h-6 bg-muted rounded w-1/2 mb-4"></div>
      <div class="h-4 bg-muted rounded w-full mb-2"></div>
      <div class="h-4 bg-muted rounded w-3/4"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="requestError" class="bg-destructive/10 text-destructive rounded-lg p-6 text-center">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto mb-3" />
      <p class="font-medium">Failed to load request</p>
      <button
        @click="refreshRequest()"
        class="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg"
      >
        Try Again
      </button>
    </div>

    <!-- Access Denied -->
    <div v-else-if="request && !isOwner" class="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg p-6 text-center">
      <UIcon name="i-heroicons-shield-exclamation" class="w-12 h-12 mx-auto mb-3" />
      <p class="font-medium">Access Denied</p>
      <p class="text-sm mt-1">You can only view requests you submitted.</p>
      <NuxtLink
        to="/requests"
        class="mt-4 inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
      >
        Back to My Requests
      </NuxtLink>
    </div>

    <!-- Request Details -->
    <div v-else-if="request" class="space-y-6">
      <!-- Header Card -->
      <div class="bg-card rounded-lg p-6 border border-border">
        <div class="flex items-start justify-between gap-4 mb-4">
          <h1 class="text-xl font-bold t-text">{{ request.subject || 'Untitled Request' }}</h1>
          <span
            v-if="request.status"
            :class="statusColors[request.status] || statusColors.new"
            class="px-3 py-1 rounded-full text-sm font-medium capitalize whitespace-nowrap"
          >
            {{ request.status }}
          </span>
        </div>

        <!-- Original request description -->
        <div class="bg-muted/50 rounded-lg p-4 mb-4">
          <p class="text-sm t-text-secondary whitespace-pre-wrap">{{ request.description }}</p>
        </div>

        <!-- Meta info -->
        <div class="flex flex-wrap items-center gap-4 text-sm t-text-muted">
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
            Submitted {{ formatDate(request.date_created) }}
          </span>
          <span v-if="request.category" class="flex items-center gap-1">
            <UIcon name="i-heroicons-tag" class="w-4 h-4" />
            {{ request.category }}
          </span>
          <span v-if="request.unit" class="flex items-center gap-1">
            <UIcon name="i-heroicons-home" class="w-4 h-4" />
            Unit {{ request.unit }}
          </span>
        </div>
      </div>

      <!-- Chat/Messages Section -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="px-6 py-4 border-b border-border">
          <h2 class="font-semibold t-text flex items-center gap-2">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5" />
            Messages
          </h2>
          <p class="text-sm t-text-muted mt-1">
            Communicate with the board about your request
          </p>
        </div>

        <!-- Messages Container -->
        <div
          id="messages-container"
          class="p-4 space-y-4 max-h-[400px] overflow-y-auto"
          :class="{ 'min-h-[200px]': !comments.length }"
        >
          <!-- Loading messages -->
          <div v-if="loadingComments" class="flex items-center justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin t-text-muted" />
          </div>

          <!-- No messages yet -->
          <div v-else-if="!comments.length" class="text-center py-8">
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-12 h-12 mx-auto mb-3 t-text-muted" />
            <p class="t-text-secondary">No messages yet</p>
            <p class="text-sm t-text-muted">Send a message to communicate with the board</p>
          </div>

          <!-- Messages list -->
          <template v-else>
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="flex gap-3"
              :class="isOwnMessage(comment) ? 'flex-row-reverse' : 'flex-row'"
            >
              <!-- Avatar -->
              <div class="shrink-0">
                <UiAvatar
                  :src="getCommentAvatarUrl(comment)"
                  :alt="getCommentAuthor(comment)"
                  size="sm"
                />
              </div>

              <!-- Message bubble and reactions -->
              <div class="flex flex-col" :class="isOwnMessage(comment) ? 'items-end' : 'items-start'">
                <div
                  class="max-w-[85%] rounded-lg px-4 py-2 group"
                  :class="isOwnMessage(comment)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'"
                >
                  <!-- Author name for other users -->
                  <p
                    v-if="!isOwnMessage(comment)"
                    class="text-xs font-medium mb-1 opacity-70"
                  >
                    {{ getCommentAuthor(comment) }}
                  </p>

                  <!-- Message content (rendered as HTML) -->
                  <div
                    class="text-sm prose prose-sm dark:prose-invert max-w-none comment-content"
                    v-html="getSanitizedContent(comment.content)"
                  />

                  <!-- Timestamp -->
                  <p
                    class="text-xs mt-1"
                    :class="isOwnMessage(comment) ? 'text-primary-foreground/70' : 't-text-muted'"
                  >
                    {{ formatMessageTime(comment.date_created) }}
                  </p>
                </div>

                <!-- Reactions below message bubble -->
                <div class="px-2" :class="isOwnMessage(comment) ? 'text-right' : 'text-left'">
                  <ReactionDisplay
                    collection="comments"
                    :item-id="comment.id"
                    :owner-user-id="getCommentOwnerId(comment)"
                    :show-picker="true"
                    :compact="true"
                  />
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Message Input with Rich Text Editor -->
        <div class="p-4 border-t border-border bg-muted/30">
          <CommentEditor
            ref="editorRef"
            placeholder="Type a message... Use @ to mention someone"
            submit-label="Send"
            :show-avatar="false"
            :submitting="sendingMessage"
            @submit="handleSendMessage"
          />
        </div>
      </div>

      <!-- Tasks Section -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="px-6 py-4 border-b border-border">
          <h2 class="font-semibold t-text flex items-center gap-2">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5" />
            Tasks
          </h2>
          <p class="text-sm t-text-muted mt-1">
            Tasks being worked on for your request
          </p>
        </div>

        <div class="p-4">
          <!-- Loading tasks -->
          <div v-if="loadingTasks" class="flex items-center justify-center py-6">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin t-text-muted" />
          </div>

          <!-- No tasks yet -->
          <div v-else-if="!relatedTasks.length" class="text-center py-6">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-10 h-10 mx-auto mb-2 t-text-muted opacity-50" />
            <p class="t-text-secondary text-sm">No tasks yet</p>
            <p class="text-xs t-text-muted">Tasks will appear here once the board starts working on your request</p>
          </div>

          <!-- Tasks list -->
          <div v-else class="space-y-3">
            <div
              v-for="task in relatedTasks"
              :key="task.id"
              class="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <!-- Status indicator -->
              <div class="mt-0.5 shrink-0">
                <UIcon
                  :name="task.task_status === 'completed' ? 'i-heroicons-check-circle-solid' : 'i-heroicons-clock'"
                  class="w-5 h-5"
                  :class="task.task_status === 'completed' ? 'text-green-500' : 't-text-muted'"
                />
              </div>

              <!-- Task content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="font-medium text-sm"
                    :class="{ 'line-through t-text-muted': task.task_status === 'completed' }"
                  >
                    {{ task.title }}
                  </span>
                  <span
                    v-if="task.task_status"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="statusColor[task.task_status] || 'bg-gray-100 text-gray-600'"
                  >
                    {{ statusLabel[task.task_status] || task.task_status }}
                  </span>
                </div>

                <div class="flex items-center gap-3 mt-1.5 text-xs t-text-muted flex-wrap">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5" />
                    Created {{ formatTaskDate(task.date_created) }}
                  </span>
                  <span v-if="task.due_date" class="flex items-center gap-1">
                    <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                    Due {{ formatTaskDate(task.due_date) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Status Timeline -->
      <div class="bg-card rounded-lg p-6 border border-border">
        <h2 class="font-semibold t-text mb-4 flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="w-5 h-5" />
          Timeline
        </h2>

        <div class="space-y-4">
          <!-- Created -->
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-plus" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="text-sm font-medium t-text">Request Submitted</p>
              <p class="text-xs t-text-muted">{{ formatDate(request.date_created) }}</p>
            </div>
          </div>

          <!-- Updated (if different from created) -->
          <div v-if="request.date_updated && request.date_updated !== request.date_created" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-pencil" class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p class="text-sm font-medium t-text">Last Updated</p>
              <p class="text-xs t-text-muted">{{ formatDate(request.date_updated) }}</p>
            </div>
          </div>

          <!-- Status indicator -->
          <div v-if="request.status === 'completed'" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="text-sm font-medium t-text">Request Completed</p>
              <p class="text-xs t-text-muted">Your request has been resolved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-content :deep(.mention) {
  color: #0ea5e9;
  font-weight: 500;
  background: rgba(14, 165, 233, 0.1);
  padding: 0.1em 0.3em;
  border-radius: 0.25em;
}

.comment-content :deep(img) {
  max-width: 200px;
  max-height: 150px;
  border-radius: 0.375rem;
  margin: 0.25rem 0;
}

.comment-content :deep(a) {
  color: #0ea5e9;
  text-decoration: underline;
}

.comment-content :deep(ul),
.comment-content :deep(ol) {
  padding-left: 1rem;
  margin: 0.25rem 0;
}

.comment-content :deep(p) {
  margin: 0;
}

.comment-content :deep(p + p) {
  margin-top: 0.5rem;
}
</style>
