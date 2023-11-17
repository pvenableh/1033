<template>
	<div class="relative w-full min-h-screen flex items-center justify-center flex-col scroll-smooth">
		<h1 class="page__content-title">Rules / Regulations</h1>
		<div class="w-full flex flex-row items-start justify-center relative">
			<div class="sticky flex flex-col items-start flex-shrink uppercase mr-10 text-right page__nav">
				<h5 class="uppercase text-xs opacity-25 tracking-wider font-bold w-full mb-4">Sections</h5>
				<a v-for="(rule, index) in page" :key="index" :href="'#' + rule.url">{{ rule.title }}</a>
			</div>
			<div class="pr-4 pl-4 lg:pl-10 w-full flex-grow scroll-smooth page__content-body rules">
				<div v-for="(rule, index) in page" :key="index" class="mb-20">
					<h3 :id="rule.url" class="border-b w-full">{{ rule.title }}</h3>
					<div v-html="rule.description"></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
definePageMeta({
	middleware: ['auth'],
});

const { data: page } = await useAsyncData('page', () => {
	return useDirectus(
		readItems('rules', {
			fields: ['*'],
		}),
	);
});
</script>
<style></style>
