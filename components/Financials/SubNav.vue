<template>
	<nav class="financials-subnav mb-6">
		<div class="flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-lg border">
			<template v-for="link in visibleLinks" :key="link.to">
				<nuxt-link
					:to="link.to"
					class="financials-subnav__link flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-wider rounded-md transition-all"
					:class="{
						'bg-background shadow-sm text-foreground': isActive(link.to),
						'text-muted-foreground hover:text-foreground hover:bg-background/50': !isActive(link.to),
					}">
					<Icon :name="link.icon" class="w-4 h-4" />
					<span class="hidden sm:inline">{{ link.label }}</span>
					<Icon v-if="link.adminOnly" name="i-heroicons-lock-closed" class="w-3 h-3 opacity-50" />
				</nuxt-link>
			</template>
		</div>
	</nav>
</template>

<script setup>
const route = useRoute();
const { isBoardMember, isOwner } = useRoles();

const canAdmin = computed(() => isBoardMember.value || isOwner.value);

const navLinks = [
	{ to: '/financials', label: 'Dashboard', icon: 'i-heroicons-chart-bar' },
	{ to: '/financials/reports', label: 'Reports', icon: 'i-heroicons-document-text' },
	{ to: '/financials/financial-analysis', label: 'Financial Analysis', icon: 'i-heroicons-presentation-chart-line' },
	{ to: '/financials/budget', label: 'Budget Overview', icon: 'i-heroicons-chart-pie' },
	{ to: '/financials/yearly-reconciliation', label: 'Year-End', icon: 'i-heroicons-calendar-days' },
	{ to: '/financials/reconciliation', label: 'Reconciliation', icon: 'i-heroicons-document-check', adminOnly: true },
	{ to: '/financials/budget-management', label: 'Budget Mgmt', icon: 'i-heroicons-calculator', adminOnly: true },
	{ to: '/financials/import-center', label: 'Import', icon: 'i-heroicons-arrow-up-tray', adminOnly: true },
];

const visibleLinks = computed(() => {
	if (canAdmin.value) return navLinks;
	return navLinks.filter((link) => !link.adminOnly);
});

const isActive = (path) => {
	if (path === '/financials') {
		return route.path === '/financials' || route.path === '/financials/';
	}
	return route.path === path || route.path.startsWith(path + '/');
};
</script>
