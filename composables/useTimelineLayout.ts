/**
 * useTimelineLayout - Timeline positioning and layout calculations
 *
 * Handles lane positioning, date calculations, and spatial layout for the timeline SVG.
 */

import type { ProjectWithRelations, TimelineLane } from '~/types/projects';

export function useTimelineLayout(
  projects: Ref<ProjectWithRelations[]>,
  zoom: Ref<number>
) {
  const laneHeight = 180;
  const headerHeight = 60;
  const padding = 100;

  /**
   * Calculate date range from all events
   */
  const dateRange = computed(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const project of projects.value) {
      // Include project start date
      const startTime = new Date(project.start_date).getTime();
      if (startTime < min) min = startTime;

      // Include actual end date if exists
      if (project.actual_end_date) {
        const endTime = new Date(project.actual_end_date).getTime();
        if (endTime > max) max = endTime;
      }

      // Include event dates
      for (const event of project.events || []) {
        const eventTime = new Date(event.event_date).getTime();
        if (eventTime < min) min = eventTime;
        if (eventTime > max) max = eventTime;
      }
    }

    // If no events, use current date range
    if (min === Infinity || max === -Infinity) {
      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      min = now - oneMonth;
      max = now + oneMonth;
    }

    // Extend max to today if projects are ongoing
    const today = Date.now();
    if (today > max) {
      max = today;
    }

    // Add padding (10% on each side)
    const range = max - min;
    const rangePadding = range * 0.1;

    return {
      start: new Date(min - rangePadding),
      end: new Date(max + rangePadding),
    };
  });

  /**
   * Get the canvas width based on zoom level
   */
  const canvasWidth = computed(() => 1200 * zoom.value);

  /**
   * Calculate x position for a date
   */
  const getXPosition = (dateString: string): number => {
    const time = new Date(dateString).getTime();
    const range = dateRange.value.end.getTime() - dateRange.value.start.getTime();
    const ratio = (time - dateRange.value.start.getTime()) / range;
    const width = canvasWidth.value;
    return padding + ratio * (width - 2 * padding);
  };

  /**
   * Calculate date from x position (inverse of getXPosition)
   */
  const getDateFromX = (x: number): Date => {
    const width = canvasWidth.value;
    const ratio = (x - padding) / (width - 2 * padding);
    const range = dateRange.value.end.getTime() - dateRange.value.start.getTime();
    const time = dateRange.value.start.getTime() + ratio * range;
    return new Date(time);
  };

  /**
   * Get today's x position
   */
  const todayX = computed(() => getXPosition(new Date().toISOString()));

  /**
   * Assign lane indices to projects
   * Root projects get their own lanes, nested projects appear below their parents
   */
  const getLaneIndex = (project: ProjectWithRelations, allProjects: ProjectWithRelations[]): number => {
    const rootProjects = allProjects.filter((p) => !p.parent_id);
    const rootIndex = rootProjects.findIndex((p) => p.id === project.id);

    if (rootIndex !== -1) return rootIndex;

    // For nested projects, position after parent
    const parentId = typeof project.parent_id === 'object' ? project.parent_id?.id : project.parent_id;
    const parent = allProjects.find((p) => p.id === parentId);

    if (parent) {
      const parentLane = getLaneIndex(parent, allProjects);
      const siblings = allProjects.filter((p) => {
        const pParentId = typeof p.parent_id === 'object' ? p.parent_id?.id : p.parent_id;
        return pParentId === parent.id;
      });
      const siblingIndex = siblings.findIndex((p) => p.id === project.id);
      return parentLane + siblingIndex + 1;
    }

    return 0;
  };

  /**
   * Calculate all lane positions
   */
  const lanes = computed<TimelineLane[]>(() => {
    return projects.value.map((project) => ({
      project,
      laneIndex: getLaneIndex(project, projects.value),
      yPosition: getLaneIndex(project, projects.value) * laneHeight + headerHeight,
    }));
  });

  /**
   * Get total number of lanes
   */
  const totalLanes = computed(() => {
    if (lanes.value.length === 0) return 1;
    return Math.max(...lanes.value.map((l) => l.laneIndex)) + 1;
  });

  /**
   * Calculate canvas height based on lanes
   */
  const canvasHeight = computed(() => totalLanes.value * laneHeight + headerHeight + 60);

  /**
   * Generate time axis labels (month markers)
   */
  const timeLabels = computed(() => {
    const labels: { x: number; text: string }[] = [];
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const current = new Date(dateRange.value.start);

    // Start from the first day of the month
    current.setDate(1);

    while (current <= dateRange.value.end) {
      labels.push({
        x: getXPosition(current.toISOString()),
        text: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return labels;
  });

  /**
   * Grid spacing based on zoom
   */
  const gridSpacing = computed(() => 100 * zoom.value);

  /**
   * Get lane for a specific project
   */
  const getLaneForProject = (projectId: string): TimelineLane | null => {
    return lanes.value.find((l) => l.project.id === projectId) || null;
  };

  return {
    lanes,
    dateRange,
    totalLanes,
    laneHeight,
    headerHeight,
    padding,
    canvasWidth,
    canvasHeight,
    gridSpacing,
    todayX,
    timeLabels,
    getXPosition,
    getDateFromX,
    getLaneIndex,
    getLaneForProject,
  };
}
