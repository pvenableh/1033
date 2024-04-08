<template>
	<div class="max-w-3xl px-6 py-12 mx-auto space-y-8">
		<h1 class="page__content-title">Corporate Documents</h1>
		<div v-for="(file, index) in filteredData" :key="index" class="shadow border rounded p-6 mb-4 flex flex-col">
			<h5 class="uppercase tracking-wide">{{ file.title }}</h5>
			<div class="w-full flex items-center justify-center mt-4">
				<UButton :href="'https://admin.1033lenox.com/assets/' + file.id" target="_blank" class="button uppercase">
					<span class="text-black px-4">Download {{ getSubstringAfterSlash(file.type) }}</span>
				</UButton>
			</div>
		</div>
	</div>
</template>

<script setup>
// definePageMeta({
// 	layout: 'auth',
// 	middleware: ['auth'],
// });

const {
	data: page,
	pending,
	error,
} = await useAsyncData('page', () => {
	return useDirectus(readFiles());
});

const filteredData = computed(() => {
	return page.value.filter((item) => {
		if (item.tags !== null && item.tags.length > 0) {
			return item.tags.some((tag) => tag === 'corporation document');
		} else {
			return false;
		}
	});
});

function getSubstringAfterSlash(str) {
	const parts = str.split('/');
	// Remove the first part (everything before the first '/')
	// and join the rest back into a string
	return parts.slice(1).join('/');
}
</script>
