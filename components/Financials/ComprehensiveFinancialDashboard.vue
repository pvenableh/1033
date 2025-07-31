<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Dashboard Header -->
		<div class="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white py-8">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center">
					<div>
						<h1 class="text-3xl font-bold mb-2">Lenox Plaza HOA Financial Dashboard</h1>
						<p class="text-blue-200">Comprehensive budget vs actual analysis • {{ currentMonth }}</p>
					</div>
					<div class="text-right">
						<div class="text-2xl font-bold">{{ financialHealthScore.grade.letter }}</div>
						<div class="text-sm text-blue-200">Financial Health</div>
						<div class="text-xs" :class="getGradeColor(financialHealthScore.grade.color)">
							{{ financialHealthScore.score }}/100
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Critical Alerts Banner -->
		<div v-if="criticalAlerts.length > 0" class="bg-red-600 text-white py-2">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center space-x-4 text-sm">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
					<span class="font-medium">Critical Issues:</span>
					<span>{{ criticalAlerts.length }} items requiring immediate attention</span>
					<UButton size="xs" variant="ghost" color="white" @click="showAlertsModal = true">View Details</UButton>
				</div>
			</div>
		</div>

		<!-- Main Dashboard Content -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Executive Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<!-- Total Cash Position -->
				<UCard class="text-center">
					<div class="space-y-2">
						<UIcon name="i-heroicons-banknotes" class="w-8 h-8 mx-auto text-green-600" />
						<div class="text-2xl font-bold text-gray-900">${{ totalCashPosition.toLocaleString() }}</div>
						<div class="text-sm text-gray-600">Total Cash Position</div>
						<div class="text-xs" :class="cashPositionTrend >= 0 ? 'text-green-600' : 'text-red-600'">
							{{ cashPositionTrend >= 0 ? '+' : '' }}{{ cashPositionTrend.toLocaleString() }} this month
						</div>
					</div>
				</UCard>

				<!-- Budget Performance -->
				<UCard class="text-center">
					<div class="space-y-2">
						<UIcon name="i-heroicons-chart-pie" class="w-8 h-8 mx-auto text-blue-600" />
						<div class="text-2xl font-bold text-gray-900">{{ budgetUtilization.toFixed(1) }}%</div>
						<div class="text-sm text-gray-600">Budget Utilized</div>
						<div class="text-xs" :class="spendingVelocity.status === 'fast' ? 'text-red-600' : 'text-green-600'">
							{{ spendingVelocity.velocity.toFixed(1) }}x velocity
						</div>
					</div>
				</UCard>

				<!-- Cash Runway -->
				<UCard class="text-center">
					<div class="space-y-2">
						<UIcon name="i-heroicons-clock" class="w-8 h-8 mx-auto text-yellow-600" />
						<div class="text-2xl font-bold text-gray-900">{{ cashRunway?.months.toFixed(1) || 'N/A' }}</div>
						<div class="text-sm text-gray-600">Months Runway</div>
						<div class="text-xs" :class="getCashRunwayColor(cashRunway?.status)">
							{{ getCashRunwayStatus(cashRunway?.status) }}
						</div>
					</div>
				</UCard>

				<!-- Compliance Status -->
				<UCard class="text-center">
					<div class="space-y-2">
						<UIcon name="i-heroicons-shield-check" class="w-8 h-8 mx-auto text-purple-600" />
						<div class="text-2xl font-bold text-gray-900">{{ totalViolations }}</div>
						<div class="text-sm text-gray-600">Compliance Issues</div>
						<div class="text-xs" :class="totalViolations > 0 ? 'text-red-600' : 'text-green-600'">
							{{ totalViolations > 0 ? 'Non-Compliant' : 'Compliant' }}
						</div>
					</div>
				</UCard>
			</div>

			<!-- Tabbed Dashboard Views -->
			<UTabs :items="dashboardTabs" class="mb-8">
				<template #item="{ item }">
					<!-- Overview Tab -->
					<div v-if="item.key === 'overview'" class="space-y-6">
						<FinancialsOverview />
					</div>

					<!-- Operating Account Tab -->
					<div v-if="item.key === 'operating'" class="space-y-6">
						<!-- Operating Account Summary -->
						<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<UCard class="lg:col-span-2">
								<template #header>
									<h3 class="text-lg font-bold text-gray-900">Operating Account Performance</h3>
								</template>
								<FinancialsOperatingAccountReconciliation :month="currentMonth" />
							</UCard>

							<UCard>
								<template #header>
									<h3 class="text-lg font-bold text-gray-900">Key Metrics</h3>
								</template>
								<div class="space-y-4">
									<div class="flex justify-between items-center">
										<span class="text-gray-600">Current Balance</span>
										<span class="font-semibold">${{ operatingBalance.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-gray-600">Monthly Burn</span>
										<span class="font-semibold text-red-600">
											${{ (cashRunway?.monthlyBurn || 0).toLocaleString() }}
										</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-gray-600">Budget vs Actual</span>
										<span class="font-semibold" :class="operatingVarianceColor">
											{{ operatingVariance >= 0 ? '+' : '' }}{{ operatingVariance.toFixed(1) }}%
										</span>
									</div>
									<div class="flex justify-between items-center pt-2 border-t">
										<span class="text-gray-600">Health Status</span>
										<UBadge :color="getOperatingHealthColor()" variant="solid">
											{{ getOperatingHealthStatus() }}
										</UBadge>
									</div>
								</div>
							</UCard>
						</div>

						<!-- Budget vs Actual by Category -->
						<UCard>
							<template #header>
								<h3 class="text-lg font-bold text-gray-900">Monthly Budget vs Actual</h3>
							</template>
							<div class="space-y-4">
								<div
									v-for="category in categoryComparison"
									:key="category.name"
									class="flex items-center justify-between p-4 border rounded-lg"
									:class="getCategoryBorderClass(category.monthlyData.variancePercent)"
								>
									<div>
										<h4 class="font-semibold text-gray-900">{{ category.name }}</h4>
										<p class="text-sm text-gray-600">
											{{ category.monthlyData.transactions.length }} transactions this month
										</p>
									</div>
									<div class="text-right">
										<div class="font-semibold">
											${{ category.monthlyData.actual.toLocaleString() }} / ${{
												category.monthlyData.budget.toLocaleString()
											}}
										</div>
										<div class="text-sm" :class="getVarianceColor(category.monthlyData.variancePercent)">
											{{ category.monthlyData.variancePercent.toFixed(1) }}% variance
										</div>
									</div>
								</div>
							</div>
						</UCard>
					</div>

					<!-- Budget Analysis Tab -->
					<div v-if="item.key === 'budget'" class="space-y-6">
						<FinancialsBudgetAnalysis />
					</div>

					<!-- Compliance Tab -->
					<div v-if="item.key === 'compliance'" class="space-y-6">
						<!-- Compliance Overview -->
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<UCard>
								<template #header>
									<div class="flex items-center">
										<UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5 text-red-600 mr-2" />
										<h3 class="text-lg font-bold text-gray-900">Compliance Issues</h3>
									</div>
								</template>
								<div class="space-y-3">
									<div
										v-for="alert in complianceAlerts"
										:key="alert.title"
										class="p-3 border rounded-lg border-red-200 bg-red-50"
									>
										<h4 class="font-medium text-red-900">{{ alert.title }}</h4>
										<p class="text-sm text-red-800 mt-1">{{ alert.message }}</p>
										<p class="text-xs text-red-700 mt-1 font-medium">Action: {{ alert.action }}</p>
									</div>
								</div>
							</UCard>

							<UCard>
								<template #header>
									<h3 class="text-lg font-bold text-gray-900">Financial Health Factors</h3>
								</template>
								<div class="space-y-4">
									<div v-for="factor in healthFactors" :key="factor.name" class="space-y-2">
										<div class="flex justify-between items-center">
											<span class="text-gray-600">{{ factor.name }}</span>
											<span class="font-semibold" :class="factor.color">{{ factor.value }}</span>
										</div>
										<div class="w-full bg-gray-200 rounded-full h-2">
											<div
												class="h-2 rounded-full transition-all duration-500"
												:class="factor.barColor"
												:style="`width: ${factor.percentage}%`"
											></div>
										</div>
									</div>
								</div>
							</UCard>
						</div>

						<!-- Reserve Analysis -->
						<FinancialsReserveAccountReconciliation :month="currentMonth" />
					</div>

					<!-- Reports Tab -->
					<div v-if="item.key === 'reports'" class="space-y-6">
						<!-- Month-over-Month Comparison -->
						<UCard v-if="monthOverMonthComparison">
							<template #header>
								<h3 class="text-lg font-bold text-gray-900">Month-over-Month Analysis</h3>
							</template>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div class="text-center">
									<div
										class="text-2xl font-bold"
										:class="monthOverMonthComparison.balance.change >= 0 ? 'text-green-600' : 'text-red-600'"
									>
										{{ monthOverMonthComparison.balance.change >= 0 ? '+' : '' }}${{
											monthOverMonthComparison.balance.change.toLocaleString()
										}}
									</div>
									<div class="text-sm text-gray-600">Balance Change</div>
									<div class="text-xs text-gray-500">
										{{ monthOverMonthComparison.balance.changePercent.toFixed(1) }}%
									</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-green-600">
										${{ monthOverMonthComparison.deposits.current.toLocaleString() }}
									</div>
									<div class="text-sm text-gray-600">Deposits This Month</div>
									<div class="text-xs text-gray-500">
										vs ${{ monthOverMonthComparison.deposits.previous.toLocaleString() }} prev
									</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-red-600">
										${{ monthOverMonthComparison.withdrawals.current.toLocaleString() }}
									</div>
									<div class="text-sm text-gray-600">Withdrawals This Month</div>
									<div class="text-xs text-gray-500">
										vs ${{ monthOverMonthComparison.withdrawals.previous.toLocaleString() }} prev
									</div>
								</div>
							</div>
						</UCard>

						<!-- Export and Download Options -->
						<UCard>
							<template #header>
								<h3 class="text-lg font-bold text-gray-900">Report Generation</h3>
							</template>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<h4 class="font-medium text-gray-900 mb-3">Available Reports</h4>
									<div class="space-y-2">
										<UButton
											v-for="report in availableReports"
											:key="report.id"
											@click="generateReport(report.id)"
											variant="outline"
											class="w-full justify-start"
											:loading="generatingReport === report.id"
										>
											<UIcon :name="report.icon" class="w-4 h-4 mr-2" />
											{{ report.name }}
										</UButton>
									</div>
								</div>

								<div>
									<h4 class="font-medium text-gray-900 mb-3">Export Options</h4>
									<div class="space-y-3">
										<UButton @click="exportData('csv')" variant="outline" class="w-full">
											<UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-2" />
											Export to CSV
										</UButton>
										<UButton @click="exportData('pdf')" variant="outline" class="w-full">
											<UIcon name="i-heroicons-document" class="w-4 h-4 mr-2" />
											Generate PDF Report
										</UButton>
										<UButton @click="exportData('json')" variant="outline" class="w-full">
											<UIcon name="i-heroicons-code-bracket" class="w-4 h-4 mr-2" />
											Export Raw Data (JSON)
										</UButton>
									</div>
								</div>
							</div>
						</UCard>
					</div>
				</template>
			</UTabs>
		</div>

		<!-- Alerts Modal -->
		<UModal v-model="showAlertsModal">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-bold text-gray-900">Critical Alerts</h3>
						<UButton icon="i-heroicons-x-mark" variant="ghost" @click="showAlertsModal = false" />
					</div>
				</template>
				<div class="space-y-4">
					<div
						v-for="alert in allAlerts"
						:key="`${alert.type}-${alert.title}`"
						class="p-4 border rounded-lg"
						:class="getAlertBorderClass(alert.severity)"
					>
						<div class="flex items-start justify-between mb-2">
							<h4 class="font-semibold" :class="getAlertTextClass(alert.severity)">{{ alert.title }}</h4>
							<UBadge :color="getAlertBadgeColor(alert.severity)" variant="soft" size="sm">
								{{ alert.severity.toUpperCase() }}
							</UBadge>
						</div>
						<p class="text-sm text-gray-600 mb-2">{{ alert.message }}</p>
						<p class="text-xs font-medium text-gray-700">Action Required: {{ alert.action }}</p>
					</div>
				</div>
			</UCard>
		</UModal>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Use the integrated financial data composable
const {
	currentMonth,
	getComprehensiveOverview,
	mapBudgetToActual,
	getFinancialHealthScore,
	getSpendingVelocity,
	getCashRunway,
	getMonthOverMonthComparison,
	generateIntegratedAlerts,
	loadAllData,
} = useIntegratedFinancialData();

// Component state
const showAlertsModal = ref(false);
const generatingReport = ref(null);

// Load all data on mount
onMounted(async () => {
	await loadAllData();
});

// Computed properties
const comprehensiveData = computed(() => getComprehensiveOverview());
const financialHealthScore = computed(() => getFinancialHealthScore());
const spendingVelocity = computed(() => getSpendingVelocity());
const cashRunway = computed(() => getCashRunway());
const monthOverMonthComparison = computed(() => getMonthOverMonthComparison('June 2025', 'May 2025'));
const categoryComparison = computed(() => mapBudgetToActual());

// Key metrics
const totalCashPosition = computed(() => {
	const data = comprehensiveData.value;
	return (data.operating?.endingBalance || 0) + (data.reserve?.endingBalance || 0) + 46133; // Special assessment balance
});

const cashPositionTrend = computed(() => {
	if (!monthOverMonthComparison.value) return 0;
	return monthOverMonthComparison.value.balance.change;
});

const budgetUtilization = computed(() => {
	const data = comprehensiveData.value;
	return data.budget?.summary?.percentSpent || 0;
});

const operatingBalance = computed(() => {
	const data = comprehensiveData.value;
	return data.operating?.endingBalance || 0;
});

const operatingVariance = computed(() => {
	// Calculate operating account variance vs budget
	const categories = categoryComparison.value;
	if (!categories.length) return 0;

	const totalBudget = categories.reduce((sum, cat) => sum + cat.monthlyData.budget, 0);
	const totalActual = categories.reduce((sum, cat) => sum + cat.monthlyData.actual, 0);

	return totalBudget ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
});

const operatingVarianceColor = computed(() =>
	operatingVariance.value > 25 ? 'text-red-600' : operatingVariance.value > 10 ? 'text-yellow-600' : 'text-green-600',
);

const totalViolations = computed(() => {
	const data = comprehensiveData.value;
	return data.violations || 0;
});

// Alerts
const allAlerts = computed(() => {
	const data = comprehensiveData.value;
	return data.alerts || [];
});

const criticalAlerts = computed(() => allAlerts.value.filter((alert) => alert.severity === 'critical'));

const complianceAlerts = computed(() => allAlerts.value.filter((alert) => alert.type === 'compliance'));

// Health factors for compliance tab
const healthFactors = computed(() => [
	{
		name: 'Operating Balance',
		value: `$${operatingBalance.value.toLocaleString()}`,
		percentage: Math.min((operatingBalance.value / 50000) * 100, 100),
		color: operatingBalance.value < 25000 ? 'text-red-600' : 'text-green-600',
		barColor: operatingBalance.value < 25000 ? 'bg-red-500' : 'bg-green-500',
	},
	{
		name: 'Budget Compliance',
		value: `${budgetUtilization.value.toFixed(1)}%`,
		percentage: Math.min(budgetUtilization.value, 100),
		color: budgetUtilization.value > 85 ? 'text-red-600' : 'text-green-600',
		barColor: budgetUtilization.value > 85 ? 'bg-red-500' : 'bg-green-500',
	},
	{
		name: 'Fund Segregation',
		value: totalViolations.value === 0 ? 'Compliant' : `${totalViolations.value} issues`,
		percentage: totalViolations.value === 0 ? 100 : Math.max(100 - totalViolations.value * 20, 0),
		color: totalViolations.value === 0 ? 'text-green-600' : 'text-red-600',
		barColor: totalViolations.value === 0 ? 'bg-green-500' : 'bg-red-500',
	},
]);

// Dashboard tabs
const dashboardTabs = [
	{
		key: 'overview',
		label: 'Overview',
		icon: 'i-heroicons-chart-bar-square',
	},
	{
		key: 'operating',
		label: 'Operating Account',
		icon: 'i-heroicons-building-office-2',
	},
	{
		key: 'budget',
		label: 'Budget Analysis',
		icon: 'i-heroicons-calculator',
	},
	{
		key: 'compliance',
		label: 'Compliance',
		icon: 'i-heroicons-shield-check',
	},
	{
		key: 'reports',
		label: 'Reports',
		icon: 'i-heroicons-document-chart-bar',
	},
];

// Available reports
const availableReports = [
	{
		id: 'monthly-reconciliation',
		name: 'Monthly Reconciliation Report',
		icon: 'i-heroicons-document-text',
	},
	{
		id: 'budget-variance',
		name: 'Budget Variance Analysis',
		icon: 'i-heroicons-chart-bar',
	},
	{
		id: 'compliance-report',
		name: 'Compliance Report',
		icon: 'i-heroicons-shield-check',
	},
	{
		id: 'executive-summary',
		name: 'Executive Summary',
		icon: 'i-heroicons-document-chart-bar',
	},
];

// Helper functions
const getGradeColor = (color) => `text-${color}-300`;

const getCashRunwayColor = (status) => {
	switch (status) {
		case 'critical':
			return 'text-red-600';
		case 'warning':
			return 'text-yellow-600';
		default:
			return 'text-green-600';
	}
};

const getCashRunwayStatus = (status) => {
	switch (status) {
		case 'critical':
			return 'Critical';
		case 'warning':
			return 'Warning';
		default:
			return 'Healthy';
	}
};

const getOperatingHealthStatus = () => {
	if (operatingBalance.value < 25000) return 'CRITICAL';
	if (operatingBalance.value < 40000) return 'AT RISK';
	return 'STABLE';
};

const getOperatingHealthColor = () => {
	if (operatingBalance.value < 25000) return 'red';
	if (operatingBalance.value < 40000) return 'yellow';
	return 'green';
};

const getCategoryBorderClass = (variancePercent) => {
	if (Math.abs(variancePercent) > 50) return 'border-red-300';
	if (Math.abs(variancePercent) > 20) return 'border-yellow-300';
	return 'border-gray-200';
};

const getVarianceColor = (variancePercent) => {
	if (Math.abs(variancePercent) > 50) return 'text-red-600';
	if (Math.abs(variancePercent) > 20) return 'text-yellow-600';
	return 'text-green-600';
};

const getAlertBorderClass = (severity) => {
	switch (severity) {
		case 'critical':
			return 'border-red-300';
		case 'high':
			return 'border-yellow-300';
		default:
			return 'border-blue-300';
	}
};

const getAlertTextClass = (severity) => {
	switch (severity) {
		case 'critical':
			return 'text-red-900';
		case 'high':
			return 'text-yellow-900';
		default:
			return 'text-blue-900';
	}
};

const getAlertBadgeColor = (severity) => {
	switch (severity) {
		case 'critical':
			return 'red';
		case 'high':
			return 'yellow';
		default:
			return 'blue';
	}
};

// Actions
const generateReport = async (reportId) => {
	generatingReport.value = reportId;

	// Simulate report generation
	await new Promise((resolve) => setTimeout(resolve, 2000));

	// Here you would implement actual report generation
	console.log(`Generating report: ${reportId}`);

	generatingReport.value = null;
};

const exportData = (format) => {
	// Here you would implement data export functionality
	console.log(`Exporting data in ${format} format`);
};
</script>

<style scoped>
.transition-all {
	transition: all 0.3s ease-in-out;
}
</style>
