<script setup lang="ts">
import type { DirectusUser } from '~/types/directus';

const props = defineProps<{
	user: DirectusUser;
}>();

const { isOwner, isTenant, isBoardMember, isAdmin, hasOwnerAccess } = useRoles();

/**
 * Determine which dashboard to show based on user's role and permissions
 * Priority:
 * 1. Owners, Board Members, Admins, Property Managers -> Owner Dashboard (full access)
 * 2. Tenants -> Tenant Dashboard (unit-focused)
 * 3. All others -> Member Dashboard (basic access)
 */
const dashboardType = computed(() => {
	// Admins, board members, and owners get the full owner dashboard
	if (isAdmin.value || isBoardMember.value || hasOwnerAccess.value) {
		return 'owner';
	}

	// Tenants get the tenant-specific dashboard
	if (isTenant.value) {
		return 'tenant';
	}

	// Default to member dashboard for basic members
	return 'member';
});
</script>

<template>
	<div>
		<!-- Owner Dashboard: Full access with all widgets -->
		<DashboardOwner v-if="dashboardType === 'owner'" :user="user" />

		<!-- Tenant Dashboard: Unit and lease focused -->
		<DashboardTenant v-else-if="dashboardType === 'tenant'" :user="user" />

		<!-- Member Dashboard: Basic information -->
		<DashboardMember v-else :user="user" />
	</div>
</template>

<style>
@reference "~/assets/css/tailwind.css";

.insight {
	@media (min-width: theme('screens.lg')) {
		min-height: 300px;
	}
}

.insight__label {
	font-size: 12px;
	line-height: 15px;
	@apply uppercase tracking-wider border-b;
}

.insight__title {
	font-size: 48px;
	background: linear-gradient(75deg, var(--pink), var(--purple));
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	@apply font-bold;
}

.insight__subtitle {
	font-size: 12px;
	line-height: 15px;
	@apply uppercase tracking-wider mb-6;
}

.insight__link {
	font-size: 12px;
	line-height: 15px;
	/* color: var(--white);
	background: var(--blue); */
	@apply font-bold uppercase tracking-wider px-6 py-2;

	span {
		margin-bottom: -2px;
		@apply inline-block;
	}
}

.insight__button {
	font-size: 10px;
	line-height: 14px;
	color: var(--white);
	background: var(--grey);
	@apply font-bold uppercase tracking-wider px-4 py-1 rounded-xl;

	span {
		margin-bottom: -2px;
		@apply inline-block;
	}
}
</style>
