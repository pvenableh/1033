<template>
	<UCard
		:class="{
			'border-red-500 bg-red-50': account.status === 'critical' || account.criticallyLow,
			'border-yellow-500 bg-yellow-50': account.status === 'warning',
			'border-green-500 bg-green-50': account.status === 'stable',
			'border-gray-200': !account.status,
		}"
	>
		<div class="relative">
			<!-- Critical Reserve Alert Overlay -->
			<div v-if="account.criticallyLow" class="absolute top-0 right-0">
				<UBadge color="red" variant="solid" size="xs">CRISIS</UBadge>
			</div>

			<!-- Account Header -->
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center space-x-3">
					<div
						:class="{
							'bg-red-100 text-red-600': account.status === 'critical' || account.criticallyLow,
							'bg-yellow-100 text-yellow-600': account.status === 'warning',
							'bg-green-100 text-green-600': account.status === 'stable',
							'bg-gray-100 text-gray-600': !account.status,
						}"
						class="p-2 rounded-lg"
					>
						<UIcon :name="account.icon" class="w-5 h-5" />
					</div>
					<div>
						<h3 class="font-semibold text-gray-900">{{ account.name }}</h3>
						<p class="text-sm text-gray-500">{{ account.number }}</p>
					</div>
				</div>

				<!-- Status Badge -->
				<UBadge
					:color="
						account.status === 'critical' || account.criticallyLow
							? 'red'
							: account.status === 'warning'
								? 'yellow'
								: 'green'
					"
					variant="subtle"
					size="sm"
				>
					{{
						account.status === 'critical' || account.criticallyLow
							? 'CRITICAL'
							: account.status === 'warning'
								? 'Warning'
								: 'Healthy'
					}}
				</UBadge>
			</div>

			<!-- Balance Display -->
			<div class="mb-4">
				<p
					:class="{
						'text-red-900': account.status === 'critical' || account.criticallyLow,
						'text-yellow-900': account.status === 'warning',
						'text-green-900': account.status === 'stable',
						'text-gray-900': !account.status,
					}"
					class="text-2xl font-bold"
				>
					${{ account.balance.toLocaleString() }}
				</p>
				<p class="text-sm text-gray-600">Current Balance</p>
			</div>

			<!-- Change Indicator -->
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center space-x-2">
					<UIcon
						:name="account.change >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
						:class="account.change >= 0 ? 'text-green-500' : 'text-red-500'"
						class="w-4 h-4"
					/>
					<span :class="account.change >= 0 ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
						{{ account.change >= 0 ? '+' : '' }}${{ Math.abs(account.change).toLocaleString() }}
					</span>
				</div>
				<span :class="account.change >= 0 ? 'text-green-600' : 'text-red-600'" class="text-sm">
					{{ account.changePercent >= 0 ? '+' : '' }}{{ account.changePercent.toFixed(1) }}%
				</span>
			</div>

			<!-- Critical Reserve-Specific Alerts -->
			<div v-if="account.criticallyLow" class="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
				<div class="flex items-start space-x-2">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-600 mt-0.5" />
					<div class="flex-1">
						<p class="text-xs font-semibold text-red-900">RESERVE CRISIS</p>
						<p class="text-xs text-red-800 mt-1">
							${{ account.shortfall?.toLocaleString() || '61,624' }} below minimum
						</p>
						<p class="text-xs text-red-800">{{ account.complianceRisk }} compliance risk</p>
					</div>
				</div>
			</div>

			<!-- Balance vs Minimum -->
			<div class="mb-4">
				<div class="flex justify-between text-xs text-gray-600 mb-1">
					<span>vs. Minimum Required</span>
					<span>${{ account.minBalance.toLocaleString() }}</span>
				</div>
				<div
					:class="{
						'bg-red-200': account.status === 'critical' || account.criticallyLow,
						'bg-yellow-200': account.status === 'warning',
						'bg-green-200': account.status === 'stable',
						'bg-gray-200': !account.status,
					}"
					class="rounded-full h-2 overflow-hidden"
				>
					<div
						:class="{
							'bg-red-600': account.status === 'critical' || account.criticallyLow,
							'bg-yellow-600': account.status === 'warning',
							'bg-green-600': account.status === 'stable',
							'bg-gray-600': !account.status,
						}"
						class="h-full transition-all duration-500"
						:style="`width: ${Math.min((account.balance / account.minBalance) * 100, 100)}%`"
					/>
				</div>
				<p class="text-xs text-gray-500 mt-1">
					{{ Math.round((account.balance / account.minBalance) * 100) }}% of minimum
				</p>
			</div>

			<!-- Action Required for Critical Accounts -->
			<div v-if="account.status === 'critical' || account.criticallyLow" class="mt-4">
				<div class="bg-red-600 text-white p-2 rounded text-center">
					<p class="text-xs font-semibold">IMMEDIATE ACTION REQUIRED</p>
				</div>
			</div>

			<!-- Warning for Low Accounts -->
			<div v-else-if="account.status === 'warning'" class="mt-4">
				<div class="bg-yellow-600 text-white p-2 rounded text-center">
					<p class="text-xs font-semibold">MONITORING REQUIRED</p>
				</div>
			</div>

			<!-- Reserve-Specific Warning for Low Balance -->
			<div v-if="account.name.includes('Reserve') && account.complianceRisk === 'HIGH'" class="mt-2">
				<div class="bg-yellow-50 border border-yellow-200 rounded p-2">
					<div class="flex items-center space-x-1">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 text-yellow-600" />
						<p class="text-xs text-yellow-800 font-medium">Special Assessment Needed</p>
					</div>
					<p class="text-xs text-yellow-700 mt-1">Funding plan required</p>
				</div>
			</div>
		</div>
	</UCard>
</template>

<script setup>
const props = defineProps({
	account: {
		type: Object,
		required: true,
	},
});
</script>
