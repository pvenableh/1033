<template>
	<nav class="financials-subnav mb-6">
		<div class="flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-lg border">
			<nuxt-link
				v-for="link in navLinks"
				:key="link.to"
				:to="link.to"
				class="financials-subnav__link flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-wider rounded-md transition-all"
				:class="{
					'bg-background shadow-sm text-foreground': isActive(link.to),
					'text-muted-foreground hover:text-foreground hover:bg-background/50': !isActive(link.to),
				}">
				<Icon :name="link.icon" class="w-4 h-4" />
				<span class="hidden sm:inline">{{ link.label }}</span>
			</nuxt-link>
		</div>
	</nav>
</template>

<script setup>
const route = useRoute();

const navLinks = [
	{ to: '/financials', label: 'Transactions', icon: 'i-heroicons-currency-dollar' },
	{ to: '/financials/dashboard', label: 'Dashboard', icon: 'i-heroicons-chart-bar' },
	{ to: '/financials/reconciliation', label: 'Reconciliation', icon: 'i-heroicons-document-check' },
	{ to: '/financials/budget-management', label: 'Budgets', icon: 'i-heroicons-calculator' },
	{ to: '/financials/budget', label: 'Budget Overview', icon: 'i-heroicons-chart-pie' },
	{ to: '/financials/yearly-reconciliation', label: 'Year-End', icon: 'i-heroicons-calendar-days' },
	{ to: '/financials/import-center', label: 'Import', icon: 'i-heroicons-arrow-up-tray' },
];

const isActive = (path) => {
	if (path === '/financials') {
		return route.path === '/financials' || route.path === '/financials/';
	}
	return route.path === path || route.path.startsWith(path + '/');
};
</script>
