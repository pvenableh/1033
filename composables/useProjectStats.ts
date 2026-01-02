/**
 * useProjectStats - Compute comprehensive project statistics
 *
 * Calculates various metrics for project overview including task progress,
 * duration, file counts, and engagement metrics.
 */

import type { ProjectWithRelations, ProjectStats, ProjectEventWithRelations } from '~/types/projects';

export function useProjectStats(project: Ref<ProjectWithRelations | null>) {
  const stats = computed<ProjectStats>(() => {
    const p = project.value;

    if (!p) {
      return {
        events: 0,
        tasksTotal: 0,
        tasksCompleted: 0,
        subProjects: 0,
        files: 0,
        comments: 0,
        reactions: 0,
        durationDays: 0,
        progressPercent: 0,
        isOngoing: true,
      };
    }

    // Count events
    const events = p.events?.length || 0;

    // Count tasks
    let tasksTotal = 0;
    let tasksCompleted = 0;
    for (const event of (p.events || []) as ProjectEventWithRelations[]) {
      for (const task of event.tasks || []) {
        tasksTotal++;
        if (task.completed) tasksCompleted++;
      }
    }

    // Count sub-projects
    const subProjects = p.children?.length || 0;

    // Count files
    let files = 0;
    for (const event of (p.events || []) as ProjectEventWithRelations[]) {
      files += event.files?.length || 0;
    }

    // Count comments and reactions (from enriched data)
    let comments = 0;
    let reactions = 0;
    for (const event of (p.events || []) as ProjectEventWithRelations[]) {
      comments += event.comment_count || 0;
      reactions += event.reaction_count || 0;
    }

    // Calculate duration
    const startDate = new Date(p.start_date);
    const endDate = p.actual_end_date ? new Date(p.actual_end_date) : new Date();
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate progress (based on completed tasks)
    const progressPercent =
      tasksTotal > 0
        ? Math.round((tasksCompleted / tasksTotal) * 100)
        : p.actual_end_date
          ? 100
          : 0;

    const isOngoing = !p.actual_end_date;

    return {
      events,
      tasksTotal,
      tasksCompleted,
      subProjects,
      files,
      comments,
      reactions,
      durationDays,
      progressPercent,
      isOngoing,
    };
  });

  /**
   * Get task completion percentage
   */
  const taskCompletionPercent = computed(() => {
    if (stats.value.tasksTotal === 0) return 0;
    return Math.round((stats.value.tasksCompleted / stats.value.tasksTotal) * 100);
  });

  /**
   * Get remaining tasks count
   */
  const remainingTasks = computed(() => {
    return stats.value.tasksTotal - stats.value.tasksCompleted;
  });

  /**
   * Get overdue tasks
   */
  const overdueTasks = computed(() => {
    const p = project.value;
    if (!p) return [];

    const today = new Date();
    const overdue: { task: { id: string; title: string; due_date: string }; event: { id: string; title: string } }[] = [];

    for (const event of (p.events || []) as ProjectEventWithRelations[]) {
      for (const task of event.tasks || []) {
        if (!task.completed && task.due_date && new Date(task.due_date) < today) {
          overdue.push({
            task: { id: task.id, title: task.title, due_date: task.due_date },
            event: { id: event.id, title: event.title },
          });
        }
      }
    }

    return overdue;
  });

  /**
   * Get upcoming milestones
   */
  const upcomingMilestones = computed(() => {
    const p = project.value;
    if (!p) return [];

    const today = new Date();
    return ((p.events || []) as ProjectEventWithRelations[])
      .filter((e) => e.is_milestone && new Date(e.event_date) >= today)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 3);
  });

  /**
   * Format duration in a human-readable way
   */
  const formattedDuration = computed(() => {
    const days = stats.value.durationDays;
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  });

  return {
    stats,
    taskCompletionPercent,
    remainingTasks,
    overdueTasks,
    upcomingMilestones,
    formattedDuration,
  };
}

/**
 * Compute aggregate stats across multiple projects
 */
export function useAggregateProjectStats(projects: Ref<ProjectWithRelations[]>) {
  const aggregateStats = computed(() => {
    let totalEvents = 0;
    let totalTasksTotal = 0;
    let totalTasksCompleted = 0;
    let totalFiles = 0;
    let totalComments = 0;
    let totalReactions = 0;
    let activeProjects = 0;
    let completedProjects = 0;

    for (const project of projects.value) {
      if (project.status === 'active') activeProjects++;
      if (project.status === 'completed') completedProjects++;

      totalEvents += project.events?.length || 0;

      for (const event of (project.events || []) as ProjectEventWithRelations[]) {
        totalFiles += event.files?.length || 0;
        totalComments += event.comment_count || 0;
        totalReactions += event.reaction_count || 0;

        for (const task of event.tasks || []) {
          totalTasksTotal++;
          if (task.completed) totalTasksCompleted++;
        }
      }
    }

    return {
      projects: projects.value.length,
      activeProjects,
      completedProjects,
      events: totalEvents,
      tasksTotal: totalTasksTotal,
      tasksCompleted: totalTasksCompleted,
      files: totalFiles,
      comments: totalComments,
      reactions: totalReactions,
      overallProgress:
        totalTasksTotal > 0 ? Math.round((totalTasksCompleted / totalTasksTotal) * 100) : 0,
    };
  });

  return { aggregateStats };
}
