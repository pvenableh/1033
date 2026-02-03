<script setup>
// definePageMeta({
// 	layout: 'email',
// });

// const { gtag } = useGtag();
import {useImage} from '@vueuse/core';
const {readFiles} = useDirectusFiles();

useHead({
	title: '1033 Lenox | Before & After — Miami Beach Condo Renovation',
	meta: [
		{
			name: 'description',
			content: 'See the before and after renovation photos of 1033 Lenox, a fully renovated boutique condo building in Miami Beach.',
		},
	],
});

const images = await readFiles({
	filter: {
		type: {
			_contains: 'image',
		},
		type: {
			_ncontains: 'heic',
		},
		folder: {
			_eq: 'bb79dc04-20bc-444a-b790-ce74cfde9be4',
		},
	},
});
</script>
<template>
	<div class="flex items-center justify-center flex-col w-full feed">
		<div class="w-full mb-12 max-w-[500px] lg:max-w-[1000px] px-2 lg:px-0 renderings__intro">
			<h1 class="text-3xl lg:text-5xl uppercase font-bold text-center mt-10 mb-8 lg:mt-12">Before and After</h1>
		</div>
		<div class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			<div
				v-for="image in images"
				:key="image.id"
				class="masonry-item bg-gray-200 bg-center bg-cover bg-no-repeat"
				:style="'background-image: url(https://admin.1033lenox.com/assets/' + image.id + '?key=medium)'"
				alt="1033 Lenox Design "></div>
		</div>
		<div class="w-full flex items-center justify-center py-12">
			<NuxtLink
				to="/"
				class="text-sm tracking-[0.15em] uppercase hover:underline transition-colors duration-200">
				← Back to 1033 Lenox — Boutique Apartment Building in Miami Beach
			</NuxtLink>
		</div>
	</div>
</template>
<style scoped>
.feed {
	.grid {
		grid-auto-rows: 1fr;
	}

	.masonry-item {
		min-height: 250px;
		grid-row-end: span 3;
		@media (min-width: theme('screens.xl')) {
			min-height: 300px;
		}
	}
	.masonry-item:nth-of-type(2n + 1) {
		grid-row-end: span 2;
		@media (min-width: theme('screens.lg')) {
			grid-row-end: span 3;
		}
	}
	.masonry-item:nth-of-type(3n + 1) {
		@media (min-width: theme('screens.lg')) {
			grid-row-end: span 2;
		}
	}
}
</style>
