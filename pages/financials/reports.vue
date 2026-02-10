<template>
	<div class="container mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 dark:text-white">
						Financial Reports
					</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Monthly financial summaries and reconciliation status
					</p>
				</div>
				<div class="flex items-center gap-3">
					<USelectMenu
						v-model="selectedYear"
						:options="yearOptions"
						value-attribute="value"
						option-attribute="label"
						size="lg"
						class="w-32"
						placeholder="Year" />
				</div>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="loading" class="text-center py-12">
			<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400 mx-auto" />
			<p class="mt-2 text-gray-500 dark:text-gray-400">Loading financial data...</p>
		</div>

		<template v-else>
			<!-- Year-to-Date Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<UCard class="text-center">
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">YTD Revenue</p>
					<p class="text-2xl font-bold text-green-600 dark:text-green-400">
						{{ formatCurrency(ytdSummary.revenue) }}
					</p>
				</UCard>
				<UCard class="text-center">
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">YTD Expenses</p>
					<p class="text-2xl font-bold text-red-600 dark:text-red-400">
						{{ formatCurrency(ytdSummary.expenses) }}
					</p>
				</UCard>
				<UCard class="text-center">
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Net Position</p>
					<p class="text-2xl font-bold" :class="ytdSummary.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'">
						{{ formatCurrency(ytdSummary.net) }}
					</p>
				</UCard>
				<UCard class="text-center">
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Months Reconciled</p>
					<p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
						{{ reconciledMonthCount }}/{{ activeMonthCount }}
					</p>
				</UCard>
			</div>

			<!-- Account Balances -->
			<UCard>
				<template #header>
					<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
						Account Balances
					</h2>
				</template>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div
						v-for="account in accountBalances"
						:key="account.id"
						class="border dark:border-gray-700 rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold dark:text-white">{{ account.name }}</h3>
							<UBadge :color="account.typeColor" variant="soft" size="sm">
								{{ account.type }}
							</UBadge>
						</div>
						<p class="text-2xl font-bold dark:text-gray-200">
							{{ formatCurrency(account.balance) }}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
							Account #{{ account.number }}
						</p>
					</div>
				</div>
			</UCard>

			<!-- Monthly Reconciliation Status -->
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
							Monthly Reconciliation Status - {{ selectedYear }}
						</h2>
						<UBadge v-if="allMonthsReconciled" color="green" variant="solid">
							<UIcon name="i-heroicons-shield-check" class="w-4 h-4 mr-1" />
							All Months Certified
						</UBadge>
					</div>
				</template>

				<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
					<div
						v-for="month in monthlyStatus"
						:key="month.key"
						class="border dark:border-gray-700 rounded-lg p-3 text-center"
						:class="{
							'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800': month.status === 'reconciled',
							'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800': month.status === 'pending',
							'bg-gray-50 dark:bg-gray-800': !month.hasData,
						}">
						<p class="text-sm font-medium dark:text-gray-200 mb-1">{{ month.name }}</p>
						<template v-if="month.hasData">
							<UIcon
								v-if="month.status === 'reconciled'"
								name="i-heroicons-check-circle"
								class="w-6 h-6 mx-auto text-green-500" />
							<UIcon
								v-else-if="month.status === 'pending'"
								name="i-heroicons-clock"
								class="w-6 h-6 mx-auto text-yellow-500" />
							<UIcon
								v-else
								name="i-heroicons-document"
								class="w-6 h-6 mx-auto text-gray-400" />
							<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
								{{ month.transactionCount }} txns
							</p>
						</template>
						<template v-else>
							<UIcon name="i-heroicons-minus" class="w-6 h-6 mx-auto text-gray-300 dark:text-gray-600" />
							<p class="text-xs text-gray-400 dark:text-gray-500 mt-1">No data</p>
						</template>
					</div>
				</div>
			</UCard>

			<!-- Budget vs Actual -->
			<UCard v-if="budgetComparison.length > 0">
				<template #header>
					<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
						Budget vs Actual - {{ selectedYear }}
					</h2>
				</template>

				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b-2 border-gray-300 dark:border-gray-600">
								<th class="py-3 px-4 text-left uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
									Category
								</th>
								<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
									YTD Budget
								</th>
								<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
									YTD Actual
								</th>
								<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
									Variance
								</th>
								<th class="py-3 px-4 text-center uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
									Status
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="item in budgetComparison"
								:key="item.category"
								class="border-b border-gray-200 dark:border-gray-700">
								<td class="py-3 px-4 dark:text-gray-200">
									<div class="flex items-center gap-2">
										<div
											class="w-3 h-3 rounded-full"
											:style="{ backgroundColor: item.color || '#6B7280' }"></div>
										{{ item.category }}
									</div>
								</td>
								<td class="py-3 px-4 text-right font-mono dark:text-gray-200">
									{{ formatCurrency(item.ytdBudget) }}
								</td>
								<td class="py-3 px-4 text-right font-mono dark:text-gray-200">
									{{ formatCurrency(item.ytdActual) }}
								</td>
								<td class="py-3 px-4 text-right font-mono" :class="item.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
									{{ item.variance >= 0 ? '+' : '' }}{{ formatCurrency(item.variance) }}
								</td>
								<td class="py-3 px-4 text-center">
									<UBadge
										:color="item.variance >= 0 ? 'green' : item.variancePercent > -10 ? 'yellow' : 'red'"
										variant="soft"
										size="sm">
										{{ item.variancePercent >= 0 ? '+' : '' }}{{ item.variancePercent.toFixed(1) }}%
									</UBadge>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</UCard>

			<!-- Quick Links -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<NuxtLink to="/financials/budget">
					<UCard class="hover:shadow-lg transition-shadow cursor-pointer h-full">
						<div class="flex items-center gap-4">
							<div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
								<UIcon name="i-heroicons-chart-pie" class="w-8 h-8 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<h3 class="font-semibold dark:text-white">Budget Overview</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									View the full operating budget details
								</p>
							</div>
						</div>
					</UCard>
				</NuxtLink>

				<NuxtLink to="/financials">
					<UCard class="hover:shadow-lg transition-shadow cursor-pointer h-full">
						<div class="flex items-center gap-4">
							<div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
								<UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-green-600 dark:text-green-400" />
							</div>
							<div>
								<h3 class="font-semibold dark:text-white">Dashboard</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									View transactions and account details
								</p>
							</div>
						</div>
					</UCard>
				</NuxtLink>

				<NuxtLink to="/financials/yearly-reconciliation">
					<UCard class="hover:shadow-lg transition-shadow cursor-pointer h-full">
						<div class="flex items-center gap-4">
							<div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
								<UIcon name="i-heroicons-calendar-days" class="w-8 h-8 text-purple-600 dark:text-purple-400" />
							</div>
							<div>
								<h3 class="font-semibold dark:text-white">Year-End Summary</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									Annual reconciliation overview
								</p>
							</div>
						</div>
					</UCard>
				</NuxtLink>
			</div>
		</template>
	</div>
</template>

<script setup>
definePageMeta({ layout: 'default' });

useSeoMeta({
	title: 'Financial Reports',
});

const accountsCollection = useDirectusItems('accounts');
const transactionsCollection = useDirectusItems('transactions');
const monthlyStatementsCollection = useDirectusItems('monthly_statements');
const reconciliationReportsCollection = useDirectusItems('monthly_reconciliation_reports');
const budgetCategoriesCollection = useDirectusItems('budget_categories');

// State
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const loading = ref(true);

// Data stores
const accounts = ref([]);
const transactions = ref([]);
const monthlyStatements = ref([]);
const reconciliationReports = ref([]);
const budgetCategories = ref([]);

// Year options
const yearOptions = computed(() => {
	const years = [];
	for (let y = currentYear - 2; y <= currentYear + 1; y++) {
		years.push({ label: `FY ${y}`, value: y });
	}
	return years;
});

// Month names
const monthNames = {
	'01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
	'05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
	'09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

// Helper functions
const safeParseFloat = (v) => {
	const p = parseFloat(v);
	return isNaN(p) ? 0 : p;
};

const formatCurrency = (amount) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
};

// Computed values
const ytdSummary = computed(() => {
	const revenue = transactions.value
		.filter((t) => t.transaction_type === 'deposit' && !t.linked_transfer_id)
		.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

	const expenses = transactions.value
		.filter((t) => (t.transaction_type === 'withdrawal' && !t.linked_transfer_id) || t.transaction_type === 'fee')
		.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

	return {
		revenue,
		expenses,
		net: revenue - expenses,
	};
});

const accountBalances = computed(() => {
	return accounts.value.map((account) => {
		const latestStatement = monthlyStatements.value
			.filter((s) => s.account_id === account.id)
			.sort((a, b) => b.statement_month.localeCompare(a.statement_month))[0];

		const typeColors = {
			operating: 'blue',
			reserve: 'green',
			special: 'purple',
		};

		return {
			id: account.id,
			name: account.account_name,
			number: account.account_number,
			type: account.account_type,
			typeColor: typeColors[account.account_type] || 'gray',
			balance: latestStatement ? safeParseFloat(latestStatement.ending_balance) : 0,
		};
	});
});

const monthlyStatus = computed(() => {
	return Object.entries(monthNames).map(([key, name]) => {
		const monthTx = transactions.value.filter((t) => t.statement_month === key);
		const report = reconciliationReports.value.find((r) => r.report_month === key);

		return {
			key,
			name,
			hasData: monthTx.length > 0,
			transactionCount: monthTx.length,
			status: report?.reconciliation_status || null,
		};
	});
});

const activeMonthCount = computed(() => monthlyStatus.value.filter((m) => m.hasData).length);
const reconciledMonthCount = computed(() => monthlyStatus.value.filter((m) => m.status === 'reconciled').length);
const allMonthsReconciled = computed(() => activeMonthCount.value > 0 && reconciledMonthCount.value === activeMonthCount.value);

const budgetComparison = computed(() => {
	const currentMonth = new Date().getMonth() + 1;

	return budgetCategories.value.map((category) => {
		const categoryTx = transactions.value.filter((t) => t.category_id === category.id);
		const ytdActual = categoryTx.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
		const monthlyBudget = safeParseFloat(category.monthly_budget);
		const ytdBudget = monthlyBudget * currentMonth;
		const variance = ytdBudget - ytdActual;
		const variancePercent = ytdBudget > 0 ? (variance / ytdBudget) * 100 : 0;

		return {
			category: category.category_name,
			color: category.color,
			ytdBudget,
			ytdActual,
			variance,
			variancePercent,
		};
	});
});

// Fetch data
const fetchData = async () => {
	loading.value = true;

	try {
		const year = unref(selectedYear);

		const [accountsData, transactionsData, statementsData, reportsData, categoriesData] = await Promise.all([
			accountsCollection.list({
				sort: ['account_number'],
				fields: ['*'],
			}),
			transactionsCollection.list({
				filter: { fiscal_year: { _eq: year } },
				sort: ['transaction_date'],
				fields: ['*'],
				limit: -1,
			}),
			monthlyStatementsCollection.list({
				filter: { fiscal_year: { _eq: year } },
				sort: ['statement_month'],
				fields: ['*'],
			}),
			reconciliationReportsCollection.list({
				filter: { fiscal_year_id: { year: { _eq: year } } },
				fields: ['*'],
			}),
			budgetCategoriesCollection.list({
				filter: { fiscal_year: { year: { _eq: year } } },
				sort: ['sort', 'category_name'],
				fields: ['*'],
			}),
		]);

		accounts.value = accountsData || [];
		transactions.value = transactionsData || [];
		monthlyStatements.value = statementsData || [];
		reconciliationReports.value = reportsData || [];
		budgetCategories.value = categoriesData || [];
	} catch (e) {
		console.error('Error fetching data:', e);
	} finally {
		loading.value = false;
	}
};

// Initialize
onMounted(() => {
	fetchData();
});

// Watch for year changes
watch(selectedYear, () => {
	fetchData();
});
</script>
