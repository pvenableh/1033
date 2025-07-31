<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Critical Alert Banner -->
		<div v-if="showCriticalAlert" class="bg-red-900 text-white">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mr-2 animate-pulse" />
						<span class="font-bold">
							CRITICAL: Reserve Account Crisis - Only ${{ currentReserveBalance.toLocaleString() }} of $75,000 Required
						</span>
					</div>
					<UButton
						color="white"
						variant="ghost"
						size="sm"
						icon="i-heroicons-x-mark"
						@click="showCriticalAlert = false"
					/>
				</div>
			</div>
		</div>

		<!-- Header -->
		<div class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
						<p class="mt-2 text-gray-600">Comprehensive HOA Financial Analysis & Compliance Monitoring</p>
					</div>
					<div class="flex space-x-3">
						<USelectMenu v-model="selectedMonth" :options="availableMonths" placeholder="Select Month" class="w-40">
							<template #label>
								<span class="text-sm">{{ selectedMonth }}</span>
							</template>
						</USelectMenu>
						<UButton color="primary" icon="i-heroicons-document-arrow-down" @click="exportReport">
							Export Report
						</UButton>
					</div>
				</div>
			</div>
		</div>

		<!-- Critical Metrics -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
				<UCard v-for="metric in criticalMetrics" :key="metric.label" :class="metric.cardClass">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">{{ metric.label }}</p>
							<p class="mt-2 text-3xl font-bold" :class="metric.valueClass">
								{{ metric.prefix }}{{ metric.value }}{{ metric.suffix }}
							</p>
							<p class="mt-1 text-sm" :class="metric.changeClass">
								<UIcon :name="metric.changeIcon" class="w-4 h-4 inline" />
								{{ metric.change }}
							</p>
						</div>
						<div class="p-3 rounded-full" :class="metric.iconBg">
							<UIcon :name="metric.icon" class="w-8 h-8" :class="metric.iconColor" />
						</div>
					</div>
				</UCard>
			</div>

			<!-- Main Content Tabs -->
			<UTabs :items="mainTabs" class="space-y-6">
				<template #item="{ item }">
					<!-- Overview Tab -->
					<div v-if="item.key === 'overview'" class="space-y-6">
						<!-- Account Health Status -->
						<UCard>
							<template #header>
								<h3 class="text-lg font-bold text-gray-900">Account Health Status</h3>
							</template>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div v-for="account in accountHealthStatus" :key="account.name" class="space-y-3">
									<div class="flex items-center justify-between">
										<h4 class="font-semibold text-gray-900">{{ account.name }}</h4>
										<UBadge :color="account.statusColor" variant="subtle">{{ account.status }}</UBadge>
									</div>
									<div class="space-y-2">
										<div class="flex justify-between text-sm">
											<span class="text-gray-600">Balance</span>
											<span class="font-medium">${{ account.balance.toLocaleString() }}</span>
										</div>
										<div class="w-full bg-gray-200 rounded-full h-3">
											<div
												class="h-3 rounded-full transition-all duration-500"
												:class="account.barColor"
												:style="`width: ${account.healthPercent}%`"
											/>
										</div>
										<p class="text-xs text-gray-600">{{ account.description }}</p>
									</div>
								</div>
							</div>
						</UCard>

						<!-- Cash Flow Trends -->
						<UCard>
							<template #header>
								<div class="flex items-center justify-between">
									<h3 class="text-lg font-bold text-gray-900">Cash Flow Trends</h3>
									<div class="flex space-x-2">
										<UButton
											v-for="view in chartViews"
											:key="view"
											:color="selectedChartView === view ? 'primary' : 'gray'"
											variant="soft"
											size="sm"
											@click="selectedChartView = view"
										>
											{{ view }}
										</UButton>
									</div>
								</div>
							</template>
							<div class="h-80">
								<Line :data="cashFlowChartData" :options="chartOptions" />
							</div>
						</UCard>

						<!-- Violation Summary -->
						<UCard v-if="totalViolations > 0" class="border-red-200 bg-red-50">
							<template #header>
								<div class="flex items-center">
									<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mr-2 text-red-600" />
									<h3 class="text-lg font-bold text-red-900">Compliance Violations</h3>
								</div>
							</template>
							<div class="space-y-4">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div v-for="violation in violationSummary" :key="violation.type" class="bg-white rounded-lg p-4">
										<div class="flex items-center justify-between mb-2">
											<h4 class="font-semibold text-gray-900">{{ violation.type }}</h4>
											<UBadge color="red" variant="solid">{{ violation.count }}</UBadge>
										</div>
										<p class="text-sm text-gray-600">{{ violation.description }}</p>
										<p class="text-sm font-medium text-red-600 mt-2">Total: ${{ violation.amount.toLocaleString() }}</p>
									</div>
								</div>
								<UAlert
									color="red"
									icon="i-heroicons-shield-exclamation"
									title="Immediate Action Required"
									description="These violations must be addressed immediately to avoid personal liability for board members."
								/>
							</div>
						</UCard>
					</div>

					<!-- Accounts Tab -->
					<div v-if="item.key === 'accounts'" class="space-y-6">
						<UTabs :items="accountTabs" class="space-y-6">
							<template #item="{ item: accountItem }">
								<!-- Operating Account -->
								<div v-if="accountItem.key === 'operating'" class="space-y-6">
									<FinanceAccountSummaryCard :account="operatingAccountSummary" />

									<!-- Revenue vs Expenses Chart -->
									<UCard>
										<template #header>
											<h4 class="font-bold text-gray-900">Revenue vs Expenses</h4>
										</template>
										<div class="h-64">
											<Bar :data="revenueExpenseChartData" :options="barChartOptions" />
										</div>
									</UCard>

									<!-- Transaction Details -->
									<FinanceTransactionAccordion
										:deposits="operatingData.deposits"
										:withdrawals="operatingData.withdrawals"
										:violations="operatingData.violations"
									/>
								</div>

								<!-- Special Assessment Account -->
								<div v-if="accountItem.key === 'special'" class="space-y-6">
									<FinanceAccountSummaryCard :account="specialAccountSummary" />

									<!-- Project Progress -->
									<UCard>
										<template #header>
											<h4 class="font-bold text-gray-900">40-Year Recertification Progress</h4>
										</template>
										<div class="space-y-4">
											<div>
												<div class="flex justify-between text-sm mb-2">
													<span>Collection Progress</span>
													<span class="font-medium">{{ collectionProgress }}% Complete</span>
												</div>
												<UProgress :value="collectionProgress" color="primary" size="lg" />
											</div>
											<div>
												<div class="flex justify-between text-sm mb-2">
													<span>Project Timeline</span>
													<span class="font-medium">{{ projectProgress }}% Complete</span>
												</div>
												<UProgress :value="projectProgress" color="green" size="lg" />
											</div>
										</div>
									</UCard>

									<!-- Improper Transfers Alert -->
									<FinanceViolationAlert
										v-if="specialData.improperTransfers?.length > 0"
										:violations="specialData.improperTransfers"
										account="Special Assessment"
									/>
								</div>

								<!-- Reserve Account -->
								<div v-if="accountItem.key === 'reserve'" class="space-y-6">
									<FinanceAccountSummaryCard :account="reserveAccountSummary" :critical="true" />

									<!-- Reserve Crisis Alert -->
									<UAlert color="red" icon="i-heroicons-exclamation-triangle" title="CRITICAL RESERVE CRISIS">
										<template #description>
											<div class="space-y-2">
												<p>Reserve account is ${{ reserveShortfall.toLocaleString() }} below the statutory minimum.</p>
												<p class="font-semibold">Immediate actions required:</p>
												<ul class="list-disc list-inside ml-4 space-y-1">
													<li>Emergency board meeting within 7 days</li>
													<li>Special assessment to restore minimum balance</li>
													<li>Update reserve study with current funding levels</li>
													<li>Legal consultation on fiduciary duty compliance</li>
												</ul>
											</div>
										</template>
									</UAlert>

									<!-- Reserve Requirements Chart -->
									<UCard>
										<template #header>
											<h4 class="font-bold text-gray-900">Reserve Funding Analysis</h4>
										</template>
										<div class="h-64">
											<Doughnut :data="reserveFundingChartData" :options="doughnutChartOptions" />
										</div>
									</UCard>
								</div>
							</template>
						</UTabs>
					</div>

					<!-- Compliance Tab -->
					<div v-if="item.key === 'compliance'" class="space-y-6">
						<FinanceComplianceOverview :compliance="currentCompliance" />

						<!-- Miami Beach HOA Requirements -->
						<UCard>
							<template #header>
								<h3 class="text-lg font-bold text-gray-900">Miami Beach HOA Compliance Checklist</h3>
							</template>
							<div class="space-y-4">
								<div v-for="requirement in complianceRequirements" :key="requirement.statute">
									<div class="flex items-start space-x-3">
										<UIcon
											:name="requirement.compliant ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
											:class="requirement.compliant ? 'text-green-500' : 'text-red-500'"
											class="w-6 h-6 mt-0.5"
										/>
										<div class="flex-1">
											<h4 class="font-semibold text-gray-900">{{ requirement.title }}</h4>
											<p class="text-sm text-gray-600 mt-1">{{ requirement.description }}</p>
											<p v-if="!requirement.compliant" class="text-sm font-medium text-red-600 mt-2">
												Action: {{ requirement.action }}
											</p>
										</div>
									</div>
								</div>
							</div>
						</UCard>

						<!-- Risk Assessment -->
						<FinanceRiskAssessmentCard :risks="riskAssessment" />
					</div>

					<!-- Analytics Tab -->
					<div v-if="item.key === 'analytics'" class="space-y-6">
						<!-- Budget Performance -->
						<UCard>
							<template #header>
								<h3 class="text-lg font-bold text-gray-900">Budget Performance Analysis</h3>
							</template>
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<div class="h-64">
									<Radar :data="budgetPerformanceData" :options="radarChartOptions" />
								</div>
								<div class="space-y-4">
									<h4 class="font-semibold text-gray-900">Key Insights</h4>
									<ul class="space-y-2">
										<li v-for="insight in budgetInsights" :key="insight" class="flex items-start">
											<UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
											<span class="text-sm text-gray-700">{{ insight }}</span>
										</li>
									</ul>
								</div>
							</div>
						</UCard>

						<!-- Expense Categories -->
						<UCard>
							<template #header>
								<h3 class="text-lg font-bold text-gray-900">Expense Breakdown</h3>
							</template>
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<div class="h-64">
									<Pie :data="expenseCategoryData" :options="pieChartOptions" />
								</div>
								<FinanceExpenseTable :expenses="expensesByCategory" />
							</div>
						</UCard>

						<!-- Financial Projections -->
						<FinanceProjectionsCard :projections="financialProjections" />
					</div>
				</template>
			</UTabs>

			<!-- Action Items Footer -->
			<div class="mt-8 bg-orange-50 rounded-lg p-6">
				<h3 class="text-lg font-bold text-gray-900 mb-4">Priority Action Items</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div v-for="action in priorityActions" :key="action.id" class="bg-white rounded-lg p-4 shadow-sm">
						<div class="flex items-center justify-between mb-2">
							<UBadge :color="action.color" variant="subtle">{{ action.priority }}</UBadge>
							<span class="text-xs text-gray-500">Due: {{ action.deadline }}</span>
						</div>
						<h4 class="font-semibold text-gray-900 mb-1">{{ action.title }}</h4>
						<p class="text-sm text-gray-600">{{ action.description }}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Line, Bar, Doughnut, Pie, Radar } from 'vue-chartjs';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	RadialLinearScale,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';
import { useReconciliationData } from '~/composables/useReconciliationData';

// Register ChartJS components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	RadialLinearScale,
	Title,
	Tooltip,
	Legend,
	Filler,
);

// Use the reconciliation data composable
const { getMonthData, calculateTrends, checkCompliance, calculateFinancialHealth, getViolationCount } =
	useReconciliationData();

// State
const selectedMonth = ref('June 2025');
const availableMonths = ref(['June 2025', 'May 2025', 'April 2025', 'March 2025', 'February 2025', 'January 2025']);
const selectedChartView = ref('All Accounts');
const chartViews = ref(['All Accounts', 'Operating', 'Reserve', 'Special']);
const showCriticalAlert = ref(true);

// Get current month data
const currentMonthData = computed(() => getMonthData(selectedMonth.value));
const operatingData = computed(() => currentMonthData.value.operating || {});
const specialData = computed(() => currentMonthData.value.special || {});
const reserveData = computed(() => currentMonthData.value.reserve || {});
const currentCompliance = computed(() => currentMonthData.value.compliance || {});
const financialHealth = computed(() => currentMonthData.value.health || {});

// Critical Metrics
const currentReserveBalance = computed(() => reserveData.value.endingBalance || 0);
const reserveShortfall = computed(() => reserveData.value.shortfall || 0);
const totalViolations = computed(() => getViolationCount(selectedMonth.value));

const criticalMetrics = computed(() => [
	{
		label: 'Total Cash Position',
		value: financialHealth.value.totalCash?.toLocaleString() || '0',
		prefix: '$',
		suffix: '',
		change: 'vs last month',
		changeIcon:
			financialHealth.value.totalCash < 100000 ? 'i-heroicons-arrow-trending-down' : 'i-heroicons-arrow-trending-up',
		changeClass: financialHealth.value.totalCash < 100000 ? 'text-red-600' : 'text-green-600',
		valueClass: 'text-gray-900',
		icon: 'i-heroicons-currency-dollar',
		iconBg: 'bg-blue-100',
		iconColor: 'text-blue-600',
		cardClass: '',
	},
	{
		label: 'Reserve Shortfall',
		value: reserveShortfall.value.toLocaleString(),
		prefix: '-$',
		suffix: '',
		change: '82% underfunded',
		changeIcon: 'i-heroicons-exclamation-triangle',
		changeClass: 'text-red-600',
		valueClass: 'text-red-600',
		icon: 'i-heroicons-shield-exclamation',
		iconBg: 'bg-red-100',
		iconColor: 'text-red-600',
		cardClass: 'border-red-200',
	},
	{
		label: 'Compliance Violations',
		value: totalViolations.value.toString(),
		prefix: '',
		suffix: '',
		change: 'Fund mixing detected',
		changeIcon: 'i-heroicons-x-circle',
		changeClass: 'text-orange-600',
		valueClass: 'text-orange-600',
		icon: 'i-heroicons-exclamation-circle',
		iconBg: 'bg-orange-100',
		iconColor: 'text-orange-600',
		cardClass: totalViolations.value > 0 ? 'border-orange-200' : '',
	},
	{
		label: 'Financial Health Score',
		value: financialHealth.value.overallScore || 0,
		prefix: '',
		suffix: '%',
		change: currentCompliance.value.fiduciaryRisk || 'Unknown',
		changeIcon: 'i-heroicons-scale',
		changeClass: financialHealth.value.overallScore < 50 ? 'text-red-600' : 'text-gray-600',
		valueClass: financialHealth.value.overallScore < 50 ? 'text-red-600' : 'text-gray-900',
		icon: 'i-heroicons-chart-bar',
		iconBg: 'bg-gray-100',
		iconColor: 'text-gray-600',
		cardClass: '',
	},
]);

// Account Health Status
const accountHealthStatus = computed(() => [
	{
		name: 'Operating Account',
		balance: operatingData.value.endingBalance || 0,
		status: financialHealth.value.operatingHealth || 'Unknown',
		statusColor:
			financialHealth.value.operatingHealth === 'Critical'
				? 'red'
				: financialHealth.value.operatingHealth === 'Warning'
					? 'yellow'
					: 'green',
		healthPercent: Math.min(100, Math.max(0, (operatingData.value.endingBalance / 35000) * 100)),
		barColor:
			financialHealth.value.operatingHealth === 'Critical'
				? 'bg-red-500'
				: financialHealth.value.operatingHealth === 'Warning'
					? 'bg-yellow-500'
					: 'bg-green-500',
		description: 'Minimum balance: $35,000',
	},
	{
		name: 'Reserve Account',
		balance: reserveData.value.endingBalance || 0,
		status: 'Critical',
		statusColor: 'red',
		healthPercent: Math.min(100, Math.max(0, (reserveData.value.endingBalance / 75000) * 100)),
		barColor: 'bg-red-500',
		description: 'Required minimum: $75,000',
	},
	{
		name: 'Special Assessment',
		balance: specialData.value.endingBalance || 0,
		status: totalViolations.value > 0 ? 'Violations' : 'Active',
		statusColor: totalViolations.value > 0 ? 'orange' : 'blue',
		healthPercent: 100,
		barColor: totalViolations.value > 0 ? 'bg-orange-500' : 'bg-blue-500',
		description: '40-year recertification project',
	},
]);

// Tab configurations
const mainTabs = ref([
	{ key: 'overview', label: 'Overview', icon: 'i-heroicons-home' },
	{ key: 'accounts', label: 'Accounts', icon: 'i-heroicons-banknotes' },
	{ key: 'compliance', label: 'Compliance', icon: 'i-heroicons-shield-check' },
	{ key: 'analytics', label: 'Analytics', icon: 'i-heroicons-chart-bar' },
]);

const accountTabs = ref([
	{ key: 'operating', label: 'Operating (5129)', icon: 'i-heroicons-building-office' },
	{ key: 'special', label: 'Special Assessment (5872)', icon: 'i-heroicons-wrench-screwdriver' },
	{ key: 'reserve', label: 'Reserve (7011)', icon: 'i-heroicons-shield-check' },
]);

// Chart Data - Cash Flow Trends
const trends = computed(() => calculateTrends());
const cashFlowChartData = computed(() => {
	const datasets = [];

	if (selectedChartView.value === 'All Accounts' || selectedChartView.value === 'Operating') {
		datasets.push({
			label: 'Operating',
			data: trends.value.operating,
			borderColor: 'rgb(59, 130, 246)',
			backgroundColor: 'rgba(59, 130, 246, 0.1)',
			tension: 0.4,
		});
	}

	if (selectedChartView.value === 'All Accounts' || selectedChartView.value === 'Reserve') {
		datasets.push({
			label: 'Reserve',
			data: trends.value.reserve,
			borderColor: 'rgb(239, 68, 68)',
			backgroundColor: 'rgba(239, 68, 68, 0.1)',
			tension: 0.4,
		});
	}

	if (selectedChartView.value === 'All Accounts' || selectedChartView.value === 'Special') {
		datasets.push({
			label: 'Special Assessment',
			data: trends.value.special,
			borderColor: 'rgb(34, 197, 94)',
			backgroundColor: 'rgba(34, 197, 94, 0.1)',
			tension: 0.4,
		});
	}

	return {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		datasets,
	};
});

// Chart Options
const chartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top',
		},
		tooltip: {
			callbacks: {
				label: (context) => {
					return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
				},
			},
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
		},
	},
});

// Revenue vs Expense Chart
const revenueExpenseChartData = computed(() => ({
	labels: ['Revenue', 'Expenses'],
	datasets: [
		{
			label: 'Amount',
			data: [
				currentMonthData.value.statistics?.totalDeposits || 0,
				currentMonthData.value.statistics?.totalWithdrawals || 0,
			],
			backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
		},
	],
}));

const barChartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: false,
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
		},
	},
});

// Reserve Funding Chart
const reserveFundingChartData = computed(() => ({
	labels: ['Current Balance', 'Shortfall'],
	datasets: [
		{
			data: [reserveData.value.endingBalance || 0, reserveData.value.shortfall || 0],
			backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(156, 163, 175, 0.8)'],
		},
	],
}));

const doughnutChartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom',
		},
	},
});

// Expense Categories
const expensesByCategory = computed(() => currentMonthData.value.statistics?.expensesByCategory || {});
const expenseCategoryData = computed(() => ({
	labels: Object.keys(expensesByCategory.value),
	datasets: [
		{
			data: Object.values(expensesByCategory.value),
			backgroundColor: [
				'rgba(239, 68, 68, 0.8)',
				'rgba(59, 130, 246, 0.8)',
				'rgba(34, 197, 94, 0.8)',
				'rgba(251, 191, 36, 0.8)',
				'rgba(167, 139, 250, 0.8)',
				'rgba(251, 146, 60, 0.8)',
			],
		},
	],
}));

const pieChartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'right',
		},
	},
});

// Budget Performance Radar
const budgetPerformanceData = computed(() => ({
	labels: ['Insurance', 'Utilities', 'Maintenance', 'Management', 'Other'],
	datasets: [
		{
			label: 'Actual',
			data: [100, 85, 65, 90, 120],
			backgroundColor: 'rgba(239, 68, 68, 0.2)',
			borderColor: 'rgb(239, 68, 68)',
			pointBackgroundColor: 'rgb(239, 68, 68)',
		},
		{
			label: 'Budget',
			data: [100, 100, 100, 100, 100],
			backgroundColor: 'rgba(34, 197, 94, 0.2)',
			borderColor: 'rgb(34, 197, 94)',
			pointBackgroundColor: 'rgb(34, 197, 94)',
		},
	],
}));

const radarChartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	scales: {
		r: {
			beginAtZero: true,
			max: 150,
		},
	},
});

// Compliance Requirements
const complianceRequirements = computed(() => [
	{
		statute: 'FL Statute 718.112(2)(f)',
		title: 'Reserve Funding Requirements',
		description: 'Maintain adequate reserves for capital expenditures and deferred maintenance',
		compliant: false,
		action: 'Immediate special assessment required to restore minimum balance',
	},
	{
		statute: 'FL Statute 718.111(12)',
		title: 'Financial Reporting',
		description: 'Provide financial statements to unit owners within 90 days of fiscal year end',
		compliant: true,
	},
	{
		statute: 'Fund Segregation',
		title: 'Proper Fund Accounting',
		description: 'Maintain separate accounts for operating, reserve, and special assessments',
		compliant: false,
		action: 'Cease all inter-account transfers immediately',
	},
	{
		statute: 'Fiduciary Duty',
		title: 'Board Financial Responsibility',
		description: 'Exercise reasonable care in managing association funds',
		compliant: false,
		action: 'Emergency board meeting to address financial crisis',
	},
]);

// Risk Assessment
const riskAssessment = computed(() => ({
	overall: 'HIGH',
	factors: [
		{ category: 'Reserve Funding', level: 'CRITICAL', impact: 'Legal liability, special assessment required' },
		{ category: 'Fund Segregation', level: 'HIGH', impact: 'Audit findings, compliance violations' },
		{ category: 'Cash Flow', level: 'MODERATE', impact: 'Operational constraints, vendor payment delays' },
		{ category: 'Insurance Coverage', level: 'LOW', impact: 'Adequate coverage maintained' },
	],
}));

// Violation Summary
const violationSummary = computed(() => {
	const violations = [];
	const operatingViolations = operatingData.value.violations || [];
	const specialViolations = specialData.value.improperTransfers || [];

	if (operatingViolations.length > 0) {
		violations.push({
			type: 'Operating Account Violations',
			count: operatingViolations.length,
			description: 'Improper transfers to special assessment account',
			amount: operatingViolations.reduce((sum, v) => sum + v.amount, 0),
		});
	}

	if (specialViolations.length > 0) {
		violations.push({
			type: 'Special Assessment Violations',
			count: specialViolations.length,
			description: 'Improper fund mixing with operating account',
			amount: specialViolations.reduce((sum, v) => sum + v.amount, 0),
		});
	}

	return violations;
});

// Account Summaries
const operatingAccountSummary = computed(() => ({
	name: 'Operating Account (...5129)',
	beginningBalance: operatingData.value.beginningBalance || 0,
	endingBalance: operatingData.value.endingBalance || 0,
	totalDeposits: currentMonthData.value.statistics?.totalDeposits || 0,
	totalWithdrawals: currentMonthData.value.statistics?.totalWithdrawals || 0,
	netChange: currentMonthData.value.statistics?.netCashFlow || 0,
	warnings: operatingData.value.warnings || [],
}));

const specialAccountSummary = computed(() => ({
	name: 'Special Assessment (...5872)',
	beginningBalance: specialData.value.beginningBalance || 0,
	endingBalance: specialData.value.endingBalance || 0,
	totalDeposits: specialData.value.collections?.reduce((sum, c) => sum + c.amount, 0) || 0,
	totalWithdrawals: specialData.value.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
	netChange: (specialData.value.endingBalance || 0) - (specialData.value.beginningBalance || 0),
	warnings: specialData.value.warnings || [],
}));

const reserveAccountSummary = computed(() => ({
	name: 'Reserve Account (...7011)',
	beginningBalance: reserveData.value.beginningBalance || 0,
	endingBalance: reserveData.value.endingBalance || 0,
	totalDeposits: reserveData.value.contributions || 0,
	totalWithdrawals: reserveData.value.withdrawals || 0,
	netChange: (reserveData.value.endingBalance || 0) - (reserveData.value.beginningBalance || 0),
	warnings: reserveData.value.warnings || [],
}));

// Progress Metrics
const collectionProgress = computed(() => {
	const total = 150000;
	const collected = 95000;
	return Math.round((collected / total) * 100);
});

const projectProgress = computed(() => 35);

// Budget Insights
const budgetInsights = ref([
	'Insurance costs 202% over budget - negotiate payment terms',
	'Operating account burn rate: $10,076/month',
	'Maintenance expenses 66% under budget - potential deferred maintenance risk',
	'Total YTD expenses exceed revenue by $18,376',
]);

// Financial Projections
const financialProjections = computed(() => ({
	operatingRunway: Math.floor((operatingData.value.endingBalance || 0) / 10000),
	criticalDate: 'October 2025',
	requiredAssessment: 85000,
	monthlyShortfall: 3500,
}));

// Priority Actions
const priorityActions = ref([
	{
		id: 1,
		title: 'Emergency Board Meeting',
		description: 'Address reserve crisis and fiduciary compliance',
		priority: 'CRITICAL',
		deadline: 'Within 7 days',
		color: 'red',
	},
	{
		id: 2,
		title: 'Special Assessment',
		description: 'Implement $85,000 assessment to restore reserves',
		priority: 'HIGH',
		deadline: 'Within 30 days',
		color: 'orange',
	},
	{
		id: 3,
		title: 'Stop Fund Transfers',
		description: 'Cease all transfers between accounts',
		priority: 'HIGH',
		deadline: 'Immediate',
		color: 'orange',
	},
	{
		id: 4,
		title: 'Reserve Study',
		description: 'Commission professional reserve analysis',
		priority: 'HIGH',
		deadline: 'Within 60 days',
		color: 'orange',
	},
	{
		id: 5,
		title: 'Insurance Negotiation',
		description: 'Convert to quarterly payment schedule',
		priority: 'MEDIUM',
		deadline: 'Next renewal',
		color: 'yellow',
	},
	{
		id: 6,
		title: 'Legal Consultation',
		description: 'Review fiduciary duty compliance',
		priority: 'HIGH',
		deadline: 'Within 14 days',
		color: 'orange',
	},
]);

// Export Report Function
const exportReport = () => {
	// Implementation for exporting PDF report
	console.log('Exporting financial report...');
};
</script>

<style scoped>
/* Custom styles if needed */
</style>
