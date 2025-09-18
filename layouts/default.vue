<template>
	<div
		class="dark:bg-gray-800 dark:text-white min-h-screen w-full transition duration-150 bg-white flex items-center justify-start flex-col relative">
		<input id="nav-drawer-toggle" type="checkbox" class="hidden" />
		<LayoutHeader :links="headerLinks" />
		<div class="page-content">
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
