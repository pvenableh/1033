<script setup>
const props = defineProps({
	pet: {
		type: Object,
		default: null,
	},
});
</script>
<template>
	<div class="flex flex-row pet">
		<div
			class="w-20 h-20 bg-no-repeat bg-center bg-contain bg-black pet__image"
			:style="'background-image: url(https://admin.1033lenox.com/assets/' + pet.image + '?key=medium)'"
		></div>
		<div class="text-xs uppercase ml-4 border-l pl-2 pet__stats">
			<h3>{{ pet.category }}{{ pet.name }}</h3>
			<h5 v-if="pet.breed">Breed: {{ pet.breed }}</h5>
		</div>
	</div>
</template>
<style></style>
