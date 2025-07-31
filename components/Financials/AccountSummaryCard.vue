<template>
	<UCard class="relative overflow-hidden">
		<!-- Status Indicator Bar -->
		<div
			class="absolute top-0 left-0 right-0 h-1"
			:class="{
				'bg-red-500': account.status === 'critical',
				'bg-yellow-500': account.status === 'warning',
				'bg-green-500': account.status === 'stable',
			}"
		/>

		<div class="pt-2">
			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center space-x-3">
					<UIcon
						:name="account.icon"
						class="w-8 h-8"
						:class="{
							'text-red-600': account.status === 'critical',
							'text-yellow-600': account.status === 'warning',
							'text-green-600': account.status === 'stable',
						}"
					/>
					<div>
						<h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wider">
							{{ account.name }}
						</h3>
						<p class="text-xs text-gray-500">{{ account.number }}</p>
					</div>
				</div>
			</div>

			<!-- Balance -->
			<div class="mb-4">
				<p class="text-3xl font-bold text-gray-900">
					${{ account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
				</p>
			</div>

			<!-- Change Indicator -->
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center space-x-2">
					<UIcon
						:name="account.change >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
						class="w-4 h-4"
						:class="account.change >= 0 ? 'text-green-600' : 'text-red-600'"
					/>
					<span class="text-sm font-medium" :class="account.change >= 0 ? 'text-green-600' : 'text-red-600'">
						{{ account.change >= 0 ? '+' : '' }}${{
							Math.abs(account.change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
						}}
					</span>
					<span class="text-xs" :class="account.change >= 0 ? 'text-green-600' : 'text-red-600'">
						({{ account.changePercent >= 0 ? '+' : '' }}{{ account.changePercent.toFixed(1) }}%)
					</span>
				</div>
			</div>

			<!-- Minimum Balance Warning -->
			<div v-if="account.balance < account.minBalance" class="mt-4 pt-4 border-t border-gray-200">
				<div class="flex items-center space-x-2">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-600" />
					<span class="text-sm text-red-600 font-medium">
						Below minimum balance of ${{ account.minBalance.toLocaleString() }}
					</span>
				</div>
			</div>

			<!-- Status Badge -->
			<div class="mt-4">
				<UBadge :color="statusColor" variant="subtle" size="sm" class="uppercase tracking-wider">
					{{ account.status }}
				</UBadge>
			</div>
		</div>
	</UCard>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	account: {
		type: Object,
		required: true,
	},
});

const statusColor = computed(() => {
	switch (props.account.status) {
		case 'critical':
			return 'red';
		case 'warning':
			return 'yellow';
		case 'stable':
			return 'green';
		default:
			return 'gray';
	}
});
</script>
