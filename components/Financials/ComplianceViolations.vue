<template>
	<div class="space-y-6">
		<!-- Critical Alert -->
		<UAlert
			icon="i-heroicons-exclamation-triangle"
			color="red"
			variant="solid"
			title="CRITICAL COMPLIANCE VIOLATIONS DETECTED"
			description="Immediate board action required to prevent legal and fiduciary liability"
		/>

		<!-- Fund Mixing Violations -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Fund Mixing Violations</h3>
					<UBadge color="red" variant="solid">URGENT</UBadge>
				</div>
			</template>

			<div class="space-y-4">
				<p class="text-gray-700">
					Multiple unauthorized transfers detected between operating account (5129) and special assessment account
					(5872). This violates HOA fiduciary duties and special assessment restrictions.
				</p>

				<!-- Violation Table -->
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									From Account
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									To Account
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							<tr v-for="violation in fundMixingViolations" :key="violation.id">
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
									{{ violation.date }}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
									{{ violation.fromAccount }}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
									{{ violation.toAccount }}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
									${{ violation.amount.toLocaleString() }}
								</td>
								<td class="px-4 py-3 whitespace-nowrap">
									<UBadge color="red" variant="subtle" size="sm">
										{{ violation.status }}
									</UBadge>
								</td>
							</tr>
						</tbody>
						<tfoot>
							<tr class="bg-red-50">
								<td colspan="3" class="px-4 py-3 text-sm font-semibold text-gray-900">Total Improper Transfers</td>
								<td class="px-4 py-3 text-sm font-bold text-red-600">${{ totalViolationAmount.toLocaleString() }}</td>
								<td></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</UCard>

		<!-- Legal Risks -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Legal & Fiduciary Risks</h3>
			</template>

			<div class="space-y-4">
				<div v-for="risk in legalRisks" :key="risk.title" class="border-l-4 border-red-500 pl-4 py-2">
					<h4 class="font-semibold text-gray-900">{{ risk.title }}</h4>
					<p class="text-sm text-gray-600 mt-1">{{ risk.description }}</p>
				</div>
			</div>
		</UCard>

		<!-- Required Actions -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Required Corrective Actions</h3>
			</template>

			<div class="space-y-3">
				<div v-for="(action, index) in requiredActions" :key="index" class="flex items-start space-x-3">
					<div class="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
						<span class="text-sm font-bold text-red-600">{{ index + 1 }}</span>
					</div>
					<div class="flex-1">
						<h4 class="font-semibold text-gray-900">{{ action.title }}</h4>
						<p class="text-sm text-gray-600 mt-1">{{ action.description }}</p>
						<div v-if="action.deadline" class="mt-2">
							<UBadge color="orange" variant="subtle" size="sm">Deadline: {{ action.deadline }}</UBadge>
						</div>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useReconciliationData } from '~/composables/useReconciliationData';

// Get data from composable
const { getOperatingData, getSpecialAssessmentData } = useReconciliationData();

// Current month - could be passed as prop or use a store
const currentMonth = ref('June 2025');

// Get current data
const operatingData = computed(() => getOperatingData(currentMonth.value));
const specialData = computed(() => getSpecialAssessmentData(currentMonth.value));

// Combine violations from both accounts
const fundMixingViolations = computed(() => {
	const violations = [];
	let id = 1;

	// Get violations from operating account
	const operatingViolations = operatingData.value.violations || [];
	operatingViolations.forEach((v) => {
		violations.push({
			id: id++,
			date: v.date,
			fromAccount: v.type === 'outgoing' ? '5129' : '5872',
			toAccount: v.type === 'outgoing' ? '5872' : '5129',
			amount: v.amount,
			status: 'Investigate',
		});
	});

	// Get violations from special assessment account
	const specialViolations = specialData.value.improperTransfers || [];
	specialViolations.forEach((v) => {
		const isFromOperating = v.direction.includes('From Operating');
		violations.push({
			id: id++,
			date: v.date,
			fromAccount: isFromOperating ? '5129' : '5872',
			toAccount: isFromOperating ? '5872' : '5129',
			amount: v.amount,
			status: v.action,
		});
	});

	return violations;
});

const totalViolationAmount = computed(() => {
	return fundMixingViolations.value.reduce((sum, violation) => sum + violation.amount, 0);
});

const legalRisks = ref([
	{
		title: 'Breach of Fiduciary Duty',
		description:
			'Board members may be personally liable for misuse of special assessment funds designated for 40-year recertification.',
	},
	{
		title: 'Violation of Special Assessment Restrictions',
		description:
			'Using special assessment funds for operational expenses violates the stated purpose and resident authorization.',
	},
	{
		title: 'Financial Reporting Compliance',
		description: 'Improper fund accounting may result in audit findings and potential regulatory action.',
	},
	{
		title: 'Resident Trust Violation',
		description: 'Misuse of designated funds undermines resident trust and may lead to legal action against the board.',
	},
]);

const requiredActions = ref([
	{
		title: 'Immediately Stop All Inter-Account Transfers',
		description: 'Freeze all transfers between accounts 5129 and 5872. Implement dual approval requirement.',
		deadline: 'Immediate',
	},
	{
		title: 'Document and Reverse Improper Transfers',
		description: 'Create detailed documentation of all improper transfers and reverse where possible.',
		deadline: 'Within 7 days',
	},
	{
		title: 'Emergency Board Meeting',
		description: 'Convene emergency board meeting to address violations and implement controls.',
		deadline: 'Within 7 days',
	},
	{
		title: 'Implement Fund Segregation Policy',
		description: 'Establish written policy prohibiting fund mixing with clear approval procedures.',
		deadline: 'Within 30 days',
	},
	{
		title: 'Notify Residents',
		description: 'Provide transparent communication to residents about corrective actions taken.',
		deadline: 'Within 30 days',
	},
]);
</script>
