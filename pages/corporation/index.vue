<template>
	<div class="max-w-3xl px-6 ppt-6 pb-12 mx-auto">
		<h1 class="page__content-title">Corporate Documents</h1>
		<div v-for="(file, index) in page.files" :key="index" class="shadow-lg border rounded p-6 mb-4 flex flex-col">
			<h5 class="uppercase tracking-wide text-center">{{ file.directus_files_id.title }}</h5>
			<div class="w-full flex items-center justify-center mt-4">
				<UButton
					:to="'https://admin.1033lenox.com/assets/' + file.directus_files_id.id"
					target="_blank"
					class="button uppercase test"
				>
					<span class="text-black px-4">Download {{ getSubstringAfterSlash(file.directus_files_id.type) }}</span>
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

const page = await readItems('corporation', {
	fields: ['*.*.*'],
});

function getSubstringAfterSlash(str) {
	const parts = str.split('/');
	// Remove the first part (everything before the first '/')
	// and join the rest back into a string
	return parts.slice(1).join('/');
}
</script>
