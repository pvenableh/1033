/**
 * Project Timeline System Types
 *
 * TypeScript definitions for the project timeline visualization.
 * Supports nested projects, events with tasks, and polymorphic comments/reactions.
 */

import type { DirectusUser, DirectusFile } from '../directus';

// Alias for backwards compatibility with existing code
type User = DirectusUser;
type File = DirectusFile;

/**
 * Project - A timeline "line" that contains events
 */
export interface Project {
  id: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  sort: number | null;
  user_created: string | User | null;
  user_updated: string | User | null;
  date_created: string | null;
  date_updated: string | null;

  // Core fields
  name: string;
  description: string | null;
  color: string; // Hex color for the timeline line
  icon: string | null; // Optional icon (heroicons/lucide format)

  // Categorization
  category_id: string | ProjectCategory | null;

  // Nesting
  parent_id: string | Project | null; // Parent project (for sub-projects)
  parent_event_id: string | ProjectEvent | null; // Event that spawned this sub-project

  // Visibility
  member_visible: boolean; // Whether regular members can see this project

  // Timeline bounds
  start_date: string; // ISO date
  target_end_date: string | null;
  actual_end_date: string | null;

  // Relations (populated)
  events?: ProjectEvent[];
  children?: Project[]; // Sub-projects
}

/**
 * ProjectCategory - Grouping for projects
 */
export interface ProjectCategory {
  id: string;
  status: 'published' | 'draft';
  sort: number | null;
  name: string;
  color: string;
  icon: string | null;
}

/**
 * ProjectEvent - A milestone/node on the project timeline
 */
export interface ProjectEvent {
  id: string;
  status: 'published' | 'draft';
  sort: number | null;
  user_created: string | User | null;
  user_updated: string | User | null;
  date_created: string | null;
  date_updated: string | null;

  // Core fields
  project_id: string | Project;
  title: string;
  description: string | null; // Rich text (HTML from Tiptap)
  event_date: string; // ISO date - when this event occurred/is planned

  // Categorization
  category_id: string | ProjectEventCategory | null;

  // Flags
  is_milestone: boolean; // Major milestone (larger node)

  // Relations (populated)
  tasks?: ProjectTask[];
  files?: ProjectEventFile[];
  spawned_projects?: Project[]; // Sub-projects that branch from this event
}

/**
 * ProjectEventCategory - Event type categorization
 */
export interface ProjectEventCategory {
  id: string;
  status: 'published' | 'draft';
  sort: number | null;
  name: string;
  color: string; // Badge background
  text_color: string; // Badge text
  icon: string | null;
}

/**
 * ProjectTask - Actionable item attached to an event
 * Uses single assignee for clear accountability + optional watchers
 */
export interface ProjectTask {
  id: string;
  status: 'published' | 'draft';
  sort: number | null;
  user_created: string | User | null;
  date_created: string | null;

  // Core fields
  event_id: string | ProjectEvent;
  title: string;
  description: string | null;

  // Assignment (single owner for accountability)
  assignee_id: string | User | null;

  // Watchers (people following along, get notified)
  watchers?: ProjectTaskWatcher[];

  // Status
  completed: boolean;
  completed_at: string | null;
  completed_by: string | User | null;

  // Due date
  due_date: string | null;

  // Priority
  priority: 'low' | 'medium' | 'high' | null;
}

/**
 * ProjectTaskWatcher - Users following a task (not responsible, but notified)
 */
export interface ProjectTaskWatcher {
  id: number;
  task_id: string | ProjectTask;
  user_id: string | User;
  date_created: string | null;
}

/**
 * ProjectEventFile - File attachment junction
 */
export interface ProjectEventFile {
  id: number;
  project_event_id: string | ProjectEvent;
  directus_files_id: string | File;
  sort: number | null;
}

/**
 * ProjectStats - Computed statistics for project overview
 */
export interface ProjectStats {
  events: number;
  tasksTotal: number;
  tasksCompleted: number;
  subProjects: number;
  files: number;
  comments: number;
  reactions: number;
  durationDays: number;
  progressPercent: number;
  isOngoing: boolean;
}

/**
 * ProjectActivity - Activity feed item
 */
export interface ProjectActivity {
  id: string;
  type:
    | 'event_created'
    | 'task_completed'
    | 'comment_added'
    | 'file_uploaded'
    | 'reaction_added';
  user: User;
  action: string;
  date: string;
  icon: string;
  targetId: string;
  targetTitle: string;
}

/**
 * Populated versions for display
 */
export interface ProjectWithRelations
  extends Omit<
    Project,
    'user_created' | 'user_updated' | 'category_id' | 'parent_id' | 'parent_event_id'
  > {
  user_created: User | null;
  user_updated: User | null;
  category_id: ProjectCategory | null;
  parent_id: Project | null;
  parent_event_id: ProjectEvent | null;
  events: ProjectEventWithRelations[];
  children: ProjectWithRelations[];
}

export interface ProjectEventWithRelations
  extends Omit<ProjectEvent, 'user_created' | 'project_id' | 'category_id'> {
  user_created: User | null;
  project_id: Project;
  category_id: ProjectEventCategory | null;
  tasks: ProjectTaskWithRelations[];
  files: (Omit<ProjectEventFile, 'directus_files_id'> & { directus_files_id: File })[];
  // For display
  comment_count?: number;
  reaction_count?: number;
}

export interface ProjectTaskWithRelations
  extends Omit<ProjectTask, 'assignee_id' | 'completed_by' | 'event_id' | 'watchers'> {
  assignee_id: User | null;
  completed_by: User | null;
  event_id: ProjectEvent;
  watchers: (Omit<ProjectTaskWatcher, 'user_id'> & { user_id: User })[];
}

/**
 * Timeline visualization helpers
 */
export interface TimelineViewState {
  zoomLevel: number; // 0.5 - 2.0
  focusedProjectId: string | null;
  selectedEventId: string | null;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface TimelineLane {
  project: ProjectWithRelations;
  laneIndex: number;
  yPosition: number;
}

/**
 * Create project payload
 */
export interface CreateProjectPayload {
  name: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  category_id?: string | null;
  parent_id?: string | null;
  parent_event_id?: string | null;
  start_date: string;
  target_end_date?: string | null;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  member_visible?: boolean;
}

/**
 * Create event payload
 */
export interface CreateEventPayload {
  project_id: string;
  title: string;
  description?: string | null;
  event_date: string;
  category_id?: string | null;
  is_milestone?: boolean;
}

/**
 * Create task payload
 */
export interface CreateTaskPayload {
  event_id: string;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
}
