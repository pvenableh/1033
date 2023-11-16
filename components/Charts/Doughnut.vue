<script lang="ts" setup>
import { Chart as ChartJS, Title, ArcElement, CategoryScale } from 'chart.js';

import { Doughnut } from 'vue-chartjs';

ChartJS.register(Title, ArcElement, CategoryScale);

const props = defineProps({
	title: {
		type: String,
		default: '',
	},
	data: {
		type: Array,
		default: () => [],
	},
	colors: {
		type: Array,
		default: () => ['#00bfff', '#ff00cc', '#e8fc00'],
	},
	labels: {
		type: Array,
		default: () => [],
	},
});

const chartData = {
	labels: props.labels,
	datasets: [
		{
			data: props.data,
			backgroundColor: props.colors,
			hoverOffset: 4,
		},
	],
};

const chartOptions = {
	responsive: true,
	cutout: '70%',
	plugins: {
		tooltip: {
			enabled: false,
		},
		legend: {
			position: 'center',
		},
		title: {
			display: false,
			text: props.title,
		},
	},
};
</script>
<template>
	<Doughnut :data="chartData" :options="chartOptions" class="w-full" />
</template>
<style scoped lang="css"></style>
