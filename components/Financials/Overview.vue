<template>
	<div class="space-y-8">
		<!-- RESERVE CRISIS ALERT - Top Priority -->
		<UAlert
			color="red"
			variant="solid"
			title="🚨 CRITICAL: Reserve Account Crisis Detected"
			icon="i-heroicons-exclamation-triangle"
		>
			<template #description>
				<div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="font-semibold text-white mb-2">Financial Impact:</p>
						<ul class="text-sm space-y-1 text-red-100">
							<li>• Current Balance: ${{ reserveData.endingBalance.toLocaleString() }}</li>
							<li>• Required Minimum: $75,000</li>
							<li>• Shortfall: ${{ (75000 - reserveData.endingBalance).toLocaleString() }}</li>
							<li>• Funding Level: {{ Math.round((reserveData.endingBalance / 75000) * 100) }}%</li>
						</ul>
					</div>
					<div>
						<p class="font-semibold text-white mb-2">Action Required:</p>
						<ul class="text-sm space-y-1 text-red-100">
							<li>• Emergency board meeting within 7 days</li>
							<li>• Special assessment planning needed</li>
							<li>• Reserve study update required</li>
							<li>• Compliance plan development</li>
						</ul>
					</div>
				</div>
			</template>
		</UAlert>

		<!-- Account Health Status -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div v-for="account in accountHealth" :key="account.account" class="relative">
				<UCard
					:class="{
						'border-red-500 bg-red-50': account.healthScore < 70,
						'border-yellow-500 bg-yellow-50': account.healthScore >= 70 && account.healthScore < 85,
						'border-green-500 bg-green-50': account.healthScore >= 85,
					}"
				>
					<!-- Crisis Badge for Reserve Account -->
					<div v-if="account.account.includes('Reserve')" class="absolute top-4 right-4">
						<UBadge color="red" variant="solid" size="sm">CRISIS</UBadge>
					</div>

					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="font-semibold text-gray-900">{{ account.account }}</h3>
							<UBadge :color="account.color" variant="subtle" size="sm">
								{{ account.status }}
							</UBadge>
						</div>

						<!-- Health Score Bar -->
						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Health Score</span>
								<span
									:class="`font-medium ${account.healthScore < 70 ? 'text-red-600' : account.healthScore < 85 ? 'text-yellow-600' : 'text-green-600'}`"
								>
									{{ account.healthScore }}/100
								</span>
							</div>
							<div
								:class="`${account.barColor.replace('bg-', 'bg-').replace('-500', '-200')} rounded-full h-2 overflow-hidden`"
							>
								<div
									:class="account.barColor"
									class="h-full transition-all duration-1000"
									:style="`width: ${account.healthScore}%`"
								/>
							</div>
						</div>

						<p class="text-sm text-gray-700">{{ account.description }}</p>

						<!-- Reserve-Specific Warnings -->
						<div v-if="account.account.includes('Reserve')" class="bg-red-100 border border-red-200 rounded p-3">
							<div class="flex items-start space-x-2">
								<UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
								<div class="text-xs text-red-800 space-y-1">
									<p class="font-semibold">Critical Issues:</p>
									<p>• 82% below minimum required balance</p>
									<p>• Florida Statute 718.112 compliance at risk</p>
									<p>• Emergency special assessment needed</p>
									<p>• Reserve study update required</p>
								</div>
							</div>
						</div>
					</div>
				</UCard>
			</div>
		</div>

		<!-- Key Financial Metrics -->
		<UCard>
			<template #header>
				<h2 class="text-xl font-bold text-gray-900">Key Financial Metrics</h2>
			</template>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
				<div v-for="metric in keyMetrics" :key="metric.label" class="text-center">
					<div class="flex items-center justify-center space-x-2 mb-2">
						<UIcon :name="metric.icon" :class="metric.iconColor" class="w-5 h-5" />
						<span class="text-sm font-medium text-gray-600">{{ metric.label }}</span>
					</div>
					<p :class="metric.valueColor" class="text-2xl font-bold">${{ metric.value }}</p>
					<p class="text-xs text-gray-500">{{ metric.subtitle }}</p>
				</div>
			</div>
		</UCard>

		<!-- Priority Actions - Updated with Reserve Crisis -->
		<UCard>
			<template #header>
				<h2 class="text-xl font-bold text-gray-900">Priority Actions Required</h2>
			</template>

			<div class="space-y-4">
				<div
					v-for="(action, index) in priorityActions"
					:key="index"
					:class="{
						'border-l-4 border-red-600 bg-red-50': action.priority === 'critical',
						'border-l-4 border-yellow-500 bg-yellow-50': action.priority === 'high',
						'border-l-4 border-blue-500 bg-blue-50': action.priority === 'medium',
					}"
					class="p-4 rounded-r-lg"
				>
					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0">
							<UBadge
								:color="action.priority === 'critical' ? 'red' : action.priority === 'high' ? 'yellow' : 'blue'"
								variant="solid"
								size="sm"
							>
								{{ action.priority.toUpperCase() }}
							</UBadge>
						</div>
						<div class="flex-1">
							<h4 class="font-semibold text-gray-900">{{ action.title }}</h4>
							<p class="text-sm text-gray-700 mt-1">{{ action.description }}</p>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Monthly Summary -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Cash Flow Summary -->
			<UCard>
				<template #header>
					<h3 class="text-lg font-bold text-gray-900">Cash Flow Summary</h3>
				</template>

				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Total Assets</span>
						<span class="font-semibold text-gray-900">
							${{ (operatingCurrent.endingBalance + reserveData.endingBalance + 45000).toLocaleString() }}
						</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Monthly Operating Burn</span>
						<span class="font-semibold text-red-600">
							-${{ Math.abs(operatingCurrent.endingBalance - operatingCurrent.beginningBalance).toLocaleString() }}
						</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Reserve Adequacy</span>
						<span class="font-semibold text-red-600">
							{{ Math.round((reserveData.endingBalance / 75000) * 100) }}% of required
						</span>
					</div>
					<div class="flex justify-between items-center pt-2 border-t">
						<span class="text-gray-600">Financial Health</span>
						<UBadge color="red" variant="solid">CRITICAL</UBadge>
					</div>
				</div>
			</UCard>

			<!-- Compliance Status -->
			<UCard>
				<template #header>
					<h3 class="text-lg font-bold text-gray-900">Compliance Status</h3>
				</template>

				<div class="space-y-4">
					<div v-for="item in compliance.concerns" :key="item" class="flex items-start space-x-3">
						<UIcon name="i-heroicons-x-circle" class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
						<span class="text-sm text-gray-700">{{ item }}</span>
					</div>

					<div class="pt-4 border-t">
						<div v-for="item in compliance.compliant" :key="item" class="flex items-start space-x-3 mb-2">
							<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
							<span class="text-sm text-gray-700">{{ item }}</span>
						</div>
					</div>
				</div>
			</UCard>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useReconciliationData } from '~/composables/useReconciliationData';

// Get data from composable
const { getOperatingData, getReserveData, getViolationCount, getReserveComplianceStatus } = useReconciliationData();

// Current month
const currentMonth = ref('June 2025');

// Get current data
const operatingCurrent = computed(() => getOperatingData(currentMonth.value));
const reserveData = computed(() => getReserveData(currentMonth.value));
const reserveCompliance = computed(() => getReserveComplianceStatus(currentMonth.value));

// Account health status - updated with reserve crisis
const accountHealth = computed(() => {
	const violations = getViolationCount(currentMonth.value);

	return [
		{
			account: 'Operating Account (5129)',
			healthScore:
				operatingCurrent.value.endingBalance < 35000 ? 45 : operatingCurrent.value.endingBalance < 50000 ? 65 : 85,
			status:
				operatingCurrent.value.endingBalance < 35000
					? 'Critical'
					: operatingCurrent.value.endingBalance < 50000
						? 'Warning'
						: 'Healthy',
			color:
				operatingCurrent.value.endingBalance < 35000
					? 'red'
					: operatingCurrent.value.endingBalance < 50000
						? 'yellow'
						: 'green',
			barColor:
				operatingCurrent.value.endingBalance < 35000
					? 'bg-red-500'
					: operatingCurrent.value.endingBalance < 50000
						? 'bg-yellow-500'
						: 'bg-green-500',
			description:
				operatingCurrent.value.endingBalance < 35000
					? 'Rapid depletion, compliance violations, approaching minimum balance'
					: operatingCurrent.value.endingBalance < 50000
						? 'Declining balance, monitoring required'
						: 'Healthy balance, normal operations',
		},
		{
			account: 'Special Assessment (5872)',
			healthScore: violations > 0 ? 60 : 90,
			status: violations > 0 ? 'Warning' : 'Healthy',
			color: violations > 0 ? 'yellow' : 'green',
			barColor: violations > 0 ? 'bg-yellow-500' : 'bg-green-500',
			description:
				violations > 0
					? 'Improper fund mixing detected, but project progressing'
					: 'Properly segregated, project on track',
		},
		{
			account: 'Reserve Account (7011) - CRISIS',
			healthScore: 15, // CRITICAL - only 18% of required balance
			status: 'CRITICAL',
			color: 'red',
			barColor: 'bg-red-600',
			description: 'EMERGENCY: Only 18% of required reserves, $80K+ withdrawal investigation required',
		},
	];
});

// Key metrics - updated with reserve crisis data
const keyMetrics = computed(() => {
	const totalAssets = operatingCurrent.value.endingBalance + reserveData.value.endingBalance + 45000;
	const monthlyBurn = Math.abs(operatingCurrent.value.endingBalance - operatingCurrent.value.beginningBalance);
	const violations = getViolationCount(currentMonth.value);

	return [
		{
			label: 'Total Assets',
			value: totalAssets.toLocaleString(),
			subtitle: 'All accounts',
			icon: 'i-heroicons-currency-dollar',
			iconColor: 'text-red-600', // Changed to red due to crisis
			valueColor: 'text-red-900',
		},
		{
			label: 'Monthly Burn',
			value: monthlyBurn.toLocaleString(),
			subtitle: 'Current month',
			icon: 'i-heroicons-arrow-trending-down',
			iconColor: 'text-red-600',
			valueColor: 'text-red-600',
		},
		{
			label: 'Reserve Crisis',
			value: (75000 - reserveData.value.endingBalance).toLocaleString(),
			subtitle: 'Shortfall amount',
			icon: 'i-heroicons-exclamation-triangle',
			iconColor: 'text-red-600',
			valueColor: 'text-red-600',
		},
		{
			label: 'Violations',
			value: violations.toString(),
			subtitle: 'Fund transfers',
			icon: 'i-heroicons-exclamation-triangle',
			iconColor: 'text-red-600',
			valueColor: 'text-red-600',
		},
	];
});

// Priority actions - updated with reserve crisis as top priority
const priorityActions = ref([
	{
		priority: 'critical',
		title: '🚨 RESERVE ACCOUNT CRISIS',
		description:
			'Only $13,376 available vs $75,000 required. Emergency board meeting and special assessment planning required immediately.',
	},
	{
		priority: 'critical',
		title: 'Stop All Inter-Account Transfers',
		description: 'Immediately freeze transfers between 5129 and 5872 accounts to prevent further violations.',
	},
	{
		priority: 'high',
		title: 'Emergency Special Assessment',
		description: 'Implement immediate special assessment to restore reserves to minimum required levels.',
	},
	{
		priority: 'high',
		title: 'Reserve Study Update',
		description: 'Engage professional reserve study company to update analysis and create funding plan.',
	},
	{
		priority: 'high',
		title: 'Legal Consultation',
		description: 'Consult with HOA attorney regarding board liability and fiduciary duty compliance.',
	},
]);

// Compliance data - updated with reserve crisis
const compliance = ref({
	compliant: [
		'Bank statements available for owner inspection',
		'Special assessment funds properly tracked (with violations noted)',
	],
	concerns: [
		'🚨 CRITICAL: Reserve funding 82% below Florida Statute 718.112 requirements',
		'💰 URGENT: Special assessment needed to restore minimum reserve levels',
		'⚠️ VIOLATION: Improper inter-account transfers detected',
		'📋 REQUIRED: Emergency board meeting to address fiduciary duty compliance',
		'🏛️ LEGAL: Potential board liability for reserve underfunding',
		'📊 UPDATE: Reserve study and funding plan needed immediately',
	],
});
</script>
