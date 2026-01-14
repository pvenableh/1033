<script setup lang="ts">
const links = ref([
	{
		name: 'Home',
		type: ['footer', 'toolbar', 'drawer'],
		to: '/',
		icon: 'i-heroicons-home',
	},
	{
		name: 'Meetings',
		type: ['footer', 'drawer'],
		to: '/meetings',
		icon: 'i-heroicons-identification',
	},
	{
		name: 'Announcements',
		type: ['footer', 'toolbar', 'drawer'],
		to: '/announcements',
		icon: 'i-heroicons-identification',
	},
	{
		name: 'Projects',
		type: ['footer', 'drawer'],
		to: '/projects',
		icon: 'i-heroicons-identification',
	},
	{
		name: 'Rules / Regulations',
		type: ['footer', 'drawer'],
		to: '/rules-regulations',
		icon: 'i-heroicons-identification',
	},
	{
		name: 'By-Laws',
		type: ['footer', 'drawer'],
		to: '/documents',
		icon: 'i-heroicons-identification',
	},
	{
		name: 'Dashboard',
		type: ['footer', 'drawer'],
		to: '/dashboard',
		icon: 'i-heroicons-squares-2x2',
	},
]);
import {Toaster} from '@/components/ui/sonner';
</script>
<template>
	<NuxtLayout :links="links">
		<NuxtPage />
	</NuxtLayout>
	<NuxtLoadingIndicator
		color="repeating-linear-gradient(to right,#FF99DD
    0%,#94a3b8 100%)" />
	<!-- <UNotifications /> -->
	<Toaster />
</template>
<style>
@reference "~/assets/css/tailwind.css";
.page-content {
	transition: all 0.25s var(--curve);
	overflow: hidden;
	@media (min-width: theme('screens.md')) {
		overflow: visible;
	}
	@apply w-full;
	.nuxt-page {
		min-height: calc(90vh - 100px);
		z-index: 5;
		position: relative;
	}
}
</style>
