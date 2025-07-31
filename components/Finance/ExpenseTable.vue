<template>
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
					<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
					<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				<tr v-for="(expense, index) in sortedExpenses" :key="index">
					<td class="px-4 py-3 text-sm font-medium text-gray-900">
						{{ expense.category }}
					</td>
					<td class="px-4 py-3 text-sm text-right text-gray-900">${{ expense.amount.toLocaleString() }}</td>
					<td class="px-4 py-3 text-sm text-right text-gray-600">{{ expense.percentage }}%</td>
				</tr>
			</tbody>
			<tfoot class="bg-gray-50">
				<tr>
					<td class="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
					<td class="px-4 py-3 text-sm font-bold text-right text-gray-900">${{ totalExpenses.toLocaleString() }}</td>
					<td class="px-4 py-3 text-sm text-right text-gray-600">100%</td>
				</tr>
			</tfoot>
		</table>
	</div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	expenses: {
		type: Object,
		default: () => ({}),
	},
});

const totalExpenses = computed(() => {
	return Object.values(props.expenses).reduce((sum, amount) => sum + amount, 0);
});

const sortedExpenses = computed(() => {
	return Object.entries(props.expenses)
		.map(([category, amount]) => ({
			category,
			amount,
			percentage: totalExpenses.value > 0 ? Math.round((amount / totalExpenses.value) * 100) : 0,
		}))
		.sort((a, b) => b.amount - a.amount);
});
</script>
