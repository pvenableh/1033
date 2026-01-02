<script setup lang="ts">
import type { PermissionCategory, CrudAction } from '~/composables/useUserPermissions';

const props = defineProps<{
  /**
   * The permission category to check
   */
  category: PermissionCategory;
  /**
   * The CRUD action to check (create, read, update, delete)
   */
  action: CrudAction;
  /**
   * Show fallback slot when access is denied
   */
  fallback?: boolean;
}>();

const { hasPermission, hasFullAccess } = useUserPermissions();

const hasAccess = computed(() => {
  // Users with full access (admins, board members) always have permission
  if (hasFullAccess.value) {
    return true;
  }

  // Check granular permission
  return hasPermission(props.category, props.action);
});
</script>

<template>
  <slot v-if="hasAccess" />
  <slot v-else-if="fallback" name="fallback" />
</template>
