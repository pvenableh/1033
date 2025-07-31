<template>
	<div class="space-y-6">
		<!-- Phase Overview -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<UCard v-for="phase in actionPhases" :key="phase.name">
				<div class="text-center">
					<div class="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" :class="phase.bgColor">
						<UIcon :name="phase.icon" class="w-8 h-8" :class="phase.iconColor" />
					</div>
					<h4 class="font-bold text-gray-900 uppercase tracking-wider">{{ phase.name }}</h4>
					<p class="text-sm text-gray-600 mt-1">{{ phase.timeline }}</p>
					<UBadge :color="phase.badgeColor" variant="subtle" class="mt-2">{{ phase.items }} Actions</UBadge>
				</div>
			</UCard>
		</div>

		<!-- Detailed Action Plans -->
		<UAccordion
			:items="detailedActions"
			:ui="{
				wrapper: 'space-y-4',
				container: 'border border-gray-200 rounded-lg overflow-hidden',
			}"
		>
			<template #default="{ item, open }">
				<UButton
					color="gray"
					variant="ghost"
					class="w-full flex items-center justify-between p-4 hover:bg-gray-50"
					:trailing-icon="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
				>
					<div class="flex items-center space-x-3">
						<div
							class="w-8 h-8 rounded-full flex items-center justify-center"
							:class="item.priority === 'critical' ? 'bg-red-100' : 'bg-yellow-100'"
						>
							<span
								class="text-sm font-bold"
								:class="item.priority === 'critical' ? 'text-red-600' : 'text-yellow-600'"
							>
								{{ item.id }}
							</span>
						</div>
						<div class="text-left">
							<h4 class="font-semibold text-gray-900">{{ item.title }}</h4>
							<p class="text-sm text-gray-600">{{ item.subtitle }}</p>
						</div>
					</div>
				</UButton>
			</template>

			<template #item="{ item }">
				<div class="p-4 bg-gray-50 space-y-4">
					<!-- Action Steps -->
					<div>
						<h5 class="font-semibold text-gray-900 mb-2">Action Steps:</h5>
						<ol class="space-y-2">
							<li v-for="(step, index) in item.steps" :key="index" class="flex items-start">
								<span
									class="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-2"
								>
									{{ index + 1 }}
								</span>
								<span class="text-sm text-gray-700">{{ step }}</span>
							</li>
						</ol>
					</div>

					<!-- Responsible Parties -->
					<div>
						<h5 class="font-semibold text-gray-900 mb-2">Responsible:</h5>
						<div class="flex flex-wrap gap-2">
							<UBadge v-for="party in item.responsible" :key="party" variant="outline">
								{{ party }}
							</UBadge>
						</div>
					</div>

					<!-- Timeline -->
					<div class="flex items-center justify-between pt-3 border-t border-gray-200">
						<div>
							<p class="text-sm font-medium text-gray-900">Deadline:</p>
							<p class="text-sm text-gray-600">{{ item.deadline }}</p>
						</div>
						<UButton
							v-if="item.hasTemplate"
							color="primary"
							variant="soft"
							size="sm"
							icon="i-heroicons-document-arrow-down"
						>
							Download Template
						</UButton>
					</div>
				</div>
			</template>
		</UAccordion>

		<!-- Compliance Monitoring -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Compliance Monitoring Dashboard</h3>
			</template>

			<div class="space-y-4">
				<div
					v-for="monitor in complianceMonitors"
					:key="monitor.metric"
					class="border-l-4 pl-4"
					:class="monitor.borderColor"
				>
					<div class="flex items-center justify-between">
						<div>
							<h4 class="font-semibold text-gray-900">{{ monitor.metric }}</h4>
							<p class="text-sm text-gray-600">{{ monitor.description }}</p>
						</div>
						<div class="text-right">
							<p class="text-2xl font-bold" :class="monitor.valueColor">{{ monitor.current }}</p>
							<p class="text-sm text-gray-500">Target: {{ monitor.target }}</p>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Success Metrics -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Success Metrics & Milestones</h3>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h4 class="font-semibold text-gray-900 mb-3">30-Day Goals</h4>
					<ul class="space-y-2">
						<li v-for="goal in thirtyDayGoals" :key="goal" class="flex items-start">
							<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 mr-2 mt-0.5" />
							<span class="text-sm text-gray-700">{{ goal }}</span>
						</li>
					</ul>
				</div>

				<div>
					<h4 class="font-semibold text-gray-900 mb-3">90-Day Goals</h4>
					<ul class="space-y-2">
						<li v-for="goal in ninetyDayGoals" :key="goal" class="flex items-start">
							<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
							<span class="text-sm text-gray-700">{{ goal }}</span>
						</li>
					</ul>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref } from 'vue';

const actionPhases = ref([
	{
		name: 'Phase 1',
		timeline: 'Immediate (7 days)',
		items: 5,
		icon: 'i-heroicons-exclamation-triangle',
		bgColor: 'bg-red-100',
		iconColor: 'text-red-600',
		badgeColor: 'red',
	},
	{
		name: 'Phase 2',
		timeline: 'Short-term (30 days)',
		items: 4,
		icon: 'i-heroicons-clock',
		bgColor: 'bg-yellow-100',
		iconColor: 'text-yellow-600',
		badgeColor: 'yellow',
	},
	{
		name: 'Phase 3',
		timeline: 'Long-term (90 days)',
		items: 3,
		icon: 'i-heroicons-shield-check',
		bgColor: 'bg-green-100',
		iconColor: 'text-green-600',
		badgeColor: 'green',
	},
]);

const detailedActions = ref([
	{
		id: '1',
		priority: 'critical',
		title: 'Stop All Inter-Account Transfers',
		subtitle: 'Immediate freeze on fund mixing',
		label: 'Stop All Inter-Account Transfers - Immediate',
		steps: [
			'Contact Chase Bank immediately to implement transfer restrictions',
			'Require dual signatures for any inter-account transfers',
			'Notify management company of new restrictions',
			'Document all existing transfers for reversal',
		],
		responsible: ['Board President', 'Board Treasurer', 'Bank Manager'],
		deadline: 'Within 24 hours',
		hasTemplate: true,
	},
	{
		id: '2',
		priority: 'critical',
		title: 'Emergency Board Meeting',
		subtitle: 'Address compliance violations',
		label: 'Emergency Board Meeting - Within 7 days',
		steps: [
			'Schedule emergency board meeting with 48-hour notice',
			'Prepare violation documentation and financial reports',
			'Draft board resolution for fund segregation',
			'Vote on immediate corrective actions',
			'Document all decisions in meeting minutes',
		],
		responsible: ['Board President', 'Board Secretary', 'All Board Members'],
		deadline: 'Within 7 days',
		hasTemplate: true,
	},
	{
		id: '3',
		priority: 'critical',
		title: 'Document & Reverse Violations',
		subtitle: 'Create audit trail and correct transfers',
		label: 'Document & Reverse Violations - Within 14 days',
		steps: [
			'Create spreadsheet of all improper transfers',
			'Calculate net impact on each account',
			'Prepare reversal journal entries',
			'Execute approved reversals with board oversight',
			'File documentation for audit purposes',
		],
		responsible: ['Board Treasurer', 'CPA', 'Management Company'],
		deadline: 'Within 14 days',
		hasTemplate: false,
	},
	{
		id: '4',
		priority: 'high',
		title: 'Implement Expense Controls',
		subtitle: 'Control cash flow and prevent depletion',
		label: 'Implement Expense Controls - Within 30 days',
		steps: [
			'Freeze all non-essential spending',
			'Require board approval for expenses over $500',
			'Review and renegotiate vendor contracts',
			'Implement purchase order system',
			'Create monthly spending limits by category',
		],
		responsible: ['Board Treasurer', 'Management Company'],
		deadline: 'Within 30 days',
		hasTemplate: true,
	},
	{
		id: '5',
		priority: 'high',
		title: 'Establish Fund Segregation Policy',
		subtitle: 'Create written policies and procedures',
		label: 'Establish Fund Segregation Policy - Within 30 days',
		steps: [
			'Draft comprehensive fund segregation policy',
			'Define permitted uses for each account',
			'Establish approval procedures for transfers',
			'Create monthly reconciliation procedures',
			'Board review and approval of policy',
		],
		responsible: ['Board', 'Legal Counsel', 'CPA'],
		deadline: 'Within 30 days',
		hasTemplate: true,
	},
]);

const complianceMonitors = ref([
	{
		metric: 'Unauthorized Transfers',
		description: 'Inter-account transfers without board approval',
		current: '0',
		target: '0',
		borderColor: 'border-green-500',
		valueColor: 'text-green-600',
	},
	{
		metric: 'Operating Balance',
		description: 'Minimum balance maintenance',
		current: '$33,888',
		target: '>$35,000',
		borderColor: 'border-yellow-500',
		valueColor: 'text-yellow-600',
	},
	{
		metric: 'Budget Variance',
		description: 'Actual vs budgeted expenses',
		current: '+25.5%',
		target: '<10%',
		borderColor: 'border-red-500',
		valueColor: 'text-red-600',
	},
	{
		metric: 'Monthly Reconciliation',
		description: 'Timely account reconciliation',
		current: 'Pending',
		target: 'By 15th',
		borderColor: 'border-yellow-500',
		valueColor: 'text-yellow-600',
	},
]);

const thirtyDayGoals = ref([
	'Zero unauthorized transfers between accounts',
	'All improper transfers documented and reversed',
	'Fund segregation policy approved and implemented',
	'Operating account stabilized above $35,000',
	'Legal fee investigation completed',
	'Monthly reconciliation process established',
]);

const ninetyDayGoals = ref([
	'Full compliance with fund segregation requirements',
	'Budget variance reduced to under 10%',
	'Operating reserves rebuilt to 3 months expenses',
	'Vendor contracts renegotiated for cost savings',
	'Automated compliance monitoring in place',
	'Quarterly financial review process established',
]);
</script>
