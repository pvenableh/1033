import type { UserPermission } from '~/types/directus';

/**
 * Permission categories that can be controlled granularly
 */
export const PERMISSION_CATEGORIES = {
  PROJECTS: 'projects',
  CHANNELS: 'channels',
  FINANCIALS: 'financials',
  ANNOUNCEMENTS: 'announcements',
  MEETINGS: 'meetings',
  DOCUMENTS: 'documents',
  UNITS: 'units',
  REQUESTS: 'requests',
  VENDORS: 'vendors',
} as const;

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[keyof typeof PERMISSION_CATEGORIES];

/**
 * Approval categories for items that require board approval
 */
export const APPROVAL_CATEGORIES = {
  PETS: 'pets',
  VEHICLES: 'vehicles',
  LEASES: 'leases',
} as const;

export type ApprovalCategory = (typeof APPROVAL_CATEGORIES)[keyof typeof APPROVAL_CATEGORIES];

/**
 * CRUD actions
 */
export const CRUD_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type CrudAction = (typeof CRUD_ACTIONS)[keyof typeof CRUD_ACTIONS];

/**
 * Permission category metadata for UI display
 */
export const PERMISSION_CATEGORY_META: Record<PermissionCategory, { label: string; icon: string; description: string }> = {
  projects: {
    label: 'Projects',
    icon: 'i-heroicons-folder',
    description: 'Project timelines, events, and tasks',
  },
  channels: {
    label: 'Channels',
    icon: 'i-heroicons-chat-bubble-left-right',
    description: 'Communication channels and messages',
  },
  financials: {
    label: 'Financials',
    icon: 'i-heroicons-banknotes',
    description: 'Accounts, transactions, budgets, and statements',
  },
  announcements: {
    label: 'Announcements',
    icon: 'i-heroicons-megaphone',
    description: 'Community announcements and newsletters',
  },
  meetings: {
    label: 'Meetings',
    icon: 'i-heroicons-calendar-days',
    description: 'Board meetings and presentations',
  },
  documents: {
    label: 'Documents',
    icon: 'i-heroicons-document-text',
    description: 'By-laws, assessments, and corporate documents',
  },
  units: {
    label: 'Units & People',
    icon: 'i-heroicons-home',
    description: 'Unit information, residents, and directory',
  },
  requests: {
    label: 'Requests',
    icon: 'i-heroicons-inbox',
    description: 'Maintenance and support requests',
  },
  vendors: {
    label: 'Vendors',
    icon: 'i-heroicons-building-storefront',
    description: 'Vendor contacts and information',
  },
};

/**
 * Approval category metadata for UI display
 */
export const APPROVAL_CATEGORY_META: Record<ApprovalCategory, { label: string; icon: string; description: string }> = {
  pets: {
    label: 'Pets',
    icon: 'i-heroicons-heart',
    description: 'Approve or reject pet registrations',
  },
  vehicles: {
    label: 'Vehicles',
    icon: 'i-heroicons-truck',
    description: 'Approve or reject vehicle registrations',
  },
  leases: {
    label: 'Leases',
    icon: 'i-heroicons-document-check',
    description: 'Approve or reject lease submissions',
  },
};

/**
 * Composable for managing granular user permissions
 */
export function useUserPermissions() {
  const { user } = useDirectusAuth();
  const { isAdmin, isBoardMember, linkedPerson } = useRoles();

  // State for user permissions
  const permissions = ref<UserPermission | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch permissions for the current user
   */
  async function fetchPermissions() {
    if (!linkedPerson.value?.id) {
      permissions.value = null;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<UserPermission[]>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'user_permissions',
          operation: 'search',
          query: {
            filter: {
              person_id: { _eq: linkedPerson.value.id },
              status: { _eq: 'published' },
            },
            limit: 1,
          },
        },
      });

      permissions.value = response?.[0] || null;
    } catch (err: any) {
      console.error('Failed to fetch user permissions:', err);
      error.value = err?.message || 'Failed to fetch permissions';
      permissions.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Check if user has a specific permission
   * Admins always have all permissions
   * Board members have all permissions by default unless explicitly denied
   */
  function hasPermission(category: PermissionCategory, action: CrudAction): boolean {
    // Admins always have all permissions
    if (isAdmin.value) {
      return true;
    }

    // Board members have all permissions by default
    if (isBoardMember.value) {
      return true;
    }

    // Check granular permissions
    if (!permissions.value) {
      return false;
    }

    const key = `${category}_${action}` as keyof UserPermission;
    return permissions.value[key] === true;
  }

  /**
   * Check if user can create items in a category
   */
  function canCreate(category: PermissionCategory): boolean {
    return hasPermission(category, CRUD_ACTIONS.CREATE);
  }

  /**
   * Check if user can read items in a category
   */
  function canRead(category: PermissionCategory): boolean {
    return hasPermission(category, CRUD_ACTIONS.READ);
  }

  /**
   * Check if user can update items in a category
   */
  function canUpdate(category: PermissionCategory): boolean {
    return hasPermission(category, CRUD_ACTIONS.UPDATE);
  }

  /**
   * Check if user can delete items in a category
   */
  function canDelete(category: PermissionCategory): boolean {
    return hasPermission(category, CRUD_ACTIONS.DELETE);
  }

  /**
   * Check if user can approve items in an approval category
   * Admins always have approval permissions
   * Board members have approval permissions by default
   * Others need explicit approval permission
   */
  function canApprove(category: ApprovalCategory): boolean {
    // Admins always have all permissions
    if (isAdmin.value) {
      return true;
    }

    // Board members have all permissions by default
    if (isBoardMember.value) {
      return true;
    }

    // Check granular approval permissions
    if (!permissions.value) {
      return false;
    }

    const key = `${category}_approve` as keyof UserPermission;
    return permissions.value[key] === true;
  }

  /**
   * Get approval permissions summary
   */
  const approvalSummary = computed(() => {
    const summary: Record<ApprovalCategory, boolean> = {} as any;

    for (const category of Object.values(APPROVAL_CATEGORIES)) {
      summary[category] = canApprove(category);
    }

    return summary;
  });

  /**
   * Get all permissions for a category
   */
  function getCategoryPermissions(category: PermissionCategory): Record<CrudAction, boolean> {
    return {
      create: canCreate(category),
      read: canRead(category),
      update: canUpdate(category),
      delete: canDelete(category),
    };
  }

  /**
   * Get a summary of all permissions
   */
  const permissionSummary = computed(() => {
    const summary: Record<PermissionCategory, Record<CrudAction, boolean>> = {} as any;

    for (const category of Object.values(PERMISSION_CATEGORIES)) {
      summary[category] = getCategoryPermissions(category);
    }

    return summary;
  });

  /**
   * Check if user has any granular permissions set
   */
  const hasGranularPermissions = computed(() => {
    return permissions.value !== null;
  });

  /**
   * Check if user has full access (admin or board member)
   */
  const hasFullAccess = computed(() => {
    return isAdmin.value || isBoardMember.value;
  });

  // Fetch permissions when person changes
  watch(
    () => linkedPerson.value?.id,
    () => {
      if (linkedPerson.value?.id) {
        fetchPermissions();
      } else {
        permissions.value = null;
      }
    },
    { immediate: true }
  );

  return {
    // State
    permissions,
    loading,
    error,

    // Methods
    fetchPermissions,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canApprove,
    getCategoryPermissions,

    // Computed
    permissionSummary,
    approvalSummary,
    hasGranularPermissions,
    hasFullAccess,

    // Constants
    PERMISSION_CATEGORIES,
    APPROVAL_CATEGORIES,
    CRUD_ACTIONS,
    PERMISSION_CATEGORY_META,
    APPROVAL_CATEGORY_META,
  };
}

/**
 * Helper type for permission check results
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Create a permission guard for components
 */
export function usePermissionGuard(category: PermissionCategory, action: CrudAction) {
  const { hasPermission, hasFullAccess } = useUserPermissions();

  const isAllowed = computed(() => hasPermission(category, action));

  const checkResult = computed<PermissionCheckResult>(() => {
    if (hasFullAccess.value) {
      return { allowed: true };
    }

    if (isAllowed.value) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `You don't have permission to ${action} ${category}`,
    };
  });

  return {
    isAllowed,
    checkResult,
  };
}
