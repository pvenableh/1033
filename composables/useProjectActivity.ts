/**
 * useProjectActivity - Aggregate activity feed for a project
 *
 * Fetches and combines recent activity from events, tasks, comments,
 * and reactions into a unified activity feed.
 */

import type { ProjectActivity } from '~/types/projects';
import type { DirectusUser } from '~/types/directus';

type User = DirectusUser;

const ACTIVITY_CONFIG = {
  event_created: {
    action: 'created event',
    icon: 'i-heroicons-calendar',
  },
  task_completed: {
    action: 'completed task',
    icon: 'i-heroicons-check-circle',
  },
  comment_added: {
    action: 'commented on',
    icon: 'i-heroicons-chat-bubble-left',
  },
  file_uploaded: {
    action: 'uploaded file to',
    icon: 'i-heroicons-paper-clip',
  },
  reaction_added: {
    action: 'reacted to',
    icon: 'i-heroicons-heart',
  },
};

export function useProjectActivity(projectId: Ref<string>) {
  const eventsItems = useDirectusItems('project_events');
  const tasksItems = useDirectusItems('project_tasks');
  const commentsItems = useDirectusItems('comments');

  const activities = ref<ProjectActivity[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const fetchActivity = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Fetch recent events for this project
      const recentEvents = await eventsItems.list({
        fields: [
          'id',
          'title',
          'date_created',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'user_created.avatar',
        ],
        filter: {
          project_id: { _eq: projectId.value },
        },
        sort: ['-date_created'],
        limit: 10,
      });

      // Fetch recently completed tasks for events in this project
      const projectEventIds = (recentEvents as { id: string }[]).map((e) => e.id);

      let recentTasks: unknown[] = [];
      if (projectEventIds.length > 0) {
        recentTasks = await tasksItems.list({
          fields: [
            'id',
            'title',
            'completed_at',
            'completed_by.id',
            'completed_by.first_name',
            'completed_by.last_name',
            'completed_by.avatar',
            'event_id.id',
            'event_id.title',
            'event_id.project_id',
          ],
          filter: {
            completed: { _eq: true },
            completed_at: { _nnull: true },
            event_id: { _in: projectEventIds },
          },
          sort: ['-completed_at'],
          limit: 10,
        });
      }

      // Fetch recent comments on project events
      let recentComments: unknown[] = [];
      if (projectEventIds.length > 0) {
        recentComments = await commentsItems.list({
          fields: [
            'id',
            'date_created',
            'target_id',
            'user_created.id',
            'user_created.first_name',
            'user_created.last_name',
            'user_created.avatar',
          ],
          filter: {
            target_collection: { _eq: 'project_events' },
            target_id: { _in: projectEventIds },
          },
          sort: ['-date_created'],
          limit: 10,
        });
      }

      // Transform and merge activities
      const eventActivities: ProjectActivity[] = (
        recentEvents as {
          id: string;
          title: string;
          date_created: string;
          user_created: User;
        }[]
      ).map((e) => ({
        id: `event-${e.id}`,
        type: 'event_created' as const,
        user: e.user_created,
        action: ACTIVITY_CONFIG.event_created.action,
        date: e.date_created,
        icon: ACTIVITY_CONFIG.event_created.icon,
        targetId: e.id,
        targetTitle: e.title,
      }));

      const taskActivities: ProjectActivity[] = (
        recentTasks as {
          id: string;
          title: string;
          completed_at: string;
          completed_by: User | null;
        }[]
      )
        .filter((t) => t.completed_by)
        .map((t) => ({
          id: `task-${t.id}`,
          type: 'task_completed' as const,
          user: t.completed_by as User,
          action: ACTIVITY_CONFIG.task_completed.action,
          date: t.completed_at,
          icon: ACTIVITY_CONFIG.task_completed.icon,
          targetId: t.id,
          targetTitle: t.title,
        }));

      const commentActivities: ProjectActivity[] = (
        recentComments as {
          id: string;
          date_created: string;
          target_id: string;
          user_created: User;
        }[]
      ).map((c) => {
        const event = (recentEvents as { id: string; title: string }[]).find(
          (e) => e.id === c.target_id
        );
        return {
          id: `comment-${c.id}`,
          type: 'comment_added' as const,
          user: c.user_created,
          action: ACTIVITY_CONFIG.comment_added.action,
          date: c.date_created,
          icon: ACTIVITY_CONFIG.comment_added.icon,
          targetId: c.target_id,
          targetTitle: event?.title || 'an event',
        };
      });

      // Merge, sort by date, take top 20
      activities.value = [...eventActivities, ...taskActivities, ...commentActivities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch activity';
      error.value = errorMessage;
      console.error('Failed to fetch project activity:', e);
    } finally {
      loading.value = false;
    }
  };

  // Fetch on mount and when projectId changes
  onMounted(fetchActivity);
  watch(projectId, fetchActivity);

  return {
    activities,
    loading,
    error,
    refresh: fetchActivity,
  };
}

/**
 * Format a date as relative time (e.g., "5 minutes ago")
 */
export function useTimeAgo() {
  const timeAgo = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return { timeAgo };
}
