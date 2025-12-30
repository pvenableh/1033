import type { Role, User } from '~/types';

/**
 * Application Role Names
 * These should match the role names in your Directus instance
 */
export const APP_ROLES = {
  ADMIN: 'Administrator',
  BOARD_MEMBER: 'Board Member',
  RESIDENT: 'Resident',
  OWNER: 'Owner',
  PENDING: 'Pending',
} as const;

export type AppRoleName = (typeof APP_ROLES)[keyof typeof APP_ROLES];

/**
 * Role hierarchy for permission inheritance
 * Higher index = higher permissions
 */
const ROLE_HIERARCHY: AppRoleName[] = [
  APP_ROLES.PENDING,
  APP_ROLES.RESIDENT,
  APP_ROLES.OWNER,
  APP_ROLES.BOARD_MEMBER,
  APP_ROLES.ADMIN,
];

/**
 * Page access configuration
 * Maps route paths to required roles
 */
export const PAGE_ACCESS: Record<string, AppRoleName[]> = {
  // Admin only
  '/admin': [APP_ROLES.ADMIN],
  '/admin/users': [APP_ROLES.ADMIN],

  // Board members and above
  '/tasks': [APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/financials': [APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/financials/dashboard': [APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/financials/budget': [APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/financials/reconciliation': [APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],

  // Owners and above
  '/documents': [APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/meetings': [APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],

  // All approved users (Resident and above)
  '/dashboard': [APP_ROLES.RESIDENT, APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/account': [APP_ROLES.RESIDENT, APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/announcements': [APP_ROLES.RESIDENT, APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/requests': [APP_ROLES.RESIDENT, APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/security': [APP_ROLES.RESIDENT, APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
  '/units': [APP_ROLES.RESIDENT, APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],

  // Pending users - limited access
  '/pending': [APP_ROLES.PENDING, APP_ROLES.RESIDENT, APP_ROLES.OWNER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN],
};

/**
 * User status types
 */
export type UserStatus = 'active' | 'invited' | 'draft' | 'suspended' | 'deleted';

export interface RoleCheckResult {
  hasAccess: boolean;
  reason?: string;
}

/**
 * useRoles composable
 * Provides role-based access control utilities
 */
export function useRoles() {
  const { user } = useDirectusAuth();

  /**
   * Get the current user's role object
   */
  const userRole = computed<Role | null>(() => {
    if (!user.value) return null;

    const role = user.value.role;
    if (typeof role === 'string') {
      // Role is just an ID, return minimal role object
      return { id: role, name: '', icon: '', description: null, ip_access: [], enforce_tfa: false, admin_access: false, app_access: false, users: [] };
    }
    return role as Role;
  });

  /**
   * Get the current user's role name
   */
  const roleName = computed<string>(() => {
    return userRole.value?.name || '';
  });

  /**
   * Get the current user's role ID
   */
  const roleId = computed<string>(() => {
    if (!user.value) return '';
    return typeof user.value.role === 'string' ? user.value.role : user.value.role?.id || '';
  });

  /**
   * Check if user has admin access (Directus admin_access flag)
   */
  const isAdmin = computed<boolean>(() => {
    return userRole.value?.admin_access === true || roleName.value === APP_ROLES.ADMIN;
  });

  /**
   * Check if user is a board member
   */
  const isBoardMember = computed<boolean>(() => {
    return roleName.value === APP_ROLES.BOARD_MEMBER || isAdmin.value;
  });

  /**
   * Check if user is an owner
   */
  const isOwner = computed<boolean>(() => {
    return roleName.value === APP_ROLES.OWNER || isBoardMember.value;
  });

  /**
   * Check if user is a resident
   */
  const isResident = computed<boolean>(() => {
    return roleName.value === APP_ROLES.RESIDENT || isOwner.value;
  });

  /**
   * Check if user is pending approval
   */
  const isPending = computed<boolean>(() => {
    return roleName.value === APP_ROLES.PENDING;
  });

  /**
   * Check if user is approved (not pending)
   */
  const isApproved = computed<boolean>(() => {
    return !isPending.value && !!user.value && user.value.status === 'active';
  });

  /**
   * Check if user's account is active
   */
  const isActive = computed<boolean>(() => {
    return user.value?.status === 'active';
  });

  /**
   * Check if user has a specific role by name
   */
  function hasRole(targetRole: AppRoleName): boolean {
    return roleName.value === targetRole;
  }

  /**
   * Check if user has any of the specified roles
   */
  function hasAnyRole(targetRoles: AppRoleName[]): boolean {
    return targetRoles.includes(roleName.value as AppRoleName);
  }

  /**
   * Check if user has at least the specified role level (using hierarchy)
   */
  function hasMinimumRole(minimumRole: AppRoleName): boolean {
    if (isAdmin.value) return true;

    const userRoleIndex = ROLE_HIERARCHY.indexOf(roleName.value as AppRoleName);
    const minimumRoleIndex = ROLE_HIERARCHY.indexOf(minimumRole);

    if (userRoleIndex === -1) return false;
    return userRoleIndex >= minimumRoleIndex;
  }

  /**
   * Check if user can access a specific route
   */
  function canAccessRoute(path: string): RoleCheckResult {
    if (!user.value) {
      return { hasAccess: false, reason: 'User not authenticated' };
    }

    if (!isActive.value) {
      return { hasAccess: false, reason: 'Account is not active' };
    }

    // Admin always has access
    if (isAdmin.value) {
      return { hasAccess: true };
    }

    // Check if route has specific access rules
    const allowedRoles = PAGE_ACCESS[path];

    // If no specific rules, allow authenticated users
    if (!allowedRoles) {
      return { hasAccess: true };
    }

    // Check if user's role is in allowed roles
    if (hasAnyRole(allowedRoles)) {
      return { hasAccess: true };
    }

    return {
      hasAccess: false,
      reason: `Access restricted to: ${allowedRoles.join(', ')}`
    };
  }

  /**
   * Check route access for nested routes (matches path prefixes)
   */
  function canAccessNestedRoute(path: string): RoleCheckResult {
    // First check exact match
    const exactResult = canAccessRoute(path);
    if (exactResult.hasAccess) return exactResult;

    // Check parent paths
    const pathParts = path.split('/').filter(Boolean);
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = '/' + pathParts.slice(0, i).join('/');
      const parentResult = canAccessRoute(parentPath);
      if (PAGE_ACCESS[parentPath]) {
        return parentResult;
      }
    }

    return exactResult;
  }

  /**
   * Get redirect path for unauthorized users based on their role
   */
  function getUnauthorizedRedirect(): string {
    if (!user.value) {
      return '/auth/signin';
    }

    if (isPending.value) {
      return '/pending';
    }

    if (!isActive.value) {
      return '/auth/signin?error=account_inactive';
    }

    return '/dashboard';
  }

  /**
   * Get all roles the current user has access to manage
   * (Admins can manage all, board members can view but not change, etc.)
   */
  function getManageableRoles(): AppRoleName[] {
    if (isAdmin.value) {
      return [...ROLE_HIERARCHY];
    }
    return [];
  }

  return {
    // State
    user,
    userRole,
    roleName,
    roleId,

    // Role checks
    isAdmin,
    isBoardMember,
    isOwner,
    isResident,
    isPending,
    isApproved,
    isActive,

    // Functions
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    canAccessRoute,
    canAccessNestedRoute,
    getUnauthorizedRedirect,
    getManageableRoles,

    // Constants
    APP_ROLES,
    PAGE_ACCESS,
    ROLE_HIERARCHY,
  };
}
