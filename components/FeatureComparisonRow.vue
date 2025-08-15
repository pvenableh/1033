<template>
	<div class="flex items-center justify-between py-3 border-b">
		<span class="font-medium text-gray-700">{{ feature }}</span>
		<div class="flex gap-8">
			<div class="flex items-center gap-2 w-48">
				<CheckCircle v-if="unifiHas" class="w-5 h-5 text-green-500" />
				<XCircle v-else class="w-5 h-5 text-red-500" />
				<span class="text-sm">{{ unifiValue }}</span>
			</div>
			<div class="flex items-center gap-2 w-48">
				<CheckCircle v-if="swiftlaneHas" class="w-5 h-5 text-green-500" />
				<XCircle v-else class="w-5 h-5 text-red-500" />
				<span class="text-sm">{{ swiftlaneValue }}</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { CheckCircle, XCircle } from 'lucide-vue-next';

defineProps({
	feature: String,
	unifiValue: String,
	swiftlaneValue: String,
	unifiHas: Boolean,
	swiftlaneHas: Boolean,
});
</script>
