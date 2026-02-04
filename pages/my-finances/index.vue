<template>
	<div class="container mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="t-bg-subtle rounded-lg border t-border p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold uppercase tracking-wider mb-2 t-text">
						My Finances
					</h1>
					<p class="t-text-secondary">
						View HOA financial summaries and budget information
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
			<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin t-text-muted mx-auto" />
			<p class="mt-2 t-text-secondary">Loading financial data...</p>
		</div>

		<template v-else>
			<!-- Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card class="text-center">
					<CardContent class="pt-6">
						<div class="space-y-2">
							<UIcon name="i-heroicons-banknotes" class="w-8 h-8 mx-auto text-blue-600" />
							<p class="text-xs uppercase tracking-wide t-text-secondary mb-1">Total Accounts</p>
							<p class="text-2xl font-bold text-blue-600">
								{{ accounts.length }}
							</p>
							<p class="text-xs t-text-muted">Active bank accounts</p>
						</div>
					</CardContent>
				</Card>
				<Card class="text-center">
					<CardContent class="pt-6">
						<div class="space-y-2">
							<UIcon name="i-heroicons-calculator" class="w-8 h-8 mx-auto text-green-600" />
							<p class="text-xs uppercase tracking-wide t-text-secondary mb-1">Annual Budget</p>
							<p class="text-2xl font-bold text-green-600">
								{{ formatCurrency(annualBudget) }}
							</p>
							<p class="text-xs t-text-muted">FY {{ selectedYear }}</p>
						</div>
					</CardContent>
				</Card>
				<Card class="text-center">
					<CardContent class="pt-6">
						<div class="space-y-2">
							<UIcon name="i-heroicons-chart-pie" class="w-8 h-8 mx-auto text-purple-600" />
							<p class="text-xs uppercase tracking-wide t-text-secondary mb-1">Budget Categories</p>
							<p class="text-2xl font-bold text-purple-600">
								{{ budgetCategories.length }}
							</p>
							<p class="text-xs t-text-muted">Active categories</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Account Overview -->
			<Card>
				<CardHeader>
					<CardTitle class="text-lg uppercase tracking-wide t-text">
						Account Overview
					</CardTitle>
					<CardDescription>
						Current balance information for all HOA accounts
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div
							v-for="account in accounts"
							:key="account.id"
							class="border t-border rounded-lg p-4 t-bg-subtle">
							<div class="flex items-center justify-between mb-2">
								<h3 class="font-semibold t-text">{{ account.account_name }}</h3>
								<UBadge :color="getAccountTypeColor(account.account_type)" variant="soft" size="sm">
									{{ account.account_type }}
								</UBadge>
							</div>
							<p class="text-2xl font-bold t-text">
								{{ formatCurrency(getAccountBalance(account.id)) }}
							</p>
							<p class="text-sm t-text-muted mt-1">
								Account #{{ account.account_number }}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Budget Categories -->
			<Card>
				<CardHeader>
					<CardTitle class="text-lg uppercase tracking-wide t-text">
						Budget Allocation - {{ selectedYear }}
					</CardTitle>
					<CardDescription>
						How funds are allocated across budget categories
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						<div
							v-for="category in budgetCategories"
							:key="category.id"
							class="flex items-center justify-between py-2 border-b t-border last:border-0">
							<div class="flex items-center gap-3">
								<div
									class="w-4 h-4 rounded-full"
									:style="{ backgroundColor: category.color || '#6B7280' }"></div>
								<span class="font-medium t-text">{{ category.category_name }}</span>
							</div>
							<div class="text-right">
								<span class="font-semibold t-text">{{ formatCurrency(category.monthly_budget * 12) }}</span>
								<span class="text-xs t-text-muted ml-2">/year</span>
							</div>
						</div>
					</div>
					<div class="mt-4 pt-4 border-t t-border flex justify-between items-center">
						<span class="font-semibold uppercase tracking-wide t-text">Total Annual Budget</span>
						<span class="text-xl font-bold text-green-600">{{ formatCurrency(annualBudget) }}</span>
					</div>
				</CardContent>
			</Card>

			<!-- Quick Links -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<NuxtLink to="/documents">
					<Card class="hover:border-primary-500 transition-colors cursor-pointer h-full">
						<CardContent class="pt-6">
							<div class="flex items-center gap-4">
								<div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
									<UIcon name="i-heroicons-document-text" class="w-8 h-8 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<h3 class="font-semibold t-text">Financial Documents</h3>
									<p class="text-sm t-text-secondary">
										View financial reports and statements
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</NuxtLink>

				<NuxtLink to="/announcements">
					<Card class="hover:border-primary-500 transition-colors cursor-pointer h-full">
						<CardContent class="pt-6">
							<div class="flex items-center gap-4">
								<div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
									<UIcon name="i-heroicons-megaphone" class="w-8 h-8 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<h3 class="font-semibold t-text">Announcements</h3>
									<p class="text-sm t-text-secondary">
										View financial announcements and updates
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</NuxtLink>
			</div>

			<!-- Info Card -->
			<Card class="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
				<CardContent class="pt-6">
					<div class="flex items-start gap-4">
						<UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
						<div>
							<h4 class="font-semibold text-blue-800 dark:text-blue-200 mb-1">About HOA Finances</h4>
							<p class="text-sm text-blue-700 dark:text-blue-300">
								This page provides a summary of the HOA's financial position. For detailed transaction history,
								budget analysis, and compliance information, please contact the board or attend the next
								board meeting.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</template>
	</div>
</template>

<script setup>
import { CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';

definePageMeta({ layout: 'default' });

useSeoMeta({
	title: 'My Finances',
});

const accountsCollection = useDirectusItems('accounts');
const monthlyStatementsCollection = useDirectusItems('monthly_statements');
const budgetCategoriesCollection = useDirectusItems('budget_categories');

// State
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const loading = ref(true);

// Data stores
const accounts = ref([]);
const monthlyStatements = ref([]);
const budgetCategories = ref([]);

// Year options
const yearOptions = computed(() => {
	const years = [];
	for (let y = currentYear - 2; y <= currentYear + 1; y++) {
		years.push({ label: `FY ${y}`, value: y });
	}
	return years;
});

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

const getAccountTypeColor = (type) => {
	const colors = {
		operating: 'blue',
		reserve: 'green',
		special: 'purple',
	};
	return colors[type] || 'gray';
};

const getAccountBalance = (accountId) => {
	const latestStatement = monthlyStatements.value
		.filter((s) => s.account_id === accountId)
		.sort((a, b) => b.statement_month.localeCompare(a.statement_month))[0];
	return latestStatement ? safeParseFloat(latestStatement.ending_balance) : 0;
};

// Computed values
const annualBudget = computed(() => {
	return budgetCategories.value.reduce((sum, cat) => sum + safeParseFloat(cat.monthly_budget) * 12, 0);
});

// Fetch data
const fetchData = async () => {
	loading.value = true;

	try {
		const year = unref(selectedYear);

		const [accountsData, statementsData, categoriesData] = await Promise.all([
			accountsCollection.list({
				sort: ['account_number'],
				fields: ['*'],
			}),
			monthlyStatementsCollection.list({
				filter: { fiscal_year: { _eq: year } },
				sort: ['statement_month'],
				fields: ['*'],
			}),
			budgetCategoriesCollection.list({
				filter: { fiscal_year: { year: { _eq: year } } },
				sort: ['sort', 'category_name'],
				fields: ['*'],
			}),
		]);

		accounts.value = accountsData || [];
		monthlyStatements.value = statementsData || [];
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
