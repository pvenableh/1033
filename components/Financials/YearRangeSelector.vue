<script setup>
// From/To fiscal-year range selector.
// Emits update:fromYear / update:toYear and self-corrects so that
// fromYear <= toYear is always maintained.
const props = defineProps({
	fromYear: { type: Number, required: true },
	toYear: { type: Number, required: true },
	minYear: { type: Number, default: 2023 },
	maxYear: { type: Number, default: () => new Date().getFullYear() + 1 },
	label: { type: String, default: 'Fiscal Year' },
});

const emit = defineEmits(['update:fromYear', 'update:toYear']);

const years = computed(() => {
	const list = [];
	for (let y = props.minYear; y <= props.maxYear; y++) list.push(y);
	return list;
});

const onFromChange = (event) => {
	const value = Number(event.target.value);
	emit('update:fromYear', value);
	// Keep the range valid: never let "from" exceed "to".
	if (value > props.toYear) emit('update:toYear', value);
};

const onToChange = (event) => {
	const value = Number(event.target.value);
	emit('update:toYear', value);
	if (value < props.fromYear) emit('update:fromYear', value);
};
</script>

<template>
	<div class="flex items-center gap-2">
		<label v-if="label" class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
			{{ label }}
		</label>
		<div class="flex items-center gap-1.5">
			<select
				:value="fromYear"
				aria-label="From year"
				class="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
				@change="onFromChange"
			>
				<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
			</select>
			<span class="text-sm text-muted-foreground">to</span>
			<select
				:value="toYear"
				aria-label="To year"
				class="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
				@change="onToChange"
			>
				<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
			</select>
		</div>
	</div>
</template>
