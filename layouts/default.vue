<template>
	<SidebarProvider>
		<AppSidebar />
		<SidebarInset class="overflow-x-clip">
			<LayoutHeader :links="headerLinks" />
			<div
				class="min-h-screen w-full max-w-full transition duration-300 flex items-center justify-start flex-col relative overflow-x-clip"
				:style="{
					backgroundColor: 'var(--theme-bg-primary)',
					color: 'var(--theme-text-primary)',
				}">
				<input id="nav-drawer-toggle" type="checkbox" class="hidden" />
				<div class="page-content">
					<slot />
				</div>

				<LayoutFooter :links="footerLinks" />
				<LayoutMobileToolbar :links="toolbarLinks" />
				<LayoutNavDrawer />
				<transition name="screen">
					<LayoutScreen v-if="screen" />
				</transition>
			</div>
		</SidebarInset>
	</SidebarProvider>
</template>
<script setup lang="ts">
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'

const {initTheme} = useTheme();

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

</script>
