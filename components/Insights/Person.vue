<script setup>
const props = defineProps({
	user: {
		type: Object,
		default: null,
	},
});

</script>
<template>
	<div class="insight person">
		<h1 class="w-full mb-6 insight__label">Units:</h1>
		<div class="person" v-for="(unit, index) in user.units" :key="index">
			<h3 class="uppercase text-sm">
				<span class="opacity-50">Unit:</span>
				{{ unit.units_id.number }}
			</h3>
			<div v-if="unit.units_id.vehicles.length > 0">
				<h3 class="uppercase text-sm"><span class="opacity-50">Vehicles:</span></h3>
				<InsightsCars v-for="(car, index) in unit.units_id.vehicles" :key="index" :car="car" />
			</div>
			<div v-if="unit.units_id.pets.length > 0">
				<h3 class="uppercase text-sm"><span class="opacity-50">Pets:</span></h3>
				<InsightsPets v-for="(pet, index) in unit.units_id.pets" :key="index" :pet="pet" />
			</div>
		</div>
	</div>
</template>
<style></style>
