<template>
	<div class="relative w-full min-h-screen flex items-center justify-center flex-col scroll-smooth documents">
		<h1 class="page__content-title">By-Laws
		</h1>
		<div class="w-full flex flex-row items-start justify-center relative">
			<div class="sticky flex flex-col items-start flex-shrink uppercase mr-10 text-right page__nav">
				<h5 class="uppercase text-xs opacity-25 tracking-wider font-bold w-full mb-4">Sections</h5>
				<a href="#one">Identity</a>
				<a href="#two">Members</a>
				<a href="#three">Members' Meeting</a>
				<a href="#four">Directors</a>
				<a href="#five">Officers</a>
				<a href="#six">Fiscal Management</a>
				<a href="#seven">Parlimentary Rules</a>
				<a href="#eight">Developer</a>
				<a href="#nine">Amendment</a>
			</div>
			<div v-if="doc.document" v-html="doc.document"
				class="pr-4 pl-4 lg:pl-10 w-full flex-grow scroll-smooth page__content-body by-laws"></div>

		</div>
	</div>
</template>

<script setup>
definePageMeta({
	middleware: ['auth'],
});

const doc = ref(null);

const {
	data: page,
	pending,
	error
} = await useAsyncData('page', () => {
	return useDirectus(
		readItems('by_laws', {
			fields: ['*'],
		}),
	);
});

doc.value = page.value;
</script>
<style >


</style>
