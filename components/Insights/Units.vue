<script setup>
function setBackgroundColor(occupant) {
	if (occupant === 'Owner') {
		return '#00BFFF';
	} else if (occupant === 'Tenant') {
		return '#00FFED';
	} else {
		return '#e8fc00';
	}
}

const {
	data: units,
	pending,
	error,
} = await useAsyncData('units', () => {
	return useDirectus(
		readItems('units', {
			fields: ['*'],
			sort: 'number',
		}),
	);
});

const occupantTotals = units.value.reduce((totals, property) => {
	const occupant = property.occupant;

	// Check if the occupant is "Owner" or "Tenant"
	if (occupant === 'Owner' || occupant === 'Tenant') {
		// Initialize the total if not present
		if (!totals[occupant]) {
			totals[occupant] = 0;
		}

		// Increment the total for the current occupant
		totals[occupant]++;
	}

	return totals;
}, {});

const labels = Object.keys(occupantTotals);
const values = Object.values(occupantTotals);
const ownershipPercentage = percentage(values[0], units.value.length);

const colors = ['#00BFFF', '#00FFED', '#e8fc00'];

const legendValues = labels.map((label) => ({
	label,
	color: label === 'Owner' ? colors[0] : colors[1],
}));

const subtitle = ownershipPercentage + '% of units are owner-occupied.';
</script>
<template>
	<div class="w-full insight units">
		<div v-if="pending">Loading</div>
		<h1 class="w-full mb-6 insight__label">Units:</h1>
		<div class="w-full flex flex-col lg:flex-row items-center justify-center">
			<div class="flex-none mb-8 lg:mb-0">
				<ChartsLegend :legendValues="legendValues" :subtitle="subtitle" />
				<ClientOnly fallback-tag="span" fallback="Loading chart...">
					<ChartsDoughnut class="units__chart" title="Units" :data="values" :labels="labels" :colors="colors" />
				</ClientOnly>
			</div>
			<div class="lg:ml-8 grid grid-cols-4 2xl:grid-cols-5 gap-6 grow w-full">
				<div class="units__unit" v-for="(unit, index) in units" :key="index">
					<h3 class="w-full uppercase text-sm border-b">
						<span class="opacity-50">Unit:</span>
						{{ unit.number }}
					</h3>
					<p class="text-xxs uppercase tracking-wide mt-1 units__unit-occupant">
						<span class="">Occupied by:</span>
						<span
							class="font-bold px-1 py-[2px]"
							:style="'background-color: ' + setBackgroundColor(unit.occupant) + ';'"
						>
							{{ unit.occupant }}
						</span>
					</p>
				</div>
			</div>
		</div>
		<div v-if="error">Error</div>
	</div>
</template>
<style>
.units {
	&__chart {
		width: 100%;
		max-width: 300px;
		margin: 0 auto;
	}

	&__unit {
		&-occupant {
			font-size: 8px;
			color: var(--black);
		}
	}
}
</style>
