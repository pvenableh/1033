/**
 * useProjectTimeline - Main composable for project timeline data
 *
 * Handles fetching, caching, and mutations for projects and events.
 * Integrates with existing comments/reactions systems.
 */

import type {
  Project,
  ProjectWithRelations,
  ProjectEvent,
  ProjectEventWithRelations,
  ProjectTask,
  CreateProjectPayload,
  CreateEventPayload,
  CreateTaskPayload,
} from '~/types/projects';

export function useProjectTimeline() {
  const projects = useDirectusItems<Project>('projects');
  const events = useDirectusItems<ProjectEvent>('project_events');
  const tasks = useDirectusItems<ProjectTask>('project_tasks');
  const { getReactionSummary } = useReactions();
  const { getCommentCount } = useComments();

  // Reactive state
  const projectList = useState<ProjectWithRelations[]>('project-timeline', () => []);
  const loading = ref(true);
  const error = ref<string | null>(null);

  // Field selections for full project tree
  const projectFields = [
    '*',
    'category_id.*',
    'parent_id.id',
    'parent_id.name',
    'parent_id.color',
    'parent_event_id.id',
    'parent_event_id.title',
    'user_created.id',
    'user_created.first_name',
    'user_created.last_name',
    'user_created.avatar',
    'user_updated.id',
    'user_updated.first_name',
    'user_updated.last_name',
    'user_updated.avatar',
    'events.id',
    'events.status',
    'events.title',
    'events.description',
    'events.event_date',
    'events.is_milestone',
    'events.category_id.*',
    'events.user_created.id',
    'events.user_created.first_name',
    'events.user_created.last_name',
    'events.user_created.avatar',
    'events.tasks.id',
    'events.tasks.status',
    'events.tasks.title',
    'events.tasks.description',
    'events.tasks.completed',
    'events.tasks.completed_at',
    'events.tasks.due_date',
    'events.tasks.priority',
    'events.tasks.sort',
    'events.tasks.assignee_id.id',
    'events.tasks.assignee_id.first_name',
    'events.tasks.assignee_id.last_name',
    'events.tasks.assignee_id.avatar',
    'events.tasks.completed_by.id',
    'events.tasks.completed_by.first_name',
    'events.tasks.completed_by.last_name',
    'events.tasks.watchers.id',
    'events.tasks.watchers.user_id.id',
    'events.tasks.watchers.user_id.first_name',
    'events.tasks.watchers.user_id.avatar',
    'events.files.id',
    'events.files.sort',
    'events.files.directus_files_id.id',
    'events.files.directus_files_id.filename_download',
    'events.files.directus_files_id.type',
    'events.files.directus_files_id.filesize',
    'children.id',
    'children.name',
    'children.color',
    'children.status',
    'children.start_date',
    'children.actual_end_date',
  ];

  /**
   * Fetch all projects with full relations
   */
  const fetchProjects = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Fetch without deep filtering - filter client-side instead
      // (Directus deep parameter can cause "Invalid query. 'json' field" errors)
      const result = await projects.list({
        fields: projectFields,
        filter: {
          status: { _in: ['active', 'completed'] },
        },
        sort: ['sort', '-date_created'],
      });

      // Filter and sort events/children client-side
      for (const project of result) {
        // Filter events to only published ones and sort by event_date
        if (project.events) {
          project.events = (project.events as ProjectEventWithRelations[])
            .filter((e) => e.status === 'published')
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

          // Enrich events with comment/reaction counts
          for (const event of project.events as ProjectEventWithRelations[]) {
            try {
              // Use existing polymorphic systems
              const [commentCount, reactionSummary] = await Promise.all([
                getCommentCount('project_events', event.id),
                getReactionSummary('project_events', event.id),
              ]);
              event.comment_count = commentCount;
              event.reaction_count = reactionSummary.totalCount;
            } catch {
              // Silently handle errors for counts
              event.comment_count = 0;
              event.reaction_count = 0;
            }
          }
        }

        // Filter children to only active/completed
        if (project.children) {
          project.children = (project.children as Project[]).filter((c) =>
            ['active', 'completed'].includes(c.status)
          );
        }
      }

      projectList.value = result as ProjectWithRelations[];
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch projects';
      error.value = errorMessage;
      console.error('Failed to fetch projects:', e);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch a single project by ID
   */
  const fetchProject = async (projectId: string): Promise<ProjectWithRelations | null> => {
    try {
      // Fetch without deep filtering - filter client-side instead
      const result = await projects.get(projectId, {
        fields: projectFields,
      });

      // Filter events to only published ones and sort by event_date
      if (result.events) {
        result.events = (result.events as ProjectEventWithRelations[])
          .filter((e) => e.status === 'published')
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

        // Enrich events with counts
        for (const event of result.events as ProjectEventWithRelations[]) {
          try {
            const [commentCount, reactionSummary] = await Promise.all([
              getCommentCount('project_events', event.id),
              getReactionSummary('project_events', event.id),
            ]);
            event.comment_count = commentCount;
            event.reaction_count = reactionSummary.totalCount;
          } catch {
            event.comment_count = 0;
            event.reaction_count = 0;
          }
        }
      }

      // Filter children to only active/completed
      if (result.children) {
        result.children = (result.children as Project[]).filter((c) =>
          ['active', 'completed'].includes(c.status)
        );
      }

      return result as ProjectWithRelations;
    } catch (e) {
      console.error('Failed to fetch project:', e);
      return null;
    }
  };

  /**
   * Create a new project
   */
  const createProject = async (data: CreateProjectPayload): Promise<ProjectWithRelations> => {
    const created = await projects.create(data, { fields: projectFields });
    await fetchProjects(); // Refresh list
    return created as ProjectWithRelations;
  };

  /**
   * Update an existing project
   */
  const updateProject = async (
    projectId: string,
    data: Partial<Project>
  ): Promise<ProjectWithRelations> => {
    const updated = await projects.update(projectId, data, { fields: projectFields });
    await fetchProjects(); // Refresh list
    return updated as ProjectWithRelations;
  };

  /**
   * Create a new event on a project
   */
  const createEvent = async (data: CreateEventPayload): Promise<ProjectEventWithRelations> => {
    const eventFields = [
      '*',
      'category_id.*',
      'user_created.id',
      'user_created.first_name',
      'user_created.avatar',
    ];

    const created = await events.create(data, {
      fields: eventFields,
    });

    await fetchProjects(); // Refresh list
    return created as ProjectEventWithRelations;
  };

  /**
   * Update an existing event
   */
  const updateEvent = async (
    eventId: string,
    data: Partial<ProjectEvent>
  ): Promise<ProjectEventWithRelations> => {
    const eventFields = [
      '*',
      'category_id.*',
      'user_created.id',
      'user_created.first_name',
      'user_created.avatar',
    ];

    const updated = await events.update(eventId, data, {
      fields: eventFields,
    });

    await fetchProjects(); // Refresh list
    return updated as ProjectEventWithRelations;
  };

  /**
   * Delete an event
   */
  const deleteEvent = async (eventId: string): Promise<void> => {
    await events.remove(eventId);
    await fetchProjects();
  };

  /**
   * Toggle task completion
   */
  const toggleTask = async (taskId: string, completed: boolean): Promise<void> => {
    const { user } = useDirectusAuth();

    const updateData: Partial<ProjectTask> = {
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? user.value?.id : null,
    };

    await tasks.update(taskId, updateData);
    await fetchProjects(); // Refresh to show updated state
  };

  /**
   * Create a task on an event
   */
  const createTask = async (data: CreateTaskPayload): Promise<ProjectTask> => {
    const created = await tasks.create(data);
    await fetchProjects();
    return created;
  };

  /**
   * Update a task
   */
  const updateTask = async (taskId: string, data: Partial<ProjectTask>): Promise<ProjectTask> => {
    const updated = await tasks.update(taskId, data);
    await fetchProjects();
    return updated;
  };

  /**
   * Delete a task
   */
  const deleteTask = async (taskId: string): Promise<void> => {
    await tasks.remove(taskId);
    await fetchProjects();
  };

  /**
   * Create a sub-project branching from an event
   */
  const createSubProject = async (
    parentProjectId: string,
    parentEventId: string,
    data: Omit<CreateProjectPayload, 'parent_id' | 'parent_event_id'>
  ): Promise<ProjectWithRelations> => {
    const projectData: CreateProjectPayload = {
      ...data,
      parent_id: parentProjectId,
      parent_event_id: parentEventId,
    };

    return await createProject(projectData);
  };

  /**
   * Get project by ID from cache
   */
  const getProjectById = (projectId: string): ProjectWithRelations | null => {
    return projectList.value.find((p) => p.id === projectId) || null;
  };

  /**
   * Get event by ID from cache
   */
  const getEventById = (eventId: string): ProjectEventWithRelations | null => {
    for (const project of projectList.value) {
      const event = project.events?.find((e) => e.id === eventId);
      if (event) return event as ProjectEventWithRelations;
    }
    return null;
  };

  /**
   * Get the project that contains a specific event
   */
  const getProjectForEvent = (eventId: string): ProjectWithRelations | null => {
    for (const project of projectList.value) {
      const event = project.events?.find((e) => e.id === eventId);
      if (event) return project;
    }
    return null;
  };

  return {
    projects: projectList,
    loading,
    error,
    refresh: fetchProjects,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    createEvent,
    updateEvent,
    deleteEvent,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    createSubProject,
    getProjectById,
    getEventById,
    getProjectForEvent,
  };
}
