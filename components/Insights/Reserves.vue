<template>
	<div class="insight reserves">
		<div v-if="pending">Loading</div>
		<h1 class="insight__label">Reserves:</h1>
		<h3 v-if="currentAmount" class="insight__title">${{ currentAmount.toLocaleString('en-US') }}</h3>
		<h5 class="insight__subtitle">
			<span class="font-bold">{{ percentage }}%</span>
			{{ percentageChange }}
		</h5>
		<ChartsLine class="reserves__chart" title="2023 Reserves" :data="amounts" :labels="labels" />
		<div class="w-full flex items-center justify-center mt-8">
			<nuxt-link to="/financials/" class="insight__link">
				View All Financials
				<UIcon name="i-heroicons-arrow-right" />
			</nuxt-link>
		</div>
		<div v-if="error">Error</div>
	</div>
</template>
<script setup>
const { readItems } = useDirectusItems();

const data = await readItems('reserves', {
	fields: ['*'],
	sort: 'date',
});

const labels = data.map((reserve) => new Date(reserve.date).toLocaleString('default', { month: 'short' }));

const amounts = data.map((reserve) =>
	reserve.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
);

const currentAmount = amounts[amounts.length - 1];

const percentage = computed(() => {
	const amount = ((currentAmount - amounts[0]) / currentAmount) * 100;
	return Math.round(amount * 100) / 100;
});

const percentageChange = computed(() => {
	if (percentage.value > 0) {
		return 'Increase Since ' + new Date(data[0].date).toLocaleString('default', { month: 'long', year: 'numeric' });
	} else {
		return 'Decrease Since ' + new Date(data[0].date).toLocaleString('default', { month: 'long', year: 'numeric' });
	}
});
</script>
<style lang="postcss">
.insight {
	&__label {
		font-size: 12px;
		line-height: 15px;
		@apply uppercase tracking-wider;
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
}

.reserves {
	&__chart {
		height: 300px;
		width: 100%;
	}
}
</style>
