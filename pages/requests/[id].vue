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
        const container = document.getElementById('messages-container') || document.getElementById('messages-container-mobile');
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

    // Scroll to bottom (check both desktop and mobile containers)
    nextTick(() => {
      const container = document.getElementById('messages-container') || document.getElementById('messages-container-mobile');
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

// ===== Tabs for mobile layout =====
const activeTab = ref(0);
const tabItems = [
  { label: 'Messages', slot: 'messages', icon: 'i-heroicons-chat-bubble-left-right' },
  { label: 'Tasks', slot: 'tasks', icon: 'i-heroicons-clipboard-document-list' },
];

// ===== Horizontal Timeline =====
const activeTimelineEvent = ref<number | null>(null);

interface TimelineEvent {
  title: string;
  detail: string;
  shortLabel: string;
  icon: string;
  dotClass: string;
}

const timelineEvents = computed<TimelineEvent[]>(() => {
  if (!request.value) return [];

  const events: TimelineEvent[] = [];

  // 1. Submitted
  events.push({
    title: 'Request Submitted',
    detail: formatDate(request.value.date_created) || 'Unknown date',
    shortLabel: 'Submitted',
    icon: 'i-heroicons-plus',
    dotClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-blue-400',
  });

  // 2. In Progress (if status is "in progress", "completed", or "cancelled")
  const hasProgressed = request.value.status && ['in progress', 'completed', 'cancelled'].includes(request.value.status);
  if (hasProgressed) {
    events.push({
      title: 'In Progress',
      detail: 'Work has started on your request',
      shortLabel: 'In Progress',
      icon: 'i-heroicons-wrench-screwdriver',
      dotClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 ring-yellow-400',
    });
  }

  // 3. Updated (if date_updated differs from date_created)
  if (request.value.date_updated && request.value.date_updated !== request.value.date_created) {
    events.push({
      title: 'Last Updated',
      detail: formatDate(request.value.date_updated) || 'Unknown date',
      shortLabel: 'Updated',
      icon: 'i-heroicons-pencil',
      dotClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 ring-purple-400',
    });
  }

  // 4. Completed or Cancelled
  if (request.value.status === 'completed') {
    events.push({
      title: 'Request Completed',
      detail: 'Your request has been resolved',
      shortLabel: 'Completed',
      icon: 'i-heroicons-check',
      dotClass: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 ring-green-400',
    });
  } else if (request.value.status === 'cancelled') {
    events.push({
      title: 'Request Cancelled',
      detail: 'This request was cancelled',
      shortLabel: 'Cancelled',
      icon: 'i-heroicons-x-mark',
      dotClass: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 ring-gray-400',
    });
  }

  return events;
});

const timelineGradient = computed(() => {
  if (!request.value) return 'linear-gradient(to right, #93c5fd, #93c5fd)';

  const status = request.value.status;
  if (status === 'completed') {
    return 'linear-gradient(to right, #93c5fd, #fcd34d, #a78bfa, #86efac)';
  }
  if (status === 'cancelled') {
    return 'linear-gradient(to right, #93c5fd, #fcd34d, #d1d5db)';
  }
  if (status === 'in progress') {
    return 'linear-gradient(to right, #93c5fd, #fcd34d)';
  }
  return 'linear-gradient(to right, #93c5fd, #93c5fd)';
});

// SEO
useSeoMeta({
  title: computed(() => request.value?.subject ? `${request.value.subject} - My Requests` : 'Request Details'),
});
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
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

      <!-- Horizontal Timeline -->
      <div class="bg-card rounded-lg px-6 py-5 border border-border">
        <div class="timeline-track">
          <!-- The connecting line -->
          <div class="timeline-line" :style="{ background: timelineGradient }"></div>

          <!-- Timeline events -->
          <div
            v-for="(event, index) in timelineEvents"
            :key="index"
            class="timeline-event group"
            @mouseenter="activeTimelineEvent = index"
            @mouseleave="activeTimelineEvent = null"
          >
            <!-- Dot -->
            <div
              class="timeline-dot"
              :class="[event.dotClass, { 'ring-2 ring-offset-2 ring-offset-card': activeTimelineEvent === index }]"
            >
              <UIcon :name="event.icon" class="w-3 h-3" />
            </div>

            <!-- Hover card -->
            <Transition name="timeline-card">
              <div
                v-show="activeTimelineEvent === index"
                class="timeline-card"
              >
                <div class="timeline-card-inner">
                  <div class="flex items-center gap-2 mb-1">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" :class="event.dotClass">
                      <UIcon :name="event.icon" class="w-2.5 h-2.5" />
                    </div>
                    <span class="font-semibold text-sm t-text">{{ event.title }}</span>
                  </div>
                  <p class="text-xs t-text-muted pl-7">{{ event.detail }}</p>
                </div>
              </div>
            </Transition>

            <!-- Label below dot (always visible) -->
            <span class="timeline-label">{{ event.shortLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Tasks & Messages: Tabs on mobile, side-by-side on desktop -->
      <!-- Mobile: Tabs -->
      <div class="lg:hidden">
        <Tabs
          v-model="activeTab"
          :items="tabItems"
          class="bg-card rounded-lg border border-border overflow-hidden"
        >
          <template #messages>
            <div class="messages-panel">
              <!-- Messages Container -->
              <div
                id="messages-container-mobile"
                class="p-4 space-y-2 max-h-[400px] overflow-y-auto"
                :class="{ 'min-h-[150px]': !comments.length }"
              >
                <div v-if="loadingComments" class="flex items-center justify-center py-8">
                  <Icon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin t-text-muted" />
                </div>
                <div v-else-if="!comments.length" class="text-center py-8">
                  <Icon name="i-heroicons-chat-bubble-left-ellipsis" class="w-12 h-12 mx-auto mb-3 t-text-muted" />
                  <p class="t-text-secondary">No messages yet</p>
                  <p class="text-sm t-text-muted">Send a message to communicate with the board</p>
                </div>
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
          </template>

          <template #tasks>
            <div class="p-4">
              <div v-if="loadingTasks" class="flex items-center justify-center py-6">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin t-text-muted" />
              </div>
              <div v-else-if="!relatedTasks.length" class="text-center py-6">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-10 h-10 mx-auto mb-2 t-text-muted opacity-50" />
                <p class="t-text-secondary text-sm">No tasks yet</p>
                <p class="text-xs t-text-muted">Tasks will appear here once the board starts working on your request</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="task in relatedTasks"
                  :key="task.id"
                  class="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div class="mt-0.5 shrink-0">
                    <UIcon
                      :name="task.task_status === 'completed' ? 'i-heroicons-check-circle-solid' : 'i-heroicons-clock'"
                      class="w-5 h-5"
                      :class="task.task_status === 'completed' ? 'text-green-500' : 't-text-muted'"
                    />
                  </div>
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
          </template>
        </Tabs>
      </div>

      <!-- Desktop: Side-by-side -->
      <div class="hidden lg:grid lg:grid-cols-2 gap-6">
        <!-- Messages column -->
        <div class="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-border">
            <h2 class="font-semibold t-text flex items-center gap-2">
              <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5" />
              Messages
            </h2>
            <p class="text-sm t-text-muted mt-1">
              Communicate with the board about your request
            </p>
          </div>

          <div
            id="messages-container"
            class="p-4 space-y-2 flex-1 overflow-y-auto max-h-[500px]"
            :class="{ 'min-h-[200px]': !comments.length }"
          >
            <div v-if="loadingComments" class="flex items-center justify-center py-8">
              <Icon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin t-text-muted" />
            </div>
            <div v-else-if="!comments.length" class="text-center py-8">
              <Icon name="i-heroicons-chat-bubble-left-ellipsis" class="w-12 h-12 mx-auto mb-3 t-text-muted" />
              <p class="t-text-secondary">No messages yet</p>
              <p class="text-sm t-text-muted">Send a message to communicate with the board</p>
            </div>
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

        <!-- Tasks column -->
        <div class="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-border">
            <h2 class="font-semibold t-text flex items-center gap-2">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5" />
              Tasks
            </h2>
            <p class="text-sm t-text-muted mt-1">
              Tasks being worked on for your request
            </p>
          </div>

          <div class="p-4 flex-1 overflow-y-auto max-h-[500px]">
            <div v-if="loadingTasks" class="flex items-center justify-center py-6">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin t-text-muted" />
            </div>
            <div v-else-if="!relatedTasks.length" class="text-center py-6">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-10 h-10 mx-auto mb-2 t-text-muted opacity-50" />
              <p class="t-text-secondary text-sm">No tasks yet</p>
              <p class="text-xs t-text-muted">Tasks will appear here once the board starts working on your request</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="task in relatedTasks"
                :key="task.id"
                class="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div class="mt-0.5 shrink-0">
                  <UIcon
                    :name="task.task_status === 'completed' ? 'i-heroicons-check-circle-solid' : 'i-heroicons-clock'"
                    class="w-5 h-5"
                    :class="task.task_status === 'completed' ? 'text-green-500' : 't-text-muted'"
                  />
                </div>
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
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Horizontal Timeline ===== */
.timeline-track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  min-height: 4rem;
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 2rem;
  right: 2rem;
  height: 3px;
  border-radius: 2px;
  transform: translateY(-50%);
  z-index: 0;
}

.timeline-event {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  cursor: default;
}

.timeline-dot {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timeline-event:hover .timeline-dot {
  transform: scale(1.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.timeline-label {
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
  color: var(--color-muted-foreground, #6b7280);
}

/* Timeline hover card */
.timeline-card {
  position: absolute;
  bottom: calc(100% + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: none;
  width: max-content;
  max-width: 220px;
}

.timeline-card-inner {
  background: var(--color-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.08);
}

:root.dark .timeline-card-inner {
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 2px 8px -2px rgba(0, 0, 0, 0.3);
}

/* Card appear transition */
.timeline-card-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.timeline-card-leave-active {
  transition: all 0.15s ease-in;
}

.timeline-card-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(6px) scale(0.92);
}

.timeline-card-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px) scale(0.95);
}

/* Card arrow */
.timeline-card-inner::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background: var(--color-card, #fff);
  border-right: 1px solid var(--color-border, #e5e7eb);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
</style>
