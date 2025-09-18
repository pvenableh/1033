<template>
	<div class="flex flex-col justify-center items-center legend-container">
		<p class="flex flex-row justify-center items-center text-xs uppercase tracking-wide">
			<span v-for="(legendValue, index) in legendValues" :key="`legend-badge-${index}`" class="px-4">
				<span :style="{'background-color': legendValue.color}" class="badge"></span>
				<span>{{ legendValue.label }}</span>
			</span>
		</p>
		<p v-if="subtitle" class="text-xs uppercase tracking-wide">{{ subtitle }}</p>
	</div>
</template>

<script>
export default {
	props: {
		legendValues: {
			type: Array,
			default: () => [],
		},
		subtitle: {
			type: String,
			default: null,
		},
	},
};
</script>

<style scoped>
.legend-container {
	padding: 1em;
	display: flex;
	flex-wrap: wrap;
	width: 100%;
	gap: 14px;
	justify-content: center;
}

.badge {
	border-radius: 4.5px;
	padding: 0;
	width: 9px;
	height: 9px;
	display: inline-block;
	margin-right: 3px;
}
</style>
