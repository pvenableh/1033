import type { Role, User } from '~/types';

/**
 * Application Role Names (Directus Roles)
 * These define ACCESS LEVELS, not ownership/residency status
 */
export const APP_ROLES = {
  ADMIN: 'Administrator',
  BOARD_MEMBER: 'Board Member',
  MEMBER: 'Member',
  PENDING: 'Pending',
} as const;

export type AppRoleName = (typeof APP_ROLES)[keyof typeof APP_ROLES];

/**
 * People Category Types (from people.category)
 * These define RELATIONSHIP TO PROPERTY
 */
export const PEOPLE_CATEGORIES = {
  OWNER: 'Owner',
  TENANT: 'Tenant',
  PROPERTY_MANAGER: 'Property Manager',
  VENDOR: 'Vendor',
} as const;

export type PeopleCategory = (typeof PEOPLE_CATEGORIES)[keyof typeof PEOPLE_CATEGORIES];

/**
 * Role hierarchy for permission inheritance
 * Higher index = higher access level
 */
const ROLE_HIERARCHY: AppRoleName[] = [
  APP_ROLES.PENDING,
  APP_ROLES.MEMBER,
  APP_ROLES.BOARD_MEMBER,
  APP_ROLES.ADMIN,
];

/**
 * Page access configuration
 * Maps route paths to required conditions
 */
export interface AccessRule {
  roles?: AppRoleName[];
  requireOwner?: boolean;
  requireResident?: boolean;
  requireBoardMember?: boolean;
  requireAdmin?: boolean;
}

export const PAGE_ACCESS: Record<string, AccessRule> = {
  // Admin only
  '/admin': { requireAdmin: true },
  '/admin/users': { requireAdmin: true },
  '/admin/invite': { requireAdmin: true },

  // Board members and above
  '/tasks': { requireBoardMember: true },
  '/financials': { requireBoardMember: true },
  '/financials/dashboard': { requireBoardMember: true },
  '/financials/budget': { requireBoardMember: true },
  '/financials/reconciliation': { requireBoardMember: true },

  // Owners only (includes property managers acting on behalf of owners)
  '/documents': { requireOwner: true },
  '/meetings': { requireOwner: true },

  // All approved members (residents, owners, property managers)
  '/dashboard': { roles: [APP_ROLES.MEMBER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN] },
  '/account': { roles: [APP_ROLES.MEMBER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN] },
  '/announcements': { roles: [APP_ROLES.MEMBER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN] },
  '/requests': { roles: [APP_ROLES.MEMBER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN] },
  '/security': { requireResident: true },
  '/units': { roles: [APP_ROLES.MEMBER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN] },

  // Pending users - limited access
  '/pending': { roles: [APP_ROLES.PENDING, APP_ROLES.MEMBER, APP_ROLES.BOARD_MEMBER, APP_ROLES.ADMIN] },
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
 * Extended user interface with person relationship
 */
interface ExtendedUser extends User {
  person?: {
    id: number;
    category: PeopleCategory;
    is_owner?: boolean;
    is_resident?: boolean;
  } | null;
  units?: Array<{
    units_id: {
      id: number;
      number: string;
      people?: Array<{
        people_id: {
          id: number;
          category: string;
          is_owner?: boolean;
          is_resident?: boolean;
          board_member?: any[];
        };
      }>;
    };
  }>;
}

/**
 * useRoles composable
 * Provides role-based access control with ownership/residency derived from people.category
 */
export function useRoles() {
  const { user } = useDirectusAuth();

  /**
   * Get the current user's role object (Directus role)
   */
  const userRole = computed<Role | null>(() => {
    if (!user.value) return null;

    const role = user.value.role;
    if (typeof role === 'string') {
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
   * Get the linked person record (if person_id relationship exists)
   * Falls back to checking people in units by email match
   */
  const linkedPerson = computed(() => {
    const extUser = user.value as ExtendedUser | null;
    if (!extUser) return null;

    // First check for direct person_id relationship
    if (extUser.person) {
      return extUser.person;
    }

    // Fallback: Find person by matching email in units.people
    if (extUser.units) {
      for (const unit of extUser.units) {
        if (unit.units_id?.people) {
          for (const personLink of unit.units_id.people) {
            const person = personLink.people_id as any;
            if (person?.email === extUser.email) {
              return person;
            }
          }
        }
      }
    }

    return null;
  });

  /**
   * Get the person's category (Owner, Tenant, Property Manager, etc.)
   */
  const personCategory = computed<string>(() => {
    return linkedPerson.value?.category || '';
  });

  // ==================== ACCESS LEVEL CHECKS (from Directus Role) ====================

  /**
   * Check if user has admin access
   */
  const isAdmin = computed<boolean>(() => {
    return userRole.value?.admin_access === true || roleName.value === APP_ROLES.ADMIN;
  });

  /**
   * Check if user is a board member (or higher)
   */
  const isBoardMember = computed<boolean>(() => {
    if (isAdmin.value) return true;
    if (roleName.value === APP_ROLES.BOARD_MEMBER) return true;

    // Also check if person has active board_member record
    const person = linkedPerson.value as any;
    if (person?.board_member?.length > 0) {
      // Check for active board membership
      const now = new Date();
      return person.board_member.some((bm: any) => {
        if (bm.status !== 'published') return false;
        const start = bm.start ? new Date(bm.start) : null;
        const finish = bm.finish ? new Date(bm.finish) : null;
        if (start && start > now) return false;
        if (finish && finish < now) return false;
        return true;
      });
    }

    return false;
  });

  /**
   * Check if user is a member (approved, not pending)
   */
  const isMember = computed<boolean>(() => {
    return roleName.value === APP_ROLES.MEMBER || isBoardMember.value;
  });

  /**
   * Check if user is pending approval
   */
  const isPending = computed<boolean>(() => {
    return roleName.value === APP_ROLES.PENDING;
  });

  // ==================== PROPERTY RELATIONSHIP CHECKS (from people.category) ====================

  /**
   * Check if user is an owner (from people.is_owner or people.category)
   */
  const isOwner = computed<boolean>(() => {
    if (isAdmin.value) return true; // Admin has all access

    const person = linkedPerson.value as any;
    // Use is_owner boolean if available, otherwise fall back to category
    if (person?.is_owner !== undefined) {
      return person.is_owner;
    }
    return personCategory.value === PEOPLE_CATEGORIES.OWNER;
  });

  /**
   * Check if user is a tenant (from people.category)
   */
  const isTenant = computed<boolean>(() => {
    return personCategory.value === PEOPLE_CATEGORIES.TENANT;
  });

  /**
   * Check if user is a property manager (from people.category)
   */
  const isPropertyManager = computed<boolean>(() => {
    return personCategory.value === PEOPLE_CATEGORIES.PROPERTY_MANAGER;
  });

  /**
   * Check if user is a resident (from people.is_resident or derived from category)
   */
  const isResident = computed<boolean>(() => {
    if (isAdmin.value) return true; // Admin has all access

    const person = linkedPerson.value as any;
    // Use is_resident boolean if available
    if (person?.is_resident !== undefined) {
      return person.is_resident;
    }

    // Tenants are always residents
    if (isTenant.value) return true;

    // For owners, default to true unless explicitly set to false
    if (personCategory.value === PEOPLE_CATEGORIES.OWNER) return true;

    return false;
  });

  /**
   * Check if user has owner-level access (owners OR property managers)
   * Property managers can act on behalf of owners for most things
   */
  const hasOwnerAccess = computed<boolean>(() => {
    return isOwner.value || isPropertyManager.value || isBoardMember.value;
  });

  // ==================== APPROVAL STATUS CHECKS ====================

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

  // ==================== HELPER FUNCTIONS ====================

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
    const rule = PAGE_ACCESS[path];

    // If no specific rules, allow authenticated users
    if (!rule) {
      return { hasAccess: true };
    }

    // Check specific requirements
    if (rule.requireAdmin && !isAdmin.value) {
      return { hasAccess: false, reason: 'Administrator access required' };
    }

    if (rule.requireBoardMember && !isBoardMember.value) {
      return { hasAccess: false, reason: 'Board member access required' };
    }

    if (rule.requireOwner && !hasOwnerAccess.value) {
      return { hasAccess: false, reason: 'Owner access required' };
    }

    if (rule.requireResident && !isResident.value) {
      return { hasAccess: false, reason: 'Resident access required' };
    }

    // Check role-based access
    if (rule.roles && !hasAnyRole(rule.roles)) {
      return {
        hasAccess: false,
        reason: `Access restricted to: ${rule.roles.join(', ')}`
      };
    }

    return { hasAccess: true };
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
   * Get redirect path for unauthorized users
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
   * Get all roles the current user can manage
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
    linkedPerson,
    personCategory,

    // Access Level Checks (from Directus Role)
    isAdmin,
    isBoardMember,
    isMember,
    isPending,
    isApproved,
    isActive,

    // Property Relationship Checks (from people.category)
    isOwner,
    isTenant,
    isPropertyManager,
    isResident,
    hasOwnerAccess,

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
    PEOPLE_CATEGORIES,
    PAGE_ACCESS,
    ROLE_HIERARCHY,
  };
}
