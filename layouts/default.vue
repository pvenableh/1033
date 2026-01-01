<template>
	<div
		class="min-h-screen w-full transition duration-300 flex items-center justify-start flex-col relative"
		:style="{
			backgroundColor: 'var(--theme-bg-primary)',
			color: 'var(--theme-text-primary)'
		}">
		<input id="nav-drawer-toggle" type="checkbox" class="hidden" />
		<LayoutHeader :links="headerLinks" />
		<LayoutSecondaryNav />
		<div class="page-content" :class="{ 'has-secondary-nav': showSecondaryNav }">
			<slot />
		</div>

		<LayoutFooter :links="footerLinks" />
		<LayoutMobileToolbar :links="toolbarLinks" />
		<LayoutNavButton />
		<LayoutNavDrawer :links="drawerLinks" />
		<transition name="screen">
			<LayoutScreen v-if="screen" />
		</transition>
	</div>
</template>
<script setup lang="ts">
const {initTheme} = useTheme();
const {user} = useDirectusAuth();
const {isApproved} = useRoles();

interface Link {
	name: string;
	type: string[];
	to: string;
	icon: string;
}

const props = defineProps({
	links: {
		type: Array as PropType<Link[]>,
		default: () => [],
	},
});

// Check if secondary nav should be visible (for padding adjustment)
const showSecondaryNav = computed(() => {
	return !!user.value && isApproved.value;
});

// Initialize theme on client side
onMounted(() => {
	initTheme();
});

const headerLinks = computed(() => {
	const filtered = props.links.filter((link) => link.type.includes('header'));
	return filtered;
});

const footerLinks = computed(() => {
	const filtered = props.links.filter((link) => link.type.includes('footer'));
	return filtered;
});

const toolbarLinks = computed(() => {
	const filtered = props.links.filter((link) => link.type.includes('toolbar'));
	return filtered;
});

const drawerLinks = computed(() => {
	const filtered = props.links.filter((link) => link.type.includes('drawer'));
	return filtered;
});
</script>
