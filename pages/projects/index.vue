<template>
	<div class="relative w-full min-h-screen flex items-center justify-start flex-col scroll-smooth">
		<h1 class="page__content-title">Projects</h1>
		<div class="w-full flex flex-row items-start justify-center relative">
			<p class="mt-32 uppercase text-sm tracking-wider">Coming Soon.</p>
		</div>
	</div>
</template>

<script setup>
definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

// const { data: page } = await useAsyncData('page', () => {
// 	return useDirectus(
// 		readItems('rules', {
// 			fields: ['*'],
// 		}),
// 	);
// });
</script>
<style></style>
