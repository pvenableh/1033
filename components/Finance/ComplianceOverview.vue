<template>
	<div class="space-y-6">
		<!-- Compliance Status -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900">Compliance Status Overview</h3>
					<UBadge :color="compliance.compliant ? 'green' : 'red'" variant="solid" size="lg">
						{{ compliance.compliant ? 'COMPLIANT' : 'NON-COMPLIANT' }}
					</UBadge>
				</div>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Critical Issues -->
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3">
						<span class="text-2xl font-bold text-red-600">{{ compliance.criticalIssues?.length || 0 }}</span>
					</div>
					<h4 class="font-semibold text-gray-900">Critical Issues</h4>
					<p class="text-sm text-gray-600 mt-1">Require immediate action</p>
				</div>

				<!-- Violations -->
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-3">
						<span class="text-2xl font-bold text-orange-600">{{ compliance.violations?.length || 0 }}</span>
					</div>
					<h4 class="font-semibold text-gray-900">Violations</h4>
					<p class="text-sm text-gray-600 mt-1">Fund segregation issues</p>
				</div>

				<!-- Warnings -->
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-3">
						<span class="text-2xl font-bold text-yellow-600">{{ compliance.warnings?.length || 0 }}</span>
					</div>
					<h4 class="font-semibold text-gray-900">Warnings</h4>
					<p class="text-sm text-gray-600 mt-1">Monitor closely</p>
				</div>
			</div>
		</UCard>

		<!-- Critical Issues Detail -->
		<div v-if="compliance.criticalIssues?.length > 0" class="space-y-4">
			<h3 class="text-lg font-bold text-red-900 flex items-center">
				<UIcon name="i-heroicons-exclamation-circle" class="w-6 h-6 mr-2" />
				Critical Compliance Issues
			</h3>

			<div
				v-for="issue in compliance.criticalIssues"
				:key="issue.statute"
				class="bg-red-50 border border-red-200 rounded-lg p-4"
			>
				<div class="flex items-start space-x-3">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 mt-0.5" />
					<div class="flex-1">
						<h4 class="font-semibold text-red-900">{{ issue.statute }}</h4>
						<p class="text-sm text-red-800 mt-1">{{ issue.issue }}</p>
						<div class="mt-3 flex items-center space-x-4">
							<UBadge color="red" variant="solid" size="sm">{{ issue.severity }}</UBadge>
							<p class="text-sm font-medium text-red-900">Action: {{ issue.action }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Violations Detail -->
		<div v-if="compliance.violations?.length > 0" class="space-y-4">
			<h3 class="text-lg font-bold text-orange-900 flex items-center">
				<UIcon name="i-heroicons-shield-exclamation" class="w-6 h-6 mr-2" />
				Fund Segregation Violations
			</h3>

			<div
				v-for="violation in compliance.violations"
				:key="violation.type"
				class="bg-orange-50 border border-orange-200 rounded-lg p-4"
			>
				<div class="flex items-start justify-between">
					<div>
						<h4 class="font-semibold text-orange-900">{{ violation.type }}</h4>
						<p class="text-sm text-orange-800 mt-1">{{ violation.count }} violations detected</p>
						<p class="text-sm font-medium text-orange-900 mt-2">{{ violation.action }}</p>
					</div>
					<UBadge color="orange" variant="solid">{{ violation.severity }}</UBadge>
				</div>
			</div>
		</div>

		<!-- Fiduciary Risk Assessment -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900">Fiduciary Risk Assessment</h3>
			</template>

			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
					<span class="font-semibold text-gray-900">Overall Fiduciary Risk Level</span>
					<UBadge
						:color="
							compliance.fiduciaryRisk === 'HIGH' ? 'red' : compliance.fiduciaryRisk === 'MODERATE' ? 'orange' : 'green'
						"
						variant="solid"
						size="lg"
					>
						{{ compliance.fiduciaryRisk }}
					</UBadge>
				</div>

				<div class="p-4 bg-yellow-50 rounded-lg">
					<h4 class="font-semibold text-yellow-900 mb-2">Board Member Liability Warning</h4>
					<p class="text-sm text-yellow-800">Board members may face personal liability for:</p>
					<ul class="text-sm text-yellow-800 mt-2 space-y-1">
						<li>• Failure to maintain statutory reserve requirements</li>
						<li>• Improper handling of special assessment funds</li>
						<li>• Breach of fiduciary duty in financial management</li>
						<li>• Failure to address known compliance violations</li>
					</ul>
				</div>

				<!-- Miami Beach Specific Requirements -->
				<div class="p-4 bg-blue-50 rounded-lg">
					<h4 class="font-semibold text-blue-900 mb-2">Miami Beach HOA Requirements</h4>
					<ul class="text-sm text-blue-800 space-y-1">
						<li>• Maintain reserves per FL Statute 718.112(2)(f)</li>
						<li>• Annual financial reporting to unit owners</li>
						<li>• Proper fund segregation and accounting</li>
						<li>• Board fiduciary duty compliance</li>
						<li>• 40-year recertification funding (Miami-Dade requirement)</li>
					</ul>
				</div>
			</div>
		</UCard>

		<!-- Corrective Action Timeline -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900">Corrective Action Timeline</h3>
			</template>

			<div class="space-y-3">
				<div class="relative">
					<div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300"></div>

					<div v-for="(action, index) in correctiveActions" :key="index" class="relative flex items-start pb-6">
						<div
							class="absolute left-0 w-8 h-8 bg-white rounded-full border-4"
							:class="action.urgent ? 'border-red-500' : 'border-gray-300'"
						>
							<div v-if="action.urgent" class="w-full h-full rounded-full bg-red-500 animate-pulse"></div>
						</div>

						<div class="ml-12">
							<div class="flex items-center space-x-2 mb-1">
								<h4 class="font-semibold text-gray-900">{{ action.title }}</h4>
								<UBadge :color="action.urgent ? 'red' : 'gray'" variant="subtle" size="sm">
									{{ action.timeline }}
								</UBadge>
							</div>
							<p class="text-sm text-gray-600">{{ action.description }}</p>
						</div>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	compliance: {
		type: Object,
		required: true,
	},
});

const correctiveActions = computed(() => [
	{
		title: 'Emergency Board Meeting',
		description: 'Call emergency meeting to address reserve crisis and compliance violations',
		timeline: 'Within 7 days',
		urgent: true,
	},
	{
		title: 'Cease Fund Transfers',
		description: 'Immediately stop all transfers between operating and special assessment accounts',
		timeline: 'Immediate',
		urgent: true,
	},
	{
		title: 'Special Assessment Vote',
		description: 'Prepare and vote on special assessment to restore reserve funding',
		timeline: 'Within 30 days',
		urgent: true,
	},
	{
		title: 'Legal Consultation',
		description: 'Engage HOA attorney to review fiduciary compliance and liability',
		timeline: 'Within 14 days',
		urgent: false,
	},
	{
		title: 'Reserve Study Update',
		description: 'Commission professional reserve study to establish proper funding levels',
		timeline: 'Within 60 days',
		urgent: false,
	},
	{
		title: 'Financial Controls Implementation',
		description: 'Implement dual approval processes and segregation controls',
		timeline: 'Within 45 days',
		urgent: false,
	},
]);
</script>
