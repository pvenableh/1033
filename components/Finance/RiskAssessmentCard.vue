<template>
	<UCard>
		<template #header>
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">Risk Assessment Matrix</h3>
				<UBadge
					:color="risks.overall === 'HIGH' ? 'red' : risks.overall === 'MODERATE' ? 'orange' : 'green'"
					variant="solid"
					size="lg"
				>
					{{ risks.overall }} RISK
				</UBadge>
			</div>
		</template>

		<div class="space-y-4">
			<!-- Risk Factors -->
			<div class="space-y-3">
				<div
					v-for="factor in risks.factors"
					:key="factor.category"
					class="border rounded-lg p-4"
					:class="{
						'border-red-200 bg-red-50': factor.level === 'CRITICAL',
						'border-orange-200 bg-orange-50': factor.level === 'HIGH',
						'border-yellow-200 bg-yellow-50': factor.level === 'MODERATE',
						'border-green-200 bg-green-50': factor.level === 'LOW',
					}"
				>
					<div class="flex items-center justify-between mb-2">
						<h4 class="font-semibold text-gray-900">{{ factor.category }}</h4>
						<UBadge
							:color="
								factor.level === 'CRITICAL'
									? 'red'
									: factor.level === 'HIGH'
										? 'orange'
										: factor.level === 'MODERATE'
											? 'yellow'
											: 'green'
							"
							variant="subtle"
						>
							{{ factor.level }}
						</UBadge>
					</div>
					<p class="text-sm text-gray-700">{{ factor.impact }}</p>
				</div>
			</div>

			<!-- Risk Mitigation Strategy -->
			<div class="border-t pt-4">
				<h4 class="font-semibold text-gray-900 mb-3">Risk Mitigation Strategy</h4>
				<div class="space-y-2">
					<div class="flex items-start space-x-3">
						<UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-blue-600 mt-0.5" />
						<div>
							<p class="text-sm font-medium text-gray-900">Immediate Actions</p>
							<ul class="text-sm text-gray-600 mt-1 space-y-1">
								<li>• Emergency board meeting to address critical risks</li>
								<li>• Implement financial controls and dual approvals</li>
								<li>• Engage legal counsel for compliance review</li>
							</ul>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<UIcon name="i-heroicons-calendar" class="w-5 h-5 text-blue-600 mt-0.5" />
						<div>
							<p class="text-sm font-medium text-gray-900">30-Day Plan</p>
							<ul class="text-sm text-gray-600 mt-1 space-y-1">
								<li>• Special assessment vote and implementation</li>
								<li>• Update reserve study with current conditions</li>
								<li>• Establish monthly financial review process</li>
							</ul>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<UIcon name="i-heroicons-document-check" class="w-5 h-5 text-blue-600 mt-0.5" />
						<div>
							<p class="text-sm font-medium text-gray-900">Long-term Strategy</p>
							<ul class="text-sm text-gray-600 mt-1 space-y-1">
								<li>• Annual budget review and adjustment</li>
								<li>• Quarterly compliance audits</li>
								<li>• Board education on fiduciary responsibilities</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	</UCard>
</template>

<script setup>
defineProps({
	risks: {
		type: Object,
		required: true,
	},
});
</script>
