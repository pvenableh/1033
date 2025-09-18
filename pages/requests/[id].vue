<template>
	<div class="relative w-full min-h-screen flex items-center justify-start flex-col scroll-smooth">
		<h1 class="page__content-title">1033 Lenox Request</h1>
		<div class="w-full flex items-center justify-center flex-col relative mx-auto">
			<div
				class="w-full flex flex-col items-start justify-between border border-gray-100 shadow-lg p-6 mb-12 mx-6 request">
				<h5 class="w-full uppercase tracking-wide mb-2">
					<span class="opacity-50 text-gray-500">Name:</span>
					{{ request.name }}
					<a
						:href="'mailto:' + request.email"
						class="w-8 h-8 inline-flex items-center justify-center ml-2 border border-gray-400 rounded-full p-1">
						<UIcon name="i-heroicons-envelope" class="w-4 h-4" />
					</a>
				</h5>
				<h5 class="w-full uppercase tracking-wide mb-2">
					<span class="opacity-50 text-gray-500">Subject:</span>
					{{ request.subject }} {{ request.category }}
				</h5>
				<div class="w-full flex flex-col">
					<span class="uppercase tracking-wide opacity-50 text-gray-500">Description:</span>

					<div v-html="request.description" class="w-full request__description"></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
const {params} = useRoute();

const {readItem} = useDirectusItems();

const request = await readItem('requests', params.id, {
	fields: ['*'],
});
</script>
<style>
.request {
	max-width: 900px;
	&__description {
		img {
			@apply max-w-full;
		}
	}
}
</style>
