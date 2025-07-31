<template>
	<UCard class="border-red-200 bg-red-50">
		<template #header>
			<div class="flex items-center">
				<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mr-2 text-red-600" />
				<h3 class="text-lg font-bold text-red-900">Fund Segregation Violations - {{ account }} Account</h3>
			</div>
		</template>

		<div class="space-y-4">
			<!-- Violation Summary -->
			<div class="bg-white rounded-lg p-4">
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<p class="text-2xl font-bold text-red-600">{{ violations.length }}</p>
						<p class="text-sm text-gray-600">Total Violations</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-red-600">${{ totalAmount.toLocaleString() }}</p>
						<p class="text-sm text-gray-600">Total Amount</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-orange-600">HIGH</p>
						<p class="text-sm text-gray-600">Risk Level</p>
					</div>
				</div>
			</div>

			<!-- Violation Details -->
			<div class="space-y-2">
				<h4 class="font-semibold text-red-900">Violation Details:</h4>
				<div
					v-for="(violation, index) in violations"
					:key="index"
					class="bg-white border border-red-200 rounded-lg p-3"
				>
					<div class="flex justify-between items-start">
						<div>
							<p class="text-sm font-medium text-red-900">{{ violation.description }}</p>
							<p class="text-xs text-red-700 mt-1">
								{{ violation.date }} •
								<span class="font-medium">From: {{ violation.fromAccount }} → To: {{ violation.toAccount }}</span>
							</p>
						</div>
						<span class="text-sm font-bold text-red-600">${{ violation.amount.toLocaleString() }}</span>
					</div>
				</div>
			</div>

			<!-- Legal Warning -->
			<UAlert color="red" icon="i-heroicons-shield-exclamation" title="Legal Compliance Warning">
				<template #description>
					<p class="text-sm">
						These transfers violate fund segregation requirements. Special assessment funds must be used exclusively for
						the 40-year recertification project. Board members may face personal liability for improper fund usage.
					</p>
				</template>
			</UAlert>

			<!-- Required Actions -->
			<div class="bg-orange-50 rounded-lg p-4">
				<h4 class="font-semibold text-orange-900 mb-2">Required Corrective Actions:</h4>
				<ol class="text-sm text-orange-800 space-y-1 list-decimal list-inside">
					<li>Immediately cease all transfers between accounts</li>
					<li>Document all violations for board review</li>
					<li>Consult with HOA attorney on remediation</li>
					<li>Implement dual approval for all future transfers</li>
					<li>Consider reversing improper transfers if possible</li>
				</ol>
			</div>
		</div>
	</UCard>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	violations: {
		type: Array,
		required: true,
	},
	account: {
		type: String,
		required: true,
	},
});

const totalAmount = computed(() => {
	return props.violations.reduce((sum, violation) => sum + violation.amount, 0);
});
</script>
