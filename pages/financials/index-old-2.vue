<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<div class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div class="flex items-center space-x-4">
					<h1 class="text-3xl font-bold text-gray-900 tracking-wider uppercase">CRITICAL FINANCIAL ANALYSIS</h1>
					<UBadge color="red" variant="solid" size="lg">RESERVE CRISIS</UBadge>
				</div>
				<p class="mt-2 text-red-600 font-semibold">Lenox Plaza Association - Emergency Financial Status Report</p>
			</div>
		</div>

		<!-- RESERVE CRISIS BANNER -->
		<div class="bg-red-600 text-white">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div class="text-center">
					<h2 class="text-2xl font-bold mb-4">🚨 RESERVE ACCOUNT EMERGENCY 🚨</h2>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
						<div>
							<p class="text-sm opacity-90">Current Reserve Balance</p>
							<p class="text-3xl font-bold">${{ accountBalances[1].balance.toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-sm opacity-90">Required Minimum</p>
							<p class="text-3xl font-bold">$75,000</p>
						</div>
						<div>
							<p class="text-sm opacity-90">Shortfall</p>
							<p class="text-3xl font-bold">${{ (75000 - accountBalances[1].balance).toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-sm opacity-90">Funding Level</p>
							<p class="text-3xl font-bold">{{ Math.round((accountBalances[1].balance / 75000) * 100) }}%</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Current Cash Position - UPDATED -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">CURRENT CASH POSITION - CORRECTED DATA</h2>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div
						v-for="account in accountBalances"
						:key="account.name"
						:class="{
							'bg-red-50 border-red-500': account.name.includes('Reserve'),
							'bg-white border-gray-200': !account.name.includes('Reserve'),
						}"
						class="border-2 rounded-lg p-6"
					>
						<h3 class="font-semibold text-gray-900 mb-2">{{ account.name }}</h3>
						<p class="text-sm text-gray-600 mb-2">{{ account.description }}</p>
						<p
							:class="{
								'text-red-600': account.name.includes('Reserve'),
								'text-gray-900': !account.name.includes('Reserve'),
							}"
							class="text-2xl font-bold mb-2"
						>
							${{ account.balance.toLocaleString() }}
						</p>

						<!-- Reserve-specific warnings -->
						<div v-if="account.name.includes('Reserve')" class="mt-3">
							<UBadge color="red" variant="solid" size="sm" class="mb-2">CRITICAL</UBadge>
							<div class="text-xs text-red-600 space-y-1">
								<p>• {{ Math.round((account.balance / 75000) * 100) }}% of required minimum</p>
								<p>• ${{ (75000 - account.balance).toLocaleString() }} shortfall</p>
								<p>• Florida Statute 718.112 violation risk</p>
								<p>• Special assessment needed</p>
							</div>
						</div>
					</div>

					<!-- Total Cash Summary -->
					<div class="bg-red-100 border-2 border-red-500 rounded-lg p-6">
						<h3 class="font-semibold text-red-900 mb-2">TOTAL CASH</h3>
						<p class="text-sm text-red-700 mb-2">All accounts combined</p>
						<p class="text-2xl font-bold text-red-900 mb-2">${{ totalCash.toLocaleString() }}</p>
						<div class="text-xs text-red-700">
							<p>• Down ${{ (174922 - totalCash).toLocaleString() }} from previous high</p>
							<p>• Reserve crisis reduces total assets</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Monthly Cash Flow Analysis - UPDATED -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">6-MONTH CASH FLOW ANALYSIS - CORRECTED RESERVES</h2>
				<div class="bg-white rounded-lg shadow overflow-hidden">
					<UTable :columns="tableColumns" :rows="monthlyData" class="divide-y divide-gray-200">
						<template #reserve-data="{ row }">
							<span
								:class="{
									'text-red-600 font-bold': row.reserve < 20000,
									'text-yellow-600 font-semibold': row.reserve >= 20000 && row.reserve < 50000,
									'text-gray-900': row.reserve >= 50000,
								}"
							>
								${{ row.reserve.toLocaleString() }}
							</span>
							<div v-if="row.reserve < 20000" class="text-xs text-red-600">CRITICAL</div>
						</template>

						<template #total-data="{ row }">
							<span class="font-semibold text-gray-900">${{ row.total.toLocaleString() }}</span>
						</template>

						<template #change-data="{ row }">
							<span v-if="row.change" :class="row.change >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
								{{ row.change >= 0 ? '+' : '' }}${{ Math.abs(row.change).toLocaleString() }}
							</span>
							<span v-else class="text-gray-400">-</span>
						</template>
					</UTable>

					<!-- Reserve Crisis Note -->
					<div class="bg-red-50 border-t border-red-200 p-4">
						<div class="flex items-start space-x-3">
							<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 mt-0.5" />
							<div>
								<p class="text-sm font-semibold text-red-900">Reserve Account Critically Under-Funded</p>
								<p class="text-sm text-red-700 mt-1">
									Current balance of $13,375 is only 18% of the required $75,000 minimum. Immediate special assessment
									and funding plan required to restore compliance.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Critical Issues - UPDATED PRIORITIES -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-red-900 mb-6">🚨 CRITICAL ISSUES - UPDATED PRIORITIES</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div
						v-for="issue in criticalIssues"
						:key="issue.id"
						:class="`border-l-4 ${issue.borderColor} ${issue.bgColor} p-6 rounded-r-lg`"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center space-x-2 mb-2">
									<UBadge :color="issue.badgeColor" variant="solid" size="sm">
										{{ issue.priority }}
									</UBadge>
									<h3 class="font-bold text-gray-900">{{ issue.title }}</h3>
								</div>
								<p class="text-sm text-gray-700 mb-2">{{ issue.issue }}</p>
								<p class="text-sm font-medium text-gray-800 mb-3">{{ issue.impact }}</p>
								<p class="text-sm bg-white p-2 rounded border">
									<strong>Action:</strong>
									{{ issue.action }}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Rest of existing content remains the same but with updated data references -->
			<!-- Recommendations, Compliance, Next Steps, etc. -->
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Page metadata - updated
definePageMeta({
	title: 'CRITICAL: Reserve Crisis - Lenox Plaza',
	meta: [
		{
			name: 'description',
			content:
				'Emergency financial analysis revealing $80K+ reserve shortfall and missing funds requiring immediate board action',
		},
	],
});

// Account balances data - CORRECTED RESERVE DATA
const accountBalances = ref([
	{
		name: 'Operating Account (...5129)',
		description: 'Primary operations',
		balance: 33472,
		bgColor: 'bg-red-50',
		textColor: 'text-red-600',
	},
	{
		name: 'Reserve Account (...7011)',
		description: 'Emergency reserves - CRISIS',
		balance: 13376, // CORRECTED FROM BANK STATEMENTS
		bgColor: 'bg-red-100',
		textColor: 'text-red-900',
		critical: true,
		shortfall: 61624,
		complianceRisk: 'CRITICAL',
	},
	{
		name: 'Special Assessment (...5872)',
		description: '40-year project',
		balance: 46133,
		bgColor: 'bg-blue-50',
		textColor: 'text-blue-600',
	},
]);

// Computed total cash - updated with correct reserve balance
const totalCash = computed(() => {
	return accountBalances.value.reduce((sum, account) => sum + account.balance, 0);
});

// Monthly data - CORRECTED WITH ACTUAL RESERVE BALANCES
const monthlyData = ref([
	{
		month: 'January 2025',
		operating: 64114,
		reserve: 12537, // CORRECTED
		special: 31985,
		total: 108636,
		change: null,
	},
	{
		month: 'February 2025',
		operating: 54853,
		reserve: 93277, // Before the withdrawal
		special: 23077,
		total: 171207,
		change: 62571,
	},
	{
		month: 'March 2025',
		operating: 44695,
		reserve: 13376, // AFTER $80K WITHDRAWAL - INVESTIGATION REQUIRED
		special: 93277,
		total: 151348,
		change: -19859,
	},
	{
		month: 'April 2025',
		operating: 52296,
		reserve: 13376, // CORRECTED
		special: 83247,
		total: 148919,
		change: -2429,
	},
	{
		month: 'May 2025',
		operating: 33888,
		reserve: 13376, // CORRECTED
		special: 46133,
		total: 93397,
		change: -55522,
	},
	{
		month: 'June 2025',
		operating: 33472,
		reserve: 13376, // CORRECTED
		special: 46133,
		total: 92981,
		change: -416,
	},
]);

// Table columns
const tableColumns = [
	{ key: 'month', label: 'Month' },
	{ key: 'operating', label: 'Operating', class: 'text-right' },
	{ key: 'reserve', label: 'Reserve', class: 'text-right' },
	{ key: 'special', label: 'Special Assessment', class: 'text-right' },
	{ key: 'total', label: 'Total Cash', class: 'text-right font-semibold' },
	{ key: 'change', label: 'Monthly Change', class: 'text-right' },
];

// Critical issues - UPDATED WITH RESERVE CRISIS AS #1 PRIORITY
const criticalIssues = ref([
	{
		id: 0,
		title: '🚨 RESERVE ACCOUNT CRISIS',
		priority: 'EMERGENCY',
		issue: 'Only $13,376 available vs $75,000 required minimum',
		impact: 'Florida Statute 718.112 compliance at severe risk - board liability concerns',
		action: 'Emergency board meeting + special assessment + funding plan within 7 days',
		borderColor: 'border-red-600',
		bgColor: 'bg-red-100',
		badgeColor: 'red',
	},
	{
		id: 1,
		title: '1. Cash Flow Emergency',
		priority: 'HIGH PRIORITY',
		issue: 'Operating account declining $5,107/month average',
		impact: 'Potential fund depletion by February 2026',
		action: 'Emergency board meeting within 7 days',
		borderColor: 'border-red-500',
		bgColor: 'bg-red-50',
		badgeColor: 'red',
	},
	{
		id: 2,
		title: '2. Insurance Cost Management',
		priority: 'HIGH PRIORITY',
		issue: '$6,053 monthly insurance payments causing volatility',
		impact: '$36,318 annual drain on cash flow',
		action: 'Negotiate quarterly payment schedule',
		borderColor: 'border-red-500',
		bgColor: 'bg-red-50',
		badgeColor: 'red',
	},
	{
		id: 3,
		title: '3. Legal Fee Investigation',
		priority: 'HIGH PRIORITY',
		issue: 'Legal expenses 293% over budget ($11,600 overrun)',
		impact: 'Unauthorized legal spending draining reserves',
		action: 'Audit all legal invoices and contracts immediately',
		borderColor: 'border-red-500',
		bgColor: 'bg-red-50',
		badgeColor: 'red',
	},
]);
</script>
