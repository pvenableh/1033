<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<div class="bg-gradient-to-br from-red-500 to-red-600 text-white py-8 px-6">
			<div class="max-w-6xl mx-auto text-center">
				<div class="flex items-center justify-center mb-4">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 mr-3" />
					<h1 class="text-4xl font-bold">URGENT: Board Action Required</h1>
				</div>
				<h2 class="text-2xl font-semibold mb-2">Lenox Plaza Association, Inc.</h2>
				<p class="text-xl">1033 Lenox Ave Apt 311, Miami Beach, FL 33139</p>
				<div class="mt-4 bg-white bg-opacity-20 rounded-lg p-4 inline-block">
					<p class="font-semibold">Financial Crisis Report - July 31, 2025</p>
					<p>
						Status:
						<span class="font-bold text-yellow-300">CRITICAL REVIEW NEEDED</span>
					</p>
				</div>
			</div>
		</div>

		<div class="max-w-6xl mx-auto px-6 py-8">
			<!-- Executive Summary -->
			<UCard class="mb-8 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-chart-bar-square" class="w-6 h-6 mr-3 text-red-600" />
						<h2 class="text-2xl font-bold text-red-800">Executive Summary</h2>
					</div>
				</template>

				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
					<div class="text-center p-4 bg-white rounded-lg shadow">
						<UIcon name="i-heroicons-gauge" class="w-8 h-8 mx-auto mb-2 text-gray-600" />
						<div class="text-sm text-gray-600">Financial Health</div>
						<div class="text-2xl font-bold text-red-600">35%</div>
						<div class="text-sm text-red-600">NEEDS ATTENTION</div>
					</div>

					<div class="text-center p-4 bg-white rounded-lg shadow">
						<UIcon name="i-heroicons-arrow-trending-down" class="w-8 h-8 mx-auto mb-2 text-red-600" />
						<div class="text-sm text-gray-600">Cash Decline (6 months)</div>
						<div class="text-2xl font-bold text-red-600">-$30,642</div>
						<div class="text-sm text-gray-600">January to June</div>
					</div>

					<div class="text-center p-4 bg-white rounded-lg shadow">
						<UIcon name="i-heroicons-fire" class="w-8 h-8 mx-auto mb-2 text-red-600" />
						<div class="text-sm text-gray-600">Monthly Burn Rate</div>
						<div class="text-2xl font-bold text-red-600">-$5,107</div>
						<div class="text-sm text-gray-600">Average per month</div>
					</div>

					<div class="text-center p-4 bg-white rounded-lg shadow">
						<UIcon name="i-heroicons-clock" class="w-8 h-8 mx-auto mb-2 text-red-600" />
						<div class="text-sm text-gray-600">Runway</div>
						<div class="text-2xl font-bold text-red-600">6.6 months</div>
						<div class="text-sm text-gray-600">Before depletion</div>
					</div>
				</div>

				<UAlert
					color="red"
					variant="solid"
					title="🔥 CRITICAL FINDING"
					description="Your operating account has lost 27.4% of its value in just 6 months. At the current rate of decline (-$5,107/month), the operating account will be depleted by early 2026 unless immediate action is taken."
				/>
			</UCard>

			<!-- Current Account Balances and Trend Chart -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				<UCard>
					<template #header>
						<div class="flex items-center">
							<UIcon name="i-heroicons-banknotes" class="w-6 h-6 mr-3 text-blue-600" />
							<h3 class="text-xl font-bold">Account Balances (June 30, 2025)</h3>
						</div>
					</template>

					<div class="space-y-4">
						<div
							v-for="account in accountBalances"
							:key="account.name"
							class="flex justify-between items-center p-3 rounded-lg"
							:class="account.bgColor"
						>
							<div>
								<div class="font-semibold">{{ account.name }}</div>
								<div class="text-sm text-gray-600">{{ account.description }}</div>
							</div>
							<div :class="account.textColor" class="text-xl font-bold">${{ account.balance.toLocaleString() }}</div>
						</div>

						<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-300">
							<div class="font-bold">TOTAL CASH POSITION</div>
							<div class="text-2xl font-bold text-gray-800">${{ totalCash.toLocaleString() }}</div>
						</div>
					</div>
				</UCard>

				<UCard>
					<template #header>
						<div class="flex items-center">
							<UIcon name="i-heroicons-chart-bar" class="w-6 h-6 mr-3 text-green-600" />
							<h3 class="text-xl font-bold">6-Month Trend Analysis</h3>
						</div>
					</template>

					<div class="h-64">
						<Line :data="chartData" :options="chartOptions" />
					</div>
				</UCard>
			</div>

			<!-- Critical Issues -->
			<UCard class="mb-8">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mr-3 text-red-600" />
						<h2 class="text-2xl font-bold">Critical Issues Requiring Immediate Action</h2>
					</div>
				</template>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div
						v-for="issue in criticalIssues"
						:key="issue.id"
						class="border-l-4 p-4 rounded-r-lg"
						:class="[issue.borderColor, issue.bgColor]"
					>
						<UBadge :color="issue.badgeColor" variant="solid" class="mb-2">
							{{ issue.priority }}
						</UBadge>
						<h3 class="font-bold text-lg mb-2">{{ issue.title }}</h3>
						<div class="space-y-2 text-sm">
							<p>
								<strong>Issue:</strong>
								{{ issue.issue }}
							</p>
							<p>
								<strong>Impact:</strong>
								{{ issue.impact }}
							</p>
							<p>
								<strong>Action:</strong>
								{{ issue.action }}
							</p>
						</div>
					</div>
				</div>
			</UCard>

			<!-- Monthly Breakdown Table -->
			<UCard class="mb-8">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-calendar-days" class="w-6 h-6 mr-3 text-blue-600" />
						<h3 class="text-xl font-bold">Monthly Account Summary</h3>
					</div>
				</template>

				<UTable :rows="monthlyData" :columns="tableColumns" class="w-full">
					<template #change-data="{ row }">
						<span :class="getChangeColor(row.change)">
							{{ row.change !== null ? (row.change >= 0 ? '+' : '') + '$' + row.change.toLocaleString() : '-' }}
						</span>
					</template>
				</UTable>
			</UCard>

			<!-- Action Plan -->
			<UCard class="mb-8">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-clipboard-document-list" class="w-6 h-6 mr-3 text-blue-600" />
						<h2 class="text-2xl font-bold">30-60-90 Day Action Plan</h2>
					</div>
				</template>

				<div class="space-y-6">
					<div
						v-for="period in actionPlan"
						:key="period.id"
						class="border-l-4 p-6 rounded-r-lg"
						:class="[period.borderColor, period.bgColor]"
					>
						<div class="flex items-center mb-4">
							<UIcon name="i-heroicons-clock" class="w-5 h-5 mr-2" :class="period.iconColor" />
							<h3 class="text-xl font-bold" :class="period.titleColor">{{ period.title }}</h3>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<div
									v-for="(item, index) in period.items.slice(0, Math.ceil(period.items.length / 2))"
									:key="index"
									class="flex items-start"
								>
									<UIcon name="i-heroicons-square-2-stack" class="w-4 h-4 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
									<span class="text-sm">{{ item }}</span>
								</div>
							</div>
							<div class="space-y-2">
								<div
									v-for="(item, index) in period.items.slice(Math.ceil(period.items.length / 2))"
									:key="index"
									class="flex items-start"
								>
									<UIcon name="i-heroicons-square-2-stack" class="w-4 h-4 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
									<span class="text-sm">{{ item }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</UCard>

			<!-- Recommendations -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<UCard v-for="rec in recommendations" :key="rec.id">
					<template #header>
						<div class="flex items-center">
							<UIcon :name="rec.icon" :class="rec.iconColor" class="w-6 h-6 mr-3" />
							<h3 class="text-lg font-bold">{{ rec.title }}</h3>
						</div>
					</template>

					<ul class="space-y-2 text-sm">
						<li v-for="(item, index) in rec.items" :key="index" class="flex items-start">
							<UIcon
								name="i-heroicons-chevron-right"
								:class="rec.iconColor"
								class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
							/>
							<span>{{ item }}</span>
						</li>
					</ul>
				</UCard>
			</div>

			<!-- Legal Compliance -->
			<UCard class="mb-8">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-scale" class="w-6 h-6 mr-3 text-purple-600" />
						<h2 class="text-2xl font-bold">⚖️ Legal & Compliance Status</h2>
					</div>
				</template>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="bg-green-50 border border-green-200 rounded-lg p-6">
						<div class="flex items-center mb-4">
							<UIcon name="i-heroicons-check-circle" class="w-6 h-6 mr-3 text-green-700" />
							<h3 class="text-lg font-bold text-green-800">Currently Compliant</h3>
						</div>
						<ul class="space-y-2 text-sm text-green-800">
							<li v-for="item in compliance.compliant" :key="item" class="flex items-start">
								<UIcon name="i-heroicons-check" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
								<span>{{ item }}</span>
							</li>
						</ul>
					</div>

					<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
						<div class="flex items-center mb-4">
							<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mr-3 text-yellow-700" />
							<h3 class="text-lg font-bold text-yellow-800">Areas of Concern</h3>
						</div>
						<ul class="space-y-2 text-sm text-yellow-800">
							<li v-for="item in compliance.concerns" :key="item" class="flex items-start">
								<UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
								<span>{{ item }}</span>
							</li>
						</ul>
					</div>
				</div>
			</UCard>

			<!-- Next Steps -->
			<UCard class="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-phone" class="w-6 h-6 mr-3" />
						<h2 class="text-2xl font-bold">📞 Next Steps & Contacts</h2>
					</div>
				</template>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="bg-white bg-opacity-70 rounded-lg p-6">
						<h4 class="text-lg font-bold mb-4">Immediate Actions:</h4>
						<ol class="space-y-2 text-sm list-decimal list-inside">
							<li v-for="action in nextSteps.immediate" :key="action">{{ action }}</li>
						</ol>
					</div>

					<div class="bg-white bg-opacity-70 rounded-lg p-6">
						<h4 class="text-lg font-bold mb-4">Professional Resources:</h4>
						<ul class="space-y-2 text-sm">
							<li v-for="resource in nextSteps.resources" :key="resource.title">
								<strong>{{ resource.title }}:</strong>
								{{ resource.description }}
							</li>
						</ul>
					</div>
				</div>
			</UCard>

			<!-- Navigation -->
			<div class="mt-8 flex justify-center space-x-4">
				<UButton to="/financials/hoa/reconciliation" color="blue" size="lg">
					<UIcon name="i-heroicons-document-text" class="w-5 h-5 mr-2" />
					View Monthly Reports
				</UButton>

				<UButton to="/financials/hoa/budget-analysis" color="green" size="lg">
					<UIcon name="i-heroicons-calculator" class="w-5 h-5 mr-2" />
					Budget Analysis
				</UButton>
			</div>
		</div>
	</div>
</template>

<script setup>
import { Line } from 'vue-chartjs';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// SEO
useHead({
	title: 'HOA Financial Crisis Report - Lenox Plaza',
	meta: [{ name: 'description', content: 'Critical financial analysis and action plan for Lenox Plaza HOA' }],
});

// Account balances data
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
		description: 'Emergency reserves',
		balance: 14317,
		bgColor: 'bg-green-50',
		textColor: 'text-green-600',
	},
	{
		name: 'Special Assessment (...5872)',
		description: '40-year project',
		balance: 46133,
		bgColor: 'bg-blue-50',
		textColor: 'text-blue-600',
	},
]);

// Computed total cash
const totalCash = computed(() => {
	return accountBalances.value.reduce((sum, account) => sum + account.balance, 0);
});

// Monthly data
const monthlyData = ref([
	{ month: 'January 2025', operating: 64114, reserve: 12537, special: 31985, total: 108636, change: null },
	{ month: 'February 2025', operating: 54853, reserve: 13083, special: 23077, total: 91013, change: -17623 },
	{ month: 'March 2025', operating: 44695, reserve: 13376, special: 93277, total: 151348, change: 60335 },
	{ month: 'April 2025', operating: 52296, reserve: 13376, special: 83247, total: 148919, change: -2429 },
	{ month: 'May 2025', operating: 33888, reserve: 13499, special: 46133, total: 93520, change: -55399 },
	{ month: 'June 2025', operating: 33472, reserve: 14317, special: 46133, total: 93922, change: 402 },
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

// Critical issues
const criticalIssues = ref([
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
		title: '3. Budget vs Actual Variance',
		priority: 'MEDIUM PRIORITY',
		issue: 'Actual expenses exceeding budget projections',
		impact: 'Poor financial forecasting and planning',
		action: 'Revise 2025 budget immediately',
		borderColor: 'border-yellow-500',
		bgColor: 'bg-yellow-50',
		badgeColor: 'yellow',
	},
]);

// Action plan
const actionPlan = ref([
	{
		id: 1,
		title: 'Next 30 Days - CRISIS MODE',
		borderColor: 'border-red-500',
		bgColor: 'bg-red-50',
		iconColor: 'text-red-600',
		titleColor: 'text-red-800',
		items: [
			'Schedule emergency board meeting within 7 days',
			'Conduct cash flow analysis with all board members',
			'Contact First Insurance for quarterly payments',
			'Review and approve all pending expenditures over $500',
			'Implement expense approval process',
			'Send notice to residents about potential assessment increase',
		],
	},
	{
		id: 2,
		title: 'Next 60 Days - STABILIZATION',
		borderColor: 'border-yellow-500',
		bgColor: 'bg-yellow-50',
		iconColor: 'text-yellow-600',
		titleColor: 'text-yellow-800',
		items: [
			'Revise 2025 budget based on actual spending patterns',
			'Implement monthly financial review meetings',
			'Negotiate better terms with major vendors',
			'Consider temporary special assessment if needed',
			'Establish 3-month cash flow projections',
			'Review reserve funding requirements',
		],
	},
	{
		id: 3,
		title: 'Next 90 Days - STRATEGIC PLANNING',
		borderColor: 'border-green-500',
		bgColor: 'bg-green-50',
		iconColor: 'text-green-600',
		titleColor: 'text-green-800',
		items: [
			'Prepare 2026 budget with realistic projections',
			'Evaluate management company performance',
			'Conduct reserve study if not done recently',
			'Implement long-term financial planning',
			'Consider assessment increase for 2026',
			'Establish financial policies and procedures',
		],
	},
]);

// Recommendations
const recommendations = ref([
	{
		id: 1,
		title: '💰 Revenue Enhancement',
		icon: 'i-heroicons-banknotes',
		iconColor: 'text-green-600',
		items: [
			'Consider 8-12% assessment increase for 2026',
			'Implement late fees for delinquent payments',
			'Review and adjust special assessment schedule',
			'Explore additional revenue streams',
		],
	},
	{
		id: 2,
		title: '💸 Cost Management',
		icon: 'i-heroicons-scissors',
		iconColor: 'text-red-600',
		items: [
			'Switch insurance to quarterly payments (immediate)',
			'Renegotiate waste management contract',
			'Review all vendor contracts annually',
			'Competitive bidding for services over $2,000',
		],
	},
	{
		id: 3,
		title: '📊 Financial Controls',
		icon: 'i-heroicons-shield-check',
		iconColor: 'text-blue-600',
		items: [
			'Monthly financial statements to board',
			'Treasurer approval for expenses over $500',
			'Quarterly budget vs actual reviews',
			'Annual CPA review (recommended)',
		],
	},
]);

// Compliance data
const compliance = ref({
	compliant: [
		'Proper account segregation (Operating, Reserve, Special)',
		'Bank statements available for owner inspection',
		'Special assessment funds properly restricted',
	],
	concerns: [
		'Reserve funding may be insufficient (FL Statute 718.112)',
		'Budget revisions needed for accuracy',
		'Consider CPA review due to revenue level',
	],
});

// Next steps
const nextSteps = ref({
	immediate: [
		'Board president call emergency meeting',
		'Treasurer review this report with management company',
		'Secretary prepare owner notification',
		'Contact First Insurance for payment arrangement',
	],
	resources: [
		{ title: 'CPA', description: 'Consider annual review' },
		{ title: 'Attorney', description: 'Review legal compliance' },
		{ title: 'Reserve Study', description: 'Update if over 3 years old' },
		{ title: 'Management Company', description: 'VTE Consulting' },
	],
});

// Chart data
const chartData = computed(() => ({
	labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
	datasets: [
		{
			label: 'Operating Balance',
			data: [64114, 54853, 44695, 52296, 33888, 33472],
			borderColor: '#dc2626',
			backgroundColor: 'rgba(220, 38, 38, 0.1)',
			tension: 0.1,
			fill: true,
			pointBackgroundColor: '#dc2626',
			pointBorderColor: '#ffffff',
			pointBorderWidth: 2,
			pointRadius: 5,
		},
		{
			label: 'Danger Threshold',
			data: [30000, 30000, 30000, 30000, 30000, 30000],
			borderColor: '#ef4444',
			borderDash: [5, 5],
			fill: false,
			pointRadius: 0,
		},
	],
}));

// Chart options
const chartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top',
		},
		title: {
			display: true,
			text: 'Operating Account Balance Trend (Dangerous Decline)',
			font: {
				size: 14,
				weight: 'bold',
			},
		},
	},
	scales: {
		y: {
			beginAtZero: false,
			min: 25000,
			ticks: {
				callback: function (value) {
					return '$' + value.toLocaleString();
				},
			},
			grid: {
				color: 'rgba(0, 0, 0, 0.1)',
			},
		},
		x: {
			grid: {
				color: 'rgba(0, 0, 0, 0.1)',
			},
		},
	},
});

// Helper function for change color
const getChangeColor = (change) => {
	if (change === null) return '';
	return change >= 0 ? 'text-green-600' : 'text-red-600';
};
</script>

<style scoped>
@media print {
	.no-print {
		display: none !important;
	}
	.print-break {
		page-break-before: always;
	}
}
</style>
