<template>
	<div class="grid grid-flow-row-dense grid-cols-2 gap-x-4 gap-y-12 lg:gap-y-20 lg:gap-x-10 dashboard">
		<div class="col-span-2 mt-8">
			<h2 class="text-3xl">
				{{ greetUser() }}
				<span class="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-600 font-bold">
					{{ user.first_name }}
				</span>
				.
			</h2>
			<p v-if="user.units.length">
				Your unit
				<span class="font-bold">{{ user.units[0].units_id.number }}</span>
				is
				<span class="font-bold lowercase">{{ user.units[0].units_id.occupant }}-occupied</span>
				.
			</p>
			<p v-if="user.units[0].units_id.vehicles">
				You have
				<span class="font-bold">{{ user.units[0].units_id.vehicles.length }}</span>
				vehicle
				<span v-if="user.units[0].units_id.vehicles.length !== 1">s</span>
				and
				<span class="font-bold">{{ user.units[0].units_id.pets.length }}</span>
				pet
				<span v-if="user.units[0].units_id.pets.length !== 1">s</span>
				registered with the community.
			</p>
		</div>
		<InsightsReserves class="col-span-2 lg:col-span-1" />
		<InsightsNewsletter class="col-span-2 lg:col-span-1" />
		<InsightsMeetings class="col-span-2 lg:col-span-1" />
		<InsightsAnnouncements class="col-span-2 lg:col-span-1" />
		<InsightsBoard class="col-span-2" />
		<InsightsUnits class="col-span-2" />
	</div>
</template>
<script setup>
const props = defineProps({
	user: {
		type: Object,
		default: null,
	},
});
</script>
<style>
.insight {
	@media (min-width: theme('screens.lg')) {
		min-height: 300px;
	}

	&__label {
		font-size: 12px;
		line-height: 15px;
		@apply uppercase tracking-wider border-b;
	}

	&__title {
		font-size: 48px;
		background: linear-gradient(75deg, var(--pink), var(--purple));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		@apply font-bold;
	}

	&__subtitle {
		font-size: 12px;
		line-height: 15px;
		@apply uppercase tracking-wider mb-6;
	}

	&__link {
		font-size: 12px;
		line-height: 15px;
		color: var(--white);
		background: var(--blue);
		@apply font-bold uppercase tracking-wider px-6 py-2 rounded-3xl;

		span {
			margin-bottom: -2px;
			@apply inline-block;
		}
	}

	&__button {
		font-size: 10px;
		line-height: 14px;
		color: var(--white);
		background: var(--grey);
		@apply font-bold uppercase tracking-wider px-4 py-1 rounded-xl;

		span {
			margin-bottom: -2px;
			@apply inline-block;
		}
	}
}
</style>
