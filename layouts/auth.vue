<script setup lang="ts">
definePageMeta({
	middleware: ['auth'],
});

interface Link {
	name: string;
	type: string[];
	to: string;
	icon: string;
	auth: boolean;
}

const props = defineProps({
	links: {
		type: Array as PropType<Link[]>,
		default: () => [],
	},
});

const headerLinks = props.links.filter((link) => link.type.includes('header'));
const footerLinks = props.links.filter((link) => link.type.includes('footer'));
const toolbarLinks = props.links.filter((link) => link.type.includes('toolbar'));
const drawerLinks = props.links.filter((link) => link.type.includes('drawer'));

const isModalOpen = ref(false);

const handleRequestSubmitted = () => {
	isModalOpen.value = false;
	// You can add additional handling here if needed
};
</script>
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
		<!-- Floating Action Butto
		<UButton
			icon="i-heroicons-wrench-screwdriver"
			size="lg"
			color="primary"
			class="fixed bottom-6 right-6 rounded-full shadow-lg z-50"
			@click="isModalOpen = true"
		>
			Maintenance Request
		</UButton> -->

		<!-- Maintenance Request Modal -->
		<UModal v-model="isModalOpen" :ui="{width: 'max-w-3xl'}">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-xl font-semibold">Submit Maintenance Request</h3>
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-x-mark"
							class="-my-1"
							@click="isModalOpen = false" />
					</div>
				</template>

				<Request @submitted="handleRequestSubmitted" />
			</UCard>
		</UModal>
	</div>
</template>

<style></style>
