<!-- components/ExpenseTable.vue -->
<template>
	<Card class="!rounded-[4px]">
		<template #header>
			<h3 class="text-lg font-semibold uppercase tracking-wide">{{ title }}</h3>
		</template>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b-2 border-gray-300">
						<th class="text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Item</th>
						<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Budgeted</th>
						<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Actual</th>
						<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Variance</th>
						<th class="text-center py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Status</th>
					</tr>
				</thead>
				<tbody>
					<template v-for="(item, idx) in items" :key="idx">
						<tr class="border-b border-gray-200 hover:bg-gray-50">
							<td class="py-3 px-4 font-medium">{{ item.name }}</td>
							<td class="text-right py-3 px-4 text-gray-600">{{ formatCurrency(item.budgeted) }}</td>
							<td class="text-right py-3 px-4 font-semibold">{{ formatCurrency(item.actual) }}</td>
							<td :class="['text-right py-3 px-4 font-semibold', getVarianceColor(item.variance)]">
								{{ formatCurrency(item.variance) }}
							</td>
							<td class="text-center py-3 px-4">
								<Icon
									:name="getStatusIcon(item.variance, item.budgeted)"
									:class="getStatusIconClass(item.variance, item.budgeted)" />
							</td>
						</tr>
						<tr v-if="item.transactions && item.transactions.length > 0" class="bg-gray-50">
							<td colspan="5" class="px-4 py-2">
								<div class="text-xs text-gray-600">
									<div class="font-semibold mb-1 uppercase tracking-wide">Transaction Details:</div>
									<div
										v-for="(tx, txIdx) in item.transactions"
										:key="txIdx"
										class="flex justify-between py-1 border-b border-gray-200 last:border-0">
										<span>{{ tx.date }} - {{ tx.description }}</span>
										<span class="font-medium">{{ formatCurrency(tx.amount) }}</span>
									</div>
								</div>
							</td>
						</tr>
					</template>
				</tbody>
			</table>
		</div>
	</Card>
</template>

<script setup>
defineProps({
	title: {
		type: String,
		required: true,
	},
	items: {
		type: Array,
		required: true,
	},
});

const formatCurrency = (amount) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
	}).format(amount);
};

const getStatusIcon = (variance, budgeted) => {
	if (budgeted === 0) return 'i-heroicons-minus-circle';
	const pct = Math.abs(variance / budgeted);

	if (variance > 0) return 'i-heroicons-check-circle';
	if (pct > 0.5) return 'i-heroicons-x-circle';
	if (pct > 0.1) return 'i-heroicons-exclamation-triangle';
	return 'i-heroicons-check-circle';
};

const getStatusIconClass = (variance, budgeted) => {
	if (budgeted === 0) return 'w-5 h-5 text-gray-600';
	const pct = Math.abs(variance / budgeted);

	if (variance > 0) return 'w-5 h-5 text-green-600';
	if (pct > 0.5) return 'w-5 h-5 text-red-600';
	if (pct > 0.1) return 'w-5 h-5 text-yellow-600';
	return 'w-5 h-5 text-green-600';
};

const getVarianceColor = (variance) => {
	if (variance > 0) return 'text-green-700';
	if (Math.abs(variance) > 500) return 'text-red-700';
	if (Math.abs(variance) > 100) return 'text-yellow-700';
	return 'text-gray-700';
};
</script>
