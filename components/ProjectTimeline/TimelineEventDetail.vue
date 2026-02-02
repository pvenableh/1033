<template>
  <div
    class="fixed inset-0 z-50"
    @click.self="$emit('close')"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="$emit('close')"
    />

    <!-- Panel -->
    <div
      ref="panelRef"
      class="absolute right-0 top-0 h-full w-full max-w-lg bg-cream-alt shadow-2xl overflow-y-auto"
    >
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-cream-alt border-b border-divider p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Category badge -->
            <div
              v-if="event.category_id && typeof event.category_id === 'object'"
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mb-2"
              :style="{
                backgroundColor: event.category_id.color,
                color: event.category_id.text_color,
              }"
            >
              <UIcon
                v-if="event.category_id.icon"
                :name="event.category_id.icon"
                class="w-3 h-3"
              />
              {{ event.category_id.name }}
            </div>

            <h2 class="font-serif text-xl text-gray-900">
              {{ event.title }}
            </h2>

            <div class="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span class="flex items-center gap-1">
                <UIcon
                  name="i-heroicons-calendar"
                  class="w-4 h-4"
                />
                {{ formattedDate }}
              </span>
              <span
                v-if="event.is_milestone"
                class="flex items-center gap-1 text-gold"
              >
                <UIcon
                  name="i-heroicons-flag"
                  class="w-4 h-4"
                />
                Milestone
              </span>
            </div>
          </div>

          <button
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            @click="$emit('close')"
          >
            <UIcon
              name="i-heroicons-x-mark"
              class="w-5 h-5"
            />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Description -->
        <div
          v-if="event.description"
          class="prose prose-sm max-w-none"
          v-html="sanitizedDescription"
        />

        <!-- Project info -->
        <div
          v-if="project"
          class="flex items-center gap-3 p-3 bg-gray-900/5 rounded-lg"
        >
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: project.color }"
          />
          <div>
            <p class="text-sm font-medium text-gray-900">{{ project.name }}</p>
            <p class="text-xs text-gray-500">{{ project.status }}</p>
          </div>
        </div>

        <!-- Tasks -->
        <div v-if="event.tasks && event.tasks.length > 0">
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Tasks ({{ completedTasks }}/{{ event.tasks.length }})
          </h3>
          <TimelineTaskList
            :tasks="event.tasks"
            @toggle="handleTaskToggle"
          />
        </div>

        <!-- Add Task (board members only) -->
        <div v-if="canEdit">
          <button
            v-if="!showAddTaskForm"
            class="flex items-center gap-1.5 text-sm text-gold hover:text-gold/80 transition-colors"
            @click="showAddTaskForm = true"
          >
            <UIcon name="i-heroicons-plus-circle" class="w-4 h-4" />
            Add Task
          </button>

          <div v-else class="border border-divider rounded-lg p-4 space-y-3 bg-gray-50">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Task Title</label>
              <input
                v-model="taskForm.title"
                type="text"
                placeholder="What needs to be done?"
                class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-white"
                @keydown.enter="submitTask"
              />
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                <input
                  v-model="taskForm.due_date"
                  type="date"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-white"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select
                  v-model="taskForm.priority"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-white"
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button
                class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                @click="showAddTaskForm = false; taskForm = { title: '', due_date: '', priority: '' }"
              >
                Cancel
              </button>
              <button
                :disabled="!taskForm.title.trim() || addingTask"
                class="px-3 py-1.5 text-sm bg-gold text-white rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="submitTask"
              >
                {{ addingTask ? 'Adding...' : 'Add Task' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Files -->
        <div v-if="event.files && event.files.length > 0">
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Files ({{ event.files.length }})
          </h3>
          <TimelineFileList :files="event.files" />
        </div>

        <!-- Reactions -->
        <div class="border-t border-divider pt-4">
          <ReactionDisplay
            collection="project_events"
            :item-id="event.id"
            :owner-user-id="event.user_created?.id"
          />
        </div>

        <!-- Comments -->
        <div class="border-t border-divider pt-4">
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Comments
          </h3>
          <CommentsContainer
            target-collection="project_events"
            :target-id="event.id"
          />
        </div>
      </div>

      <!-- Footer with creator info -->
      <div class="sticky bottom-0 bg-cream-alt border-t border-divider p-4">
        <div class="flex items-center gap-3">
          <UAvatar
            v-if="event.user_created"
            :src="getAvatarUrl(event.user_created)"
            :alt="event.user_created.first_name || 'User'"
            size="sm"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900">
              Created by
              <span class="font-medium">
                {{
                  event.user_created
                    ? `${event.user_created.first_name} ${event.user_created.last_name || ''}`
                    : 'Unknown'
                }}
              </span>
            </p>
            <p class="text-xs text-gray-500">
              {{ formattedCreatedDate }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import type { ProjectEventWithRelations, ProjectWithRelations } from '~/types/projects';
import type { DirectusUser } from '~/types/directus';
import TimelineTaskList from './TimelineTaskList.vue';
import TimelineFileList from './TimelineFileList.vue';

interface Props {
  event: ProjectEventWithRelations;
  project: ProjectWithRelations | null;
  canEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
});
const emit = defineEmits<{
  close: [];
  'task-toggle': [taskId: string, completed: boolean];
  'add-task': [taskData: { event_id: string; title: string; description?: string; due_date?: string; priority?: string }];
}>();

// Add task form state
const showAddTaskForm = ref(false);
const addingTask = ref(false);
const taskForm = ref({
  title: '',
  due_date: '',
  priority: '' as '' | 'low' | 'medium' | 'high',
});

const submitTask = async () => {
  if (!taskForm.value.title.trim()) return;
  addingTask.value = true;
  try {
    emit('add-task', {
      event_id: props.event.id,
      title: taskForm.value.title.trim(),
      due_date: taskForm.value.due_date || undefined,
      priority: taskForm.value.priority || undefined,
    });
    taskForm.value = { title: '', due_date: '', priority: '' };
    showAddTaskForm.value = false;
  } finally {
    addingTask.value = false;
  }
};

const panelRef = ref<HTMLElement | null>(null);
const { getImageUrl } = useDirectusFiles();
const { sanitizeSync } = useSanitize();
const { timeAgo } = useTimeAgo();

const formattedDate = computed(() =>
  new Date(props.event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
);

const formattedCreatedDate = computed(() => {
  if (!props.event.date_created) return '';
  const date = new Date(props.event.date_created);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

const sanitizedDescription = computed(() =>
  props.event.description ? sanitizeSync(props.event.description) : ''
);

const completedTasks = computed(
  () => props.event.tasks?.filter((t) => t.completed).length || 0
);

const getAvatarUrl = (user: DirectusUser | null) => {
  if (user?.avatar) {
    const avatarId = typeof user.avatar === 'string' ? user.avatar : user.avatar?.id;
    if (avatarId) return getImageUrl(avatarId);
  }
  return '/images/default-avatar.png';
};

const handleTaskToggle = (taskId: string, completed: boolean) => {
  emit('task-toggle', taskId, completed);
};

// Slide-in animation
onMounted(() => {
  if (panelRef.value) {
    gsap.fromTo(
      panelRef.value,
      { x: '100%' },
      { x: '0%', duration: 0.3, ease: 'power3.out' }
    );
  }
});

// Handle escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>
