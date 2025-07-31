<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<div class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-3xl font-bold text-gray-900 tracking-wider uppercase">Monthly Reconciliation</h1>
						<p class="mt-2 text-gray-600">Detailed account reconciliation and compliance tracking</p>
					</div>
					<UButton color="primary" icon="i-heroicons-document-arrow-down" size="lg">Export Report</UButton>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Month Selector and Status -->
			<div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
				<UCard>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Reconciliation Period</p>
							<USelectMenu v-model="selectedMonth" :options="months" class="mt-2" />
						</div>
						<UIcon name="i-heroicons-calendar" class="w-8 h-8 text-gray-400" />
					</div>
				</UCard>

				<UCard>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Reconciliation Status</p>
							<div class="mt-2 flex items-center space-x-2">
								<UIcon :name="reconciliationStatus.icon" class="w-5 h-5" :class="reconciliationStatus.color" />
								<span class="font-semibold" :class="reconciliationStatus.color">
									{{ reconciliationStatus.text }}
								</span>
							</div>
						</div>
						<UIcon name="i-heroicons-clipboard-document-check" class="w-8 h-8 text-gray-400" />
					</div>
				</UCard>

				<UCard>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Compliance Issues</p>
							<div class="mt-2 flex items-center space-x-2">
								<span class="text-2xl font-bold text-red-600">{{ totalViolations }}</span>
								<span class="text-sm text-gray-600">violations found</span>
							</div>
						</div>
						<UIcon name="i-heroicons-shield-exclamation" class="w-8 h-8 text-red-400" />
					</div>
				</UCard>
			</div>

			<!-- Account Tabs -->
			<UTabs :items="accountTabs" class="space-y-8">
				<template #item="{ item }">
					<div v-if="item.key === 'operating'">
						<FinancialsOperatingAccountReconciliation :month="selectedMonth" />
					</div>
					<div v-else-if="item.key === 'special'">
						<FinancialsSpecialAssessmentReconciliation :month="selectedMonth" />
					</div>
					<div v-else-if="item.key === 'reserve'">
						<FinancialsReserveAccountReconciliation :month="selectedMonth" />
					</div>
				</template>
			</UTabs>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useReconciliationData } from '~/composables/useReconciliationData';

const { getViolationCount } = useReconciliationData();

const selectedMonth = ref('June 2025');
const months = ref(['June 2025', 'May 2025', 'April 2025', 'March 2025', 'February 2025', 'January 2025']);

// Get reactive violation count
const totalViolations = computed(() => getViolationCount(selectedMonth.value));

// Reconciliation status based on month
const reconciliationStatus = computed(() => {
	const approvedMonths = ['April 2025', 'March 2025', 'February 2025', 'January 2025'];

	if (approvedMonths.includes(selectedMonth.value)) {
		return {
			text: 'Approved',
			icon: 'i-heroicons-check-circle',
			color: 'text-green-600',
		};
	} else if (totalViolations.value > 0) {
		return {
			text: 'Violations Found',
			icon: 'i-heroicons-x-circle',
			color: 'text-red-600',
		};
	} else {
		return {
			text: 'Pending Review',
			icon: 'i-heroicons-exclamation-triangle',
			color: 'text-yellow-600',
		};
	}
});

// Dynamic tab badges based on violations
const accountTabs = computed(() => [
	{
		key: 'operating',
		label: 'Operating Account',
		icon: 'i-heroicons-banknotes',
		badge: totalViolations.value > 0 ? Math.ceil(totalViolations.value / 2) : undefined,
	},
	{
		key: 'special',
		label: 'Special Assessment',
		icon: 'i-heroicons-exclamation-triangle',
		badge: totalViolations.value > 0 ? Math.floor(totalViolations.value / 2) : undefined,
	},
	{
		key: 'reserve',
		label: 'Reserve Account',
		icon: 'i-heroicons-shield-check',
	},
]);
</script>
