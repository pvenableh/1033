<script setup>
const props = defineProps({
	boardMember: {
		type: String,
		default: null,
	},
});
</script>
<template>
	<div class="insight board_member">
		<h1 class="insight__label">Board Member:</h1>
		<div v-if="pending">Loading</div>
		<h2 class="uppercase tracking-wide mt-4">{{ boardMember.year }} {{ boardMember.title }}</h2>
		<h3 class="uppercase tracking-wide text-xs">
			<span class="opacity-50">Appointed:</span>
			{{ getFriendlyDateTwo(boardMember.start) }}
			<span class="opacity-50">Expires:</span>
			{{ getFriendlyDateTwo(boardMember.finish) }}
		</h3>
		<div v-if="error">Error</div>
	</div>
</template>
<style>
.board_member {
	min-height: auto !important;
}
</style>
