<script setup lang="ts">
const links = ref([
	{
		name: 'Home',
		type: ['footer', 'toolbar', 'drawer'],
		to: '/',
		icon: 'i-heroicons-home',
	},
	{
		// Points at the public /board-meetings page for now. The resident-only
		// /meetings page still exists and is unchanged.
		name: 'Meetings',
		type: ['footer', 'drawer'],
		to: '/board-meetings',
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

/*
 * Site-wide SEO defaults.
 *
 * Set at the app root so every page inherits them; any page that calls
 * useSeoMeta() with its own ogImage/description overrides these, because
 * unhead resolves deeper entries last.
 */
const defaultOgImage = String(useRuntimeConfig().public.defaultOgImage);

useSeoMeta({
	ogImage: defaultOgImage,
	ogImageAlt: '1033 Lenox — boutique condo building in Miami Beach',
	ogImageWidth: 1200,
	ogImageHeight: 630,
	twitterCard: 'summary_large_image',
	twitterImage: defaultOgImage,
	ogSiteName: '1033 Lenox',
	ogLocale: 'en_US',
});

/*
 * Only append the brand when the title doesn't already carry it. The default
 * template appended it unconditionally, so pages whose title ends in the brand
 * rendered it twice — the home page read "1033 Lenox | … | 1033 Lenox".
 */
useHead({
	titleTemplate: (title?: string) => {
		if (!title) return '1033 Lenox';
		return title.includes('1033 Lenox') ? title : `${title} | 1033 Lenox`;
	},
});
</script>
<template>
	<NuxtLayout :links="links">
		<NuxtPage />
	</NuxtLayout>
	<NuxtLoadingIndicator
		color="repeating-linear-gradient(to right,#b89a5f
    0%,#00efd1 100%)" />
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
