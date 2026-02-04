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
const { getComments, createComment, updateComment, deleteComment, useCommentsSubscription } = useComments();
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

// Handle reply to a comment
const handleReply = (comment: Comment) => {
  // For now, scroll to the editor and focus it
  // TODO: Add reply threading support
  const container = document.getElementById('messages-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
  // Focus the editor
  editorRef.value?.editor?.commands.focus();
};

// Handle edit comment
const handleEditComment = async (comment: Comment, newContent: string) => {
  try {
    await updateComment(comment.id, { content: newContent });
    // Update local state
    const index = comments.value.findIndex(c => c.id === comment.id);
    if (index !== -1) {
      comments.value[index] = {
        ...comments.value[index],
        content: newContent,
        is_edited: true,
      };
    }
    toast.add({
      icon: 'i-heroicons-check-circle',
      title: 'Message updated',
      color: 'green',
    });
  } catch (error: any) {
    toast.add({
      icon: 'i-heroicons-exclamation-triangle',
      title: 'Failed to update message',
      description: error.message || 'Please try again',
      color: 'red',
    });
  }
};

// Handle delete comment
const handleDeleteComment = async (comment: Comment) => {
  try {
    await deleteComment(comment.id);
    // Remove from local state
    comments.value = comments.value.filter(c => c.id !== comment.id);
    toast.add({
      icon: 'i-heroicons-check-circle',
      title: 'Message deleted',
      color: 'green',
    });
  } catch (error: any) {
    toast.add({
      icon: 'i-heroicons-exclamation-triangle',
      title: 'Failed to delete message',
      description: error.message || 'Please try again',
      color: 'red',
    });
  }
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

// Get runtime config for assets URL
const config = useRuntimeConfig();

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
          class="p-4 space-y-2 max-h-[500px] overflow-y-auto"
          :class="{ 'min-h-[200px]': !comments.length }"
        >
          <!-- Loading messages -->
          <div v-if="loadingComments" class="flex items-center justify-center py-8">
            <Icon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin t-text-muted" />
          </div>

          <!-- No messages yet -->
          <div v-else-if="!comments.length" class="text-center py-8">
            <Icon name="i-heroicons-chat-bubble-left-ellipsis" class="w-12 h-12 mx-auto mb-3 t-text-muted" />
            <p class="t-text-secondary">No messages yet</p>
            <p class="text-sm t-text-muted">Send a message to communicate with the board</p>
          </div>

          <!-- Messages list using UnifiedMessage component -->
          <template v-else>
            <UnifiedMessage
              v-for="comment in comments"
              :key="comment.id"
              :message="comment"
              reaction-collection="comments"
              :show-actions="true"
              @reply="handleReply"
              @edit="handleEditComment"
              @delete="handleDeleteComment"
            />
          </template>
        </div>

        <!-- Message Input with UnifiedMessageEditor -->
        <div class="p-4 border-t border-border bg-muted/30">
          <UnifiedMessageEditor
            ref="editorRef"
            placeholder="Type a message... Use @ to mention someone"
            submit-label="Send"
            :show-avatar="false"
            :show-enter-to-send="true"
            :submitting="sendingMessage"
            mention-context="general"
            height="min-h-[60px] max-h-[150px]"
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

<!-- Styles are now in the UnifiedMessage component -->
