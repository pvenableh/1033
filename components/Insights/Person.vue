<script setup>
const props = defineProps({
	user: {
		type: Object,
		default: null,
	},
});

// const tenant = computed(() => {
// 	return props.user.units.filter((unit) => {
// 		console.log(unit);
// 		return unit.units_id.category;
// 	});
// });
</script>
<template>
	<div class="insight units-summary">
		<h1 class="w-full mb-4 insight__label">Units:</h1>
		<div class="person" v-for="(unit, index) in user.units" :key="index">
			<h3 class="uppercase text-sm">
				<span class="opacity-50">Unit:</span>
				{{ unit.units_id.number }}
			</h3>
			<span class="font-bold uppercase">{{ unit.units_id.occupant }}-occupied</span>
			<!-- <div v-if="tenant">
				{{ tenant  }}
			</div> -->
			<h3 class="uppercase text-sm">
				<span class="opacity-50">Vehicles:</span>
				<span v-if="unit.units_id.vehicles.length === 0">No vehicles registered.</span>
			</h3>
			<div v-if="unit.units_id.vehicles.length">
				<InsightsCars v-for="(car, index) in unit.units_id.vehicles" :key="index" :car="car" />
			</div>
			<h3 class="uppercase text-sm">
				<span class="opacity-50">Pets:</span>
				<span v-if="unit.units_id.pets.length === 0">No pets registered.</span>
			</h3>
			<div v-if="unit.units_id.pets.length">
				<InsightsPets v-for="(pet, index2) in unit.units_id.pets" :key="index2" :pet="pet" />
			</div>
		</div>
	</div>
</template>
<style>
.units-summary {
	min-height: auto !important;
}
</style>
