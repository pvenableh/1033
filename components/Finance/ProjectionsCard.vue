<template>
	<UCard>
		<template #header>
			<h3 class="text-lg font-bold text-gray-900">Financial Projections</h3>
		</template>

		<div class="space-y-6">
			<!-- Key Projections -->
			<div class="grid grid-cols-2 gap-4">
				<div class="bg-gray-50 rounded-lg p-4 text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Operating Runway</p>
					<p class="mt-2 text-3xl font-bold text-orange-600">{{ projections.operatingRunway }}</p>
					<p class="text-sm text-gray-600">months remaining</p>
				</div>

				<div class="bg-red-50 rounded-lg p-4 text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Critical Date</p>
					<p class="mt-2 text-2xl font-bold text-red-600">{{ projections.criticalDate }}</p>
					<p class="text-sm text-gray-600">cash depletion</p>
				</div>
			</div>

			<!-- Assessment Requirements -->
			<div class="border-t pt-4">
				<h4 class="font-semibold text-gray-900 mb-3">Special Assessment Requirements</h4>

				<div class="bg-blue-50 rounded-lg p-4">
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div>
							<p class="text-sm text-gray-600">Total Needed</p>
							<p class="text-xl font-bold text-gray-900">${{ projections.requiredAssessment.toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-sm text-gray-600">Per Unit (32 units)</p>
							<p class="text-xl font-bold text-gray-900">
								${{ Math.round(projections.requiredAssessment / 32).toLocaleString() }}
							</p>
						</div>
					</div>

					<div class="space-y-2">
						<p class="text-sm font-medium text-gray-900">Payment Options:</p>
						<ul class="text-sm text-gray-700 space-y-1">
							<li>• Lump sum: ${{ Math.round(projections.requiredAssessment / 32).toLocaleString() }} per unit</li>
							<li>
								• 6 months: ${{ Math.round(projections.requiredAssessment / 32 / 6).toLocaleString() }}/month per unit
							</li>
							<li>
								• 12 months: ${{ Math.round(projections.requiredAssessment / 32 / 12).toLocaleString() }}/month per unit
							</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Cash Flow Projections -->
			<div class="border-t pt-4">
				<h4 class="font-semibold text-gray-900 mb-3">Monthly Cash Flow Analysis</h4>

				<div class="space-y-2">
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">Average Monthly Revenue</span>
						<span class="text-sm font-medium text-green-600">+$35,000</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">Average Monthly Expenses</span>
						<span class="text-sm font-medium text-red-600">-$38,500</span>
					</div>
					<div class="flex justify-between items-center pt-2 border-t">
						<span class="text-sm font-semibold text-gray-900">Monthly Shortfall</span>
						<span class="text-sm font-bold text-red-600">-${{ projections.monthlyShortfall.toLocaleString() }}</span>
					</div>
				</div>

				<UAlert color="orange" icon="i-heroicons-exclamation-triangle" class="mt-4">
					<template #description>
						<p class="text-sm">
							Without immediate action, the operating account will be depleted by {{ projections.criticalDate }}. A
							combination of expense reduction and revenue increase is required.
						</p>
					</template>
				</UAlert>
			</div>

			<!-- Recommendations -->
			<div class="border-t pt-4">
				<h4 class="font-semibold text-gray-900 mb-3">Financial Recommendations</h4>

				<div class="space-y-2">
					<div class="flex items-start space-x-2">
						<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600 mt-0.5" />
						<p class="text-sm text-gray-700">Implement special assessment immediately to restore reserves</p>
					</div>
					<div class="flex items-start space-x-2">
						<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600 mt-0.5" />
						<p class="text-sm text-gray-700">Increase monthly assessments by 10-15% for 2026</p>
					</div>
					<div class="flex items-start space-x-2">
						<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600 mt-0.5" />
						<p class="text-sm text-gray-700">Negotiate insurance to quarterly payments (save $18K cash flow)</p>
					</div>
					<div class="flex items-start space-x-2">
						<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600 mt-0.5" />
						<p class="text-sm text-gray-700">Review all vendor contracts for cost reduction opportunities</p>
					</div>
				</div>
			</div>
		</div>
	</UCard>
</template>

<script setup>
defineProps({
	projections: {
		type: Object,
		required: true,
	},
});
</script>
