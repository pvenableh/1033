<template>
	<div class="max-w-7xl mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="bg-card rounded-lg shadow-sm border p-6">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
				Vendor Management
			</h1>
			<p class="text-gray-600 dark:text-gray-400">
				Find and consolidate duplicate vendor names across transactions using matching keywords.
			</p>
		</div>

		<!-- Controls -->
		<div class="bg-card rounded-lg shadow-sm border p-6">
			<div class="flex flex-wrap items-center gap-4">
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 uppercase">Fiscal Year:</label>
					<select
						v-model="selectedYear"
						class="border rounded-lg px-3 py-2 text-sm">
						<option :value="null">All Years</option>
						<option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
					</select>
				</div>
				<button
					@click="runAnalysis"
					:disabled="analyzing"
					class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
					<Icon :name="analyzing ? 'i-heroicons-arrow-path' : 'i-heroicons-magnifying-glass'" :class="{'animate-spin': analyzing}" class="w-4 h-4" />
					{{ analyzing ? 'Analyzing...' : 'Find Duplicates' }}
				</button>
				<div v-if="analysisResult" class="text-sm text-gray-500">
					{{ analysisResult.total_unique_vendor_names }} unique names &middot;
					{{ analysisResult.total_vendor_records }} vendor records &middot;
					{{ analysisResult.groups_found }} groups with variants
				</div>
			</div>
		</div>

		<!-- Results -->
		<div v-if="analysisResult && analysisResult.groups.length > 0" class="space-y-4">
			<div
				v-for="(group, idx) in analysisResult.groups"
				:key="idx"
				class="bg-card rounded-lg shadow-sm border overflow-hidden">
				<!-- Group Header -->
				<div class="px-6 py-4 border-b bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Icon name="i-heroicons-building-office" class="w-5 h-5 text-gray-400" />
						<div>
							<h3 class="font-semibold text-lg">{{ group.canonical }}</h3>
							<div class="text-xs text-gray-500">
								<span v-if="group.vendor_id" class="text-green-600">Vendor #{{ group.vendor_id }}</span>
								<span v-else class="text-amber-600">No vendor record linked</span>
								&middot;
								{{ group.variants.reduce((s, v) => s + v.count, 0) }} total transactions
							</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span v-if="group.existing_keywords.length > 0" class="text-xs text-gray-400">
							{{ group.existing_keywords.length }} existing keywords
						</span>
						<button
							v-if="group.vendor_id && group.variants.length > 1"
							@click="consolidateGroup(group)"
							:disabled="consolidating === idx"
							class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50">
							<Icon :name="consolidating === idx ? 'i-heroicons-arrow-path' : 'i-heroicons-check'" :class="{'animate-spin': consolidating === idx}" class="w-4 h-4" />
							{{ consolidating === idx ? 'Consolidating...' : 'Consolidate' }}
						</button>
						<span v-if="consolidated.has(idx)" class="text-green-600 text-sm font-medium flex items-center gap-1">
							<Icon name="i-heroicons-check-circle" class="w-4 h-4" />
							Done
						</span>
					</div>
				</div>

				<!-- Variant Names -->
				<div class="px-6 py-3">
					<div class="space-y-2">
						<div
							v-for="variant in group.variants"
							:key="variant.name"
							class="flex items-center justify-between py-2 px-3 rounded"
							:class="variant.name === group.canonical ? 'bg-green-50 dark:bg-green-950/20' : 'bg-gray-50 dark:bg-gray-800/30'">
							<div class="flex items-center gap-2">
								<Icon
									:name="variant.name === group.canonical ? 'i-heroicons-star-solid' : 'i-heroicons-arrow-right'"
									:class="variant.name === group.canonical ? 'w-4 h-4 text-green-500' : 'w-4 h-4 text-gray-400'" />
								<span class="font-mono text-sm" :class="variant.name === group.canonical ? 'font-semibold' : ''">
									{{ variant.name }}
								</span>
								<span v-if="variant.name === group.canonical" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">
									canonical
								</span>
							</div>
							<span class="text-sm text-gray-500">{{ variant.count }} txn{{ variant.count !== 1 ? 's' : '' }}</span>
						</div>
					</div>

					<!-- Existing Keywords -->
					<div v-if="group.existing_keywords.length > 0" class="mt-3 pt-3 border-t">
						<div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Existing Keywords</div>
						<div class="flex flex-wrap gap-1">
							<span
								v-for="kw in group.existing_keywords"
								:key="kw"
								class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
								{{ kw }}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else-if="analysisResult && analysisResult.groups.length === 0" class="text-center py-20">
			<Icon name="i-heroicons-check-circle" class="w-16 h-16 mx-auto text-green-300 mb-4" />
			<h3 class="text-xl font-semibold text-gray-500 uppercase tracking-wide mb-2">All Clean</h3>
			<p class="text-gray-400">No duplicate vendor names found. All vendor names are unique.</p>
		</div>

		<!-- Consolidation Results -->
		<div v-if="consolidationResults.length > 0" class="bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 p-6">
			<h3 class="font-semibold text-green-800 dark:text-green-200 uppercase tracking-wide mb-3">Consolidation Results</h3>
			<div class="space-y-2">
				<div v-for="(result, i) in consolidationResults" :key="i" class="text-sm text-green-700 dark:text-green-300">
					<strong>{{ result.canonical_name }}</strong>: {{ result.keywords_added }} keywords added, {{ result.transactions_updated }} transactions updated
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
definePageMeta({ layout: 'default' });

useSeoMeta({ title: 'Vendor Management' });

const currentYear = new Date().getFullYear();
const yearOptions = [];
for (let y = 2023; y <= currentYear + 1; y++) {
	yearOptions.push(y);
}

const selectedYear = ref(currentYear);
const analyzing = ref(false);
const analysisResult = ref(null);
const consolidating = ref(null);
const consolidated = ref(new Set());
const consolidationResults = ref([]);

const runAnalysis = async () => {
	analyzing.value = true;
	analysisResult.value = null;
	consolidated.value = new Set();
	consolidationResults.value = [];

	try {
		const result = await $fetch('/api/admin/vendor-consolidation', {
			method: 'POST',
			body: {
				action: 'analyze',
				fiscal_year: selectedYear.value || undefined,
			},
		});
		analysisResult.value = result;
	} catch (e) {
		console.error('Error analyzing vendors:', e);
	} finally {
		analyzing.value = false;
	}
};

const consolidateGroup = async (group) => {
	const idx = analysisResult.value.groups.indexOf(group);
	consolidating.value = idx;

	try {
		const alternateNames = group.variants.map((v) => v.name);

		const result = await $fetch('/api/admin/vendor-consolidation', {
			method: 'POST',
			body: {
				action: 'apply',
				vendor_id: group.vendor_id,
				canonical_name: group.canonical,
				alternate_names: alternateNames,
				fiscal_year: selectedYear.value || undefined,
			},
		});

		consolidated.value.add(idx);
		consolidationResults.value.push(result);
	} catch (e) {
		console.error('Error consolidating vendor:', e);
	} finally {
		consolidating.value = null;
	}
};
</script>
