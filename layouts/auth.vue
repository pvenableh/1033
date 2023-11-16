<script setup lang="ts"></script>
<template>
	<div class="min-h-screen w-full transition duration-150 bg-white flex items-center justify-start flex-col relative">
		<input id="nav-drawer-toggle" type="checkbox" class="hidden" />
		<div class="w-full flex items-center justify-center flex-col min-h-screen page__content">
			<LayoutHeader />
			<h1 class="uppercase tracking-wide text-xs">Authorized</h1>
			<div class="w-full mx-auto min-h-screen relative px-4 md:px-6">
				<slot />
			</div>
			<LayoutFooter />
		</div>
		<transition name="screen">
			<LayoutScreen v-if="screen" />
		</transition>
		<LayoutNavDrawer />
	</div>
</template>
