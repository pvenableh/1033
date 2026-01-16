<template>
	<div class="relative w-full min-h-screen flex items-center justify-start flex-col scroll-smooth">
		<h1 class="page__content-title">Task Details</h1>
		<div class="w-full flex flex-col items-center justify-center relative">
			<p class="mt-32 uppercase text-sm tracking-wider">Coming Soon.</p>
			<p class="mt-4 text-xs text-gray-500">Task ID: {{ route.params.id }}</p>
			<NuxtLink to="/tasks" class="mt-8 text-primary hover:underline">
				&larr; Back to Tasks
			</NuxtLink>
		</div>
	</div>
</template>

<script setup>
const route = useRoute();

definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});
</script>
