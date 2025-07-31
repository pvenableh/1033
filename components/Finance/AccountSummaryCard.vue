<template>
	<UCard :class="critical ? 'border-red-200 bg-red-50' : ''">
		<template #header>
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">{{ account.name }}</h3>
				<UBadge v-if="critical" color="red" variant="solid">CRITICAL</UBadge>
			</div>
		</template>

		<div class="space-y-4">
			<!-- Balance Summary -->
			<div class="grid grid-cols-2 gap-4">
				<div class="bg-gray-50 rounded-lg p-4">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Beginning Balance</p>
					<p class="mt-1 text-2xl font-bold text-gray-900">${{ account.beginningBalance.toLocaleString() }}</p>
				</div>
				<div class="bg-gray-50 rounded-lg p-4">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Ending Balance</p>
					<p class="mt-1 text-2xl font-bold" :class="account.netChange < 0 ? 'text-red-600' : 'text-gray-900'">
						${{ account.endingBalance.toLocaleString() }}
					</p>
				</div>
			</div>

			<!-- Cash Flow -->
			<div class="border-t pt-4">
				<h4 class="font-semibold text-gray-900 mb-3">Cash Flow Summary</h4>
				<div class="space-y-2">
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">Total Deposits</span>
						<span class="text-sm font-medium text-green-600">+${{ account.totalDeposits.toLocaleString() }}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">Total Withdrawals</span>
						<span class="text-sm font-medium text-red-600">-${{ account.totalWithdrawals.toLocaleString() }}</span>
					</div>
					<div class="flex justify-between items-center pt-2 border-t">
						<span class="text-sm font-semibold text-gray-900">Net Change</span>
						<span class="text-sm font-bold" :class="account.netChange < 0 ? 'text-red-600' : 'text-green-600'">
							{{ account.netChange < 0 ? '-' : '+' }}${{ Math.abs(account.netChange).toLocaleString() }}
						</span>
					</div>
				</div>
			</div>

			<!-- Warnings -->
			<div v-if="account.warnings && account.warnings.length > 0" class="border-t pt-4">
				<h4 class="font-semibold text-red-900 mb-2">⚠️ Warnings</h4>
				<ul class="space-y-1">
					<li v-for="(warning, index) in account.warnings" :key="index" class="text-sm text-red-700">
						• {{ warning }}
					</li>
				</ul>
			</div>
		</div>
	</UCard>
</template>

<script setup>
defineProps({
	account: {
		type: Object,
		required: true,
	},
	critical: {
		type: Boolean,
		default: false,
	},
});
</script>
