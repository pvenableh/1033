<template>
	<UAccordion :items="accordionItems" multiple :default-value="['deposits']">
		<template #default="{ item, index, open }">
			<UButton color="gray" variant="ghost" class="w-full" :ui="{ padding: 'p-3' }">
				<template #leading>
					<UIcon
						:name="open ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
						class="w-5 h-5 transition-transform"
					/>
				</template>

				<div class="flex items-center justify-between w-full">
					<div class="flex items-center space-x-3">
						<UIcon :name="item.icon" :class="item.iconColor" class="w-5 h-5" />
						<span class="font-semibold">{{ item.label }}</span>
						<UBadge :color="item.badgeColor" variant="subtle">
							{{ item.count }}
						</UBadge>
					</div>
					<span class="text-sm font-medium" :class="item.amountColor">
						{{ item.amount }}
					</span>
				</div>
			</UButton>
		</template>

		<template #item="{ item }">
			<div class="p-4">
				<!-- Deposits -->
				<div v-if="item.key === 'deposits'" class="space-y-2">
					<div
						v-for="(deposit, idx) in deposits"
						:key="`deposit-${idx}`"
						class="flex justify-between items-center py-2 border-b last:border-0"
					>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">{{ deposit.description }}</p>
							<p class="text-xs text-gray-500">{{ deposit.date }} • {{ deposit.source }}</p>
						</div>
						<span class="text-sm font-medium text-green-600">+${{ deposit.amount.toLocaleString() }}</span>
					</div>
				</div>

				<!-- Withdrawals -->
				<div v-else-if="item.key === 'withdrawals'" class="space-y-2">
					<div
						v-for="(withdrawal, idx) in withdrawals"
						:key="`withdrawal-${idx}`"
						class="flex justify-between items-center py-2 border-b last:border-0"
					>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">{{ withdrawal.vendor }}</p>
							<p class="text-xs text-gray-500">
								{{ withdrawal.date }} • {{ withdrawal.category }}
								<UBadge v-if="withdrawal.violation" color="red" variant="subtle" size="xs" class="ml-2">
									VIOLATION
								</UBadge>
							</p>
						</div>
						<span class="text-sm font-medium text-red-600">-${{ withdrawal.amount.toLocaleString() }}</span>
					</div>
				</div>

				<!-- Violations -->
				<div v-else-if="item.key === 'violations'" class="space-y-3">
					<UAlert
						color="red"
						icon="i-heroicons-exclamation-triangle"
						title="Fund Segregation Violations Detected"
						description="These transactions violate HOA fund segregation requirements and must be corrected."
					/>

					<div
						v-for="(violation, idx) in violations"
						:key="`violation-${idx}`"
						class="bg-red-50 border border-red-200 rounded-lg p-3"
					>
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<p class="text-sm font-medium text-red-900">{{ violation.description }}</p>
								<p class="text-xs text-red-700 mt-1">
									{{ violation.date }} • {{ violation.type === 'incoming' ? 'Incoming' : 'Outgoing' }} Transfer
								</p>
							</div>
							<span class="text-sm font-bold text-red-600">${{ violation.amount.toLocaleString() }}</span>
						</div>
					</div>

					<div class="mt-4 p-3 bg-orange-50 rounded-lg">
						<p class="text-sm font-semibold text-orange-900 mb-1">Required Actions:</p>
						<ul class="text-xs text-orange-800 space-y-1">
							<li>• Reverse all improper transfers immediately</li>
							<li>• Implement controls to prevent future violations</li>
							<li>• Document corrective actions for audit trail</li>
							<li>• Report to board at next meeting</li>
						</ul>
					</div>
				</div>
			</div>
		</template>
	</UAccordion>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	deposits: {
		type: Array,
		default: () => [],
	},
	withdrawals: {
		type: Array,
		default: () => [],
	},
	violations: {
		type: Array,
		default: () => [],
	},
});

const accordionItems = computed(() => {
	const items = [];

	if (props.deposits.length > 0) {
		const totalDeposits = props.deposits.reduce((sum, d) => sum + d.amount, 0);
		items.push({
			key: 'deposits',
			label: 'Deposits & Revenue',
			icon: 'i-heroicons-arrow-down-circle',
			iconColor: 'text-green-600',
			count: props.deposits.length,
			amount: `+$${totalDeposits.toLocaleString()}`,
			amountColor: 'text-green-600',
			badgeColor: 'green',
		});
	}

	if (props.withdrawals.length > 0) {
		const totalWithdrawals = props.withdrawals.reduce((sum, w) => sum + w.amount, 0);
		items.push({
			key: 'withdrawals',
			label: 'Withdrawals & Expenses',
			icon: 'i-heroicons-arrow-up-circle',
			iconColor: 'text-red-600',
			count: props.withdrawals.length,
			amount: `-$${totalWithdrawals.toLocaleString()}`,
			amountColor: 'text-red-600',
			badgeColor: 'gray',
		});
	}

	if (props.violations.length > 0) {
		const totalViolations = props.violations.reduce((sum, v) => sum + v.amount, 0);
		items.push({
			key: 'violations',
			label: 'Compliance Violations',
			icon: 'i-heroicons-exclamation-triangle',
			iconColor: 'text-orange-600',
			count: props.violations.length,
			amount: `$${totalViolations.toLocaleString()}`,
			amountColor: 'text-orange-600',
			badgeColor: 'orange',
		});
	}

	return items;
});
</script>
