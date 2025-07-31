<template>
	<div class="space-y-6">
		<!-- CRITICAL ALERT - Low Reserves -->
		<UAlert
			color="red"
			variant="solid"
			title="🚨 CRITICAL: Reserve Account Severely Under-Funded"
			icon="i-heroicons-exclamation-triangle"
		>
			<template #description>
				<div class="mt-3 space-y-2">
					<p class="font-semibold">IMMEDIATE BOARD ACTION REQUIRED:</p>
					<ul class="list-disc pl-5 space-y-1">
						<li>
							Current balance: ${{ endingBalance.toLocaleString() }} (only {{ fundingLevel }}% of required minimum)
						</li>
						<li>Shortfall: ${{ shortfall.toLocaleString() }} below Florida Statute requirements</li>
						<li>Board meeting required within 7 days to address reserve crisis</li>
						<li>Special assessment likely needed to restore proper funding levels</li>
					</ul>
				</div>
			</template>
		</UAlert>

		<!-- Account Summary -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<UCard class="border-red-200 bg-red-50">
				<div class="text-center">
					<p class="text-sm font-medium text-red-700 uppercase tracking-wider">Beginning Balance</p>
					<p class="mt-2 text-2xl font-bold text-red-900">${{ beginningBalance.toLocaleString() }}</p>
					<p class="text-xs text-red-600 mt-1">CRITICALLY LOW</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Contributions</p>
					<p class="mt-2 text-2xl font-bold text-green-600">+${{ totalContributions.toLocaleString() }}</p>
					<p class="text-xs text-red-600 mt-1">No contributions made</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Interest Earned</p>
					<p class="mt-2 text-2xl font-bold text-green-600">+${{ interestEarned.toFixed(2) }}</p>
					<p class="text-xs text-gray-500 mt-1">Minimal interest on low balance</p>
				</div>
			</UCard>

			<UCard class="border-red-200 bg-red-50">
				<div class="text-center">
					<p class="text-sm font-medium text-red-700 uppercase tracking-wider">Ending Balance</p>
					<p class="mt-2 text-2xl font-bold text-red-900">${{ endingBalance.toLocaleString() }}</p>
					<p class="text-xs text-red-600 mt-1">{{ fundingLevel }}% OF REQUIRED</p>
				</div>
			</UCard>
		</div>

		<!-- Compliance Status - UPDATED FOR CRITICAL STATUS -->
		<UAlert
			color="red"
			variant="subtle"
			title="⚠️ NON-COMPLIANT: Reserve Account Below Legal Requirements"
			icon="i-heroicons-x-circle"
		>
			<template #description>
				<div class="mt-2 space-y-1">
					<p>❌ Account balance ${{ shortfall.toLocaleString() }} below minimum requirement</p>
					<p>❌ Florida Statute 718.112 compliance at severe risk</p>
					<p>❌ Board fiduciary duty may be compromised</p>
					<p>❌ Association vulnerable to special assessments and legal action</p>
				</div>
			</template>
		</UAlert>

		<!-- Reserve Fund Analysis -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">
					Reserve Fund Analysis - CRITICAL STATUS
				</h3>
			</template>

			<div class="space-y-6">
				<!-- Reserve Study Compliance -->
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<h4 class="font-semibold text-red-900 mb-3">⚠️ Reserve Study Compliance - NON-COMPLIANT</h4>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<p class="text-sm text-gray-600">Current Balance</p>
							<p class="text-xl font-bold text-red-900">${{ endingBalance.toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-sm text-gray-600">Required Minimum</p>
							<p class="text-xl font-bold text-gray-900">${{ requiredMinimum.toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-sm text-gray-600">Funding Level</p>
							<p class="text-xl font-bold text-red-600">{{ fundingLevel }}%</p>
						</div>
					</div>
					<div class="mt-4">
						<div class="bg-red-200 rounded-full h-3 overflow-hidden">
							<div
								class="h-full bg-red-600 transition-all duration-500"
								:style="`width: ${Math.min(fundingLevel, 100)}%`"
							/>
						</div>
						<p class="text-sm text-red-800 mt-2 font-semibold">
							Reserve account is CRITICALLY UNDER-FUNDED at {{ fundingLevel }}% of required minimum
						</p>
					</div>
				</div>

				<!-- Reserve Components Status -->
				<div class="space-y-4">
					<h4 class="font-semibold text-gray-900">Reserve Components - Funding Status</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div
							v-for="component in reserveComponents"
							:key="component.name"
							class="border border-red-200 rounded p-3 bg-red-50"
						>
							<div class="flex justify-between items-start">
								<div>
									<h5 class="font-medium text-gray-900">{{ component.name }}</h5>
									<p class="text-xs text-gray-600 mt-1">{{ component.description }}</p>
									<p class="text-xs text-gray-500 mt-1">Next: {{ component.nextScheduled }}</p>
								</div>
								<div class="text-right">
									<p class="text-sm font-bold text-red-600">UNDERFUNDED</p>
									<p class="text-xs text-gray-600">Need: ${{ component.allocated.toLocaleString() }}</p>
									<p class="text-xs text-red-600">Available: $0</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Transaction History -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Transaction History</h3>
			</template>

			<div class="space-y-4">
				<div v-if="transactions.length === 0" class="text-center py-8 text-gray-500">
					<p>No transactions this month</p>
					<p class="text-sm mt-2">Reserve account shows minimal activity - interest payments only</p>
				</div>
				<div v-else>
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Description
								</th>
								<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
								<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							<tr v-for="transaction in transactions" :key="transaction.date">
								<td class="px-4 py-2 text-sm text-gray-900">{{ transaction.date }}</td>
								<td class="px-4 py-2 text-sm text-gray-900">{{ transaction.description }}</td>
								<td
									class="px-4 py-2 text-sm text-right"
									:class="transaction.amount > 0 ? 'text-green-600' : 'text-red-600'"
								>
									{{ transaction.amount > 0 ? '+' : '' }}${{ Math.abs(transaction.amount).toFixed(2) }}
								</td>
								<td class="px-4 py-2 text-sm text-gray-900 text-right">${{ transaction.balance.toLocaleString() }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</UCard>

		<!-- CRITICAL Recommendations -->
		<UCard class="border-red-200">
			<template #header>
				<h3 class="text-lg font-bold text-red-900 uppercase tracking-wider">🚨 CRITICAL ACTIONS REQUIRED</h3>
			</template>

			<div class="space-y-3">
				<div v-for="(rec, index) in criticalRecommendations" :key="index" class="flex items-start space-x-3">
					<div class="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
						<span class="text-sm font-bold text-red-600">{{ index + 1 }}</span>
					</div>
					<div class="flex-1">
						<p class="text-sm font-semibold text-red-900">{{ rec.title }}</p>
						<p class="text-sm text-gray-700 mt-1">{{ rec.description }}</p>
						<p v-if="rec.timeline" class="text-xs text-red-600 mt-1 font-medium">{{ rec.timeline }}</p>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useReconciliationData } from '~/composables/useReconciliationData';

const props = defineProps({
	month: {
		type: String,
		required: true,
	},
});

// Use the composable for data management
const { getReserveData, getReserveComplianceStatus } = useReconciliationData();

// Get reactive data for current month
const currentMonthData = computed(() => getReserveData(props.month));
const complianceStatus = computed(() => getReserveComplianceStatus(props.month));

// Account balances - now reactive and corrected
const beginningBalance = computed(() => currentMonthData.value.beginningBalance);
const totalContributions = computed(() => currentMonthData.value.contributions);
const interestEarned = computed(() => currentMonthData.value.interest);
const endingBalance = computed(() => currentMonthData.value.endingBalance);
const shortfall = computed(() => currentMonthData.value.shortfall || 0);

// Transactions for display
const transactions = computed(() => currentMonthData.value.transactions || []);

// Reserve study data - updated for reality
const requiredMinimum = ref(75000);
const fundingLevel = computed(() => Math.round((endingBalance.value / requiredMinimum.value) * 100));

// Reserve components - updated to show critical underfunding
const reserveComponents = ref([
	{
		name: 'Roof Replacement',
		description: 'Complete roof replacement and repairs',
		allocated: 35000,
		lifeRemaining: 8,
		nextScheduled: '2033',
	},
	{
		name: 'Elevator Modernization',
		description: 'Major elevator upgrades and modernization',
		allocated: 25000,
		lifeRemaining: 5,
		nextScheduled: '2030',
	},
	{
		name: 'Painting & Waterproofing',
		description: 'Exterior painting and waterproofing',
		allocated: 20000,
		lifeRemaining: 3,
		nextScheduled: '2028',
	},
	{
		name: 'Parking Lot Resurfacing',
		description: 'Asphalt repair and resurfacing',
		allocated: 15000,
		lifeRemaining: 4,
		nextScheduled: '2029',
	},
]);

// Critical recommendations
const criticalRecommendations = ref([
	{
		title: 'EMERGENCY BOARD MEETING',
		description: 'Call emergency board meeting within 7 days to address reserve crisis and develop funding plan.',
		timeline: 'IMMEDIATE - Within 7 days',
	},
	{
		title: 'IMMEDIATE SPECIAL ASSESSMENT',
		description: 'Implement emergency special assessment to restore reserves to minimum required levels.',
		timeline: 'Within 30 days',
	},
	{
		title: 'RESERVE STUDY UPDATE',
		description: 'Engage professional reserve study company to update analysis with current critical funding levels.',
		timeline: 'Within 60 days',
	},
	{
		title: 'LEGAL CONSULTATION',
		description: 'Consult with HOA attorney regarding fiduciary duty compliance and reserve funding requirements.',
		timeline: 'Within 14 days',
	},
	{
		title: 'FUNDING PLAN',
		description:
			'Develop comprehensive plan to restore reserves including monthly contributions and special assessments.',
		timeline: 'Within 30 days',
	},
	{
		title: 'FINANCIAL CONTROLS',
		description: 'Implement enhanced financial controls and regular reserve account monitoring procedures.',
		timeline: 'IMMEDIATE',
	},
]);
</script>
