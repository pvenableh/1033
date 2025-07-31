<template>
	<UCard>
		<template #header>
			<div class="flex items-center justify-between">
				<h4 class="font-bold text-gray-900 uppercase tracking-wider">{{ account.name }} Summary</h4>
				<UBadge :color="statusColor" variant="subtle" class="uppercase tracking-wider">
					{{ reconciliationStatus }}
				</UBadge>
			</div>
		</template>

		<div class="space-y-4">
			<!-- Balance Summary -->
			<div class="grid grid-cols-2 gap-4">
				<div class="bg-gray-50 rounded-lg p-4">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Beginning Balance</p>
					<p class="mt-1 text-xl font-bold text-gray-900">${{ account.beginningBalance.toLocaleString() }}</p>
				</div>
				<div class="bg-gray-50 rounded-lg p-4">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Ending Balance</p>
					<p class="mt-1 text-xl font-bold text-gray-900">${{ account.endingBalance.toLocaleString() }}</p>
				</div>
			</div>

			<!-- Net Change -->
			<div class="rounded-lg p-4 text-center" :class="account.netChange >= 0 ? 'bg-green-50' : 'bg-red-50'">
				<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Net Change</p>
				<p class="mt-1 text-2xl font-bold" :class="account.netChange >= 0 ? 'text-green-600' : 'text-red-600'">
					{{ account.netChange >= 0 ? '+' : '' }}${{ Math.abs(account.netChange).toLocaleString() }}
				</p>
				<p class="text-sm mt-1" :class="account.netChange >= 0 ? 'text-green-600' : 'text-red-600'">
					{{ changePercentage }}% {{ account.netChange >= 0 ? 'increase' : 'decrease' }}
				</p>
			</div>

			<!-- Reconciliation Status -->
			<div class="border-t pt-4">
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-600">Reconciliation Date:</span>
					<span class="font-medium text-gray-900">{{ month }}</span>
				</div>
				<div class="flex items-center justify-between text-sm mt-2">
					<span class="text-gray-600">Reviewed By:</span>
					<span class="font-medium text-gray-900">Board Treasurer</span>
				</div>
			</div>

			<!-- Warning Messages -->
			<div v-if="warnings.length > 0" class="border-t pt-4 space-y-2">
				<div v-for="warning in warnings" :key="warning" class="flex items-start space-x-2">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-yellow-600 mt-0.5" />
					<span class="text-sm text-gray-700">{{ warning }}</span>
				</div>
			</div>
		</div>
	</UCard>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	account: {
		type: Object,
		required: true,
	},
	month: {
		type: String,
		required: true,
	},
});

const changePercentage = computed(() => {
	if (props.account.beginningBalance === 0) return 0;
	return Math.abs((props.account.netChange / props.account.beginningBalance) * 100).toFixed(1);
});

const reconciliationStatus = computed(() => {
	if (props.account.number.includes('5129') && props.account.endingBalance < 35000) {
		return 'Critical';
	}
	if (Math.abs(props.account.netChange) > props.account.beginningBalance * 0.2) {
		return 'Warning';
	}
	return 'Reconciled';
});

const statusColor = computed(() => {
	switch (reconciliationStatus.value) {
		case 'Critical':
			return 'red';
		case 'Warning':
			return 'yellow';
		case 'Reconciled':
			return 'green';
		default:
			return 'gray';
	}
});

const warnings = computed(() => {
	const warnings = [];

	if (props.account.number.includes('5129')) {
		if (props.account.endingBalance < 35000) {
			warnings.push('Operating balance below recommended minimum of $35,000');
		}
		if (props.account.netChange < -10000) {
			warnings.push('Significant monthly decline exceeding $10,000');
		}
	}

	if (props.account.number.includes('5872')) {
		warnings.push('Verify all expenses are 40-year recertification related');
	}

	return warnings;
});
</script>
