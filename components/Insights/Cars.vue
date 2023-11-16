<script setup>
const props = defineProps({
	car: {
		type: Object,
		default: null,
	},
});
</script>
<template>
	<div class="flex flex-row car">
		<div
			class="w-20 h-20 bg-no-repeat bg-center bg-contain bg-black car__image"
			:style="'background-image: url(https://admin.1033lenox.com/assets/' + car.image + '?key=medium)'"
		></div>
		<div class="text-xs uppercase ml-4 border-l pl-2 car__stats">
			<h3>{{ car.make }} {{ car.model }}</h3>
			<h5>License plate: {{ car.license_plate }}</h5>
		</div>
	</div>
</template>
<style></style>
