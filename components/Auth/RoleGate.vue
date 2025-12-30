<script setup lang="ts">
import type { AppRoleName } from '~/composables/useRoles';

const props = defineProps<{
  /**
   * Single role or array of roles that are allowed to see this content
   */
  roles?: AppRoleName | AppRoleName[];
  /**
   * Minimum role level required (uses hierarchy)
   */
  minimumRole?: AppRoleName;
  /**
   * Require admin access specifically
   */
  requireAdmin?: boolean;
  /**
   * Require board member access or higher
   */
  requireBoardMember?: boolean;
  /**
   * Show content only if user is approved (not pending)
   */
  requireApproved?: boolean;
  /**
   * Fallback slot name to render when access is denied
   */
  fallback?: boolean;
}>();

const {
  isAdmin,
  isBoardMember,
  isApproved,
  hasRole,
  hasAnyRole,
  hasMinimumRole,
} = useRoles();

const hasAccess = computed(() => {
  // Admin always has access
  if (isAdmin.value) return true;

  // Check specific requirements
  if (props.requireAdmin) {
    return isAdmin.value;
  }

  if (props.requireBoardMember) {
    return isBoardMember.value;
  }

  if (props.requireApproved && !isApproved.value) {
    return false;
  }

  // Check minimum role
  if (props.minimumRole) {
    return hasMinimumRole(props.minimumRole);
  }

  // Check specific roles
  if (props.roles) {
    const roleArray = Array.isArray(props.roles) ? props.roles : [props.roles];
    return hasAnyRole(roleArray);
  }

  // If no specific requirements, allow access
  return true;
});
</script>

<template>
  <slot v-if="hasAccess" />
  <slot v-else-if="fallback" name="fallback" />
</template>
