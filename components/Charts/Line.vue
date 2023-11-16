<script lang="ts" setup>
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
} from 'chart.js';
import { Line } from 'vue-chartjs';

// Register
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip);

const props = defineProps({
	title: {
		type: String,
		default: '',
	},
	data: {
		type: Array,
		default: () => [],
	},
	labels: {
		type: Array,
		default: () => [],
	},
});



function getGradient(ctx, chartArea) {
	let width, height, gradient;
	const chartWidth = chartArea.right - chartArea.left;
	const chartHeight = chartArea.bottom - chartArea.top;

	if (!gradient || width !== chartWidth || height !== chartHeight) {
		width = chartWidth;
		height = chartHeight;
		gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
		gradient.addColorStop(0, '#00bfff');
		// gradient.addColorStop(0.5, '#ff005c');
		gradient.addColorStop(1, '#ff00cc');
	}

	return gradient;
}

const chartData = ref({
	labels: props.labels,
	datasets: [
		{
			label: props.title,
			tension: 0.3,
			pointRadius: 0,
			// backgroundColor: '#f87979',
			borderColor: function (context) {
				const chart = context.chart;
				const { ctx, chartArea } = chart;

				if (!chartArea) {
					// This case happens on initial chart load
					return;
				}
				return getGradient(ctx, chartArea);
			},
			data: props.data,
		},
	],
});

const chartOptions = ref({
	height: "200px",
	responsive: true,
	maintainAspectRatio: true,
	borderColor: "#c319ee",
	backgroundColor: "#c319ee",
	scales: {
		y: {
			ticks: {
				color: "#cccccc",
				callback: function (value, index, ticks) {
					return '$' + value;
				}
			},
			grid: {
				drawTicks: false,
			},
			border: {
				color: "#ffffff",

			},
		},
		x: {
			ticks: {
				color: "#cccccc",
			},
			grid: {
				display: false,
			},
			border: {
				display: false,
			},
		},
	},

});

</script>
<template>
	<Line :data="chartData" :options="chartOptions" class="w-full" />
</template>
<style scoped lang="css"></style>
