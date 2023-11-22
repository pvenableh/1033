<script setup>
const props = defineProps({
	user: {
		type: Object,
		default: null,
	},
});

function filterTenants(obj) {
	// Check if the object is an array
	if (Array.isArray(obj)) {
		// If it is an array, use flatMap to concatenate the results of filterTenants function applied to each item
		return obj.flatMap((item) => filterTenants(item));
	} else if (typeof obj === 'object' && obj !== null) {
		// If it is an object, check if it has a 'people_id' property with 'category' equal to 'Tenant'
		if (obj.people_id && obj.people_id.category === 'Tenant') {
			// If it does, return an array with the filtered 'people_id'
			return [obj.people_id];
		} else {
			// If it doesn't, use flatMap to concatenate the results of filterTenants function applied to its properties
			return Object.values(obj).flatMap((value) => filterTenants(value));
		}
	} else {
		// If it is neither an array nor an object, return an empty array
		return [];
	}
}

const tenants = filterTenants(props.user.units);
</script>
<template>
	<div class="insight units-summary">
		<h1 class="w-full mb-4 insight__label">Units:</h1>
		<div class="person" v-for="(unit, index) in user.units" :key="index">
			<h3 class="uppercase text-sm tracking-wide mb-4">
				<span class="opacity-50">Unit:</span>
				{{ unit.units_id.number }} is <span class="font-bold uppercase">{{ unit.units_id.occupant }}-occupied</span>
			</h3>

			<InsightsTenant v-for="(tenant, index2) in tenants" :key="index2" :tenant="tenant" />
			<div class="my-4">
				<h3 class="uppercase tracking-wide text-sm">
					<span class="opacity-50">Vehicles: </span>
					<span v-if="unit.units_id.vehicles.length === 0">No vehicles registered.</span>
				</h3>
				<div v-if="unit.units_id.vehicles.length">
					<InsightsCars v-for="(car, index3) in unit.units_id.vehicles" :key="index3" :car="car" />
				</div>
			</div>
			<div class="my-4">
				<h3 class="uppercase text-sm tracking-wide">
					<span class="opacity-50">Pets:</span>
					<span v-if="unit.units_id.pets.length === 0">No pets registered.</span>
				</h3>
				<div v-if="unit.units_id.pets.length">
					<InsightsPets v-for="(pet, index2) in unit.units_id.pets" :key="index2" :pet="pet" />
				</div>
			</div>
		</div>
	</div>
</template>
<style>
.units-summary {
	min-height: auto !important;
}
</style>
