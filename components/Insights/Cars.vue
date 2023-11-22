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
			class="w-10 h-10 rounded-full bg-no-repeat bg-center bg-contain bg-black car__image"
			:style="'background-image: url(https://admin.1033lenox.com/assets/' + car.image + '?key=small)'"
		></div>
		<div class="text-xs uppercase ml-4 pl-2 car__stats">
			<h3>{{ car.make }} {{ car.model }}</h3>
			<h5>License plate: {{ car.license_plate }}</h5>
		</div>
	</div>
</template>
<style></style>
