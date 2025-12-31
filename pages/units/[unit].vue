<template>
	<div class="unit-page bg-cream min-h-screen">
		<!-- Hero Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-4xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 text-gold-dark">Resident Information</p>
					<h1 class="font-serif text-[clamp(2.5rem,6vw,4rem)] font-light tracking-tight leading-tight mb-6 text-gray-800">
						Unit {{ params.unit }}
					</h1>
					<div class="w-16 h-px bg-gold mx-auto"></div>
				</div>
			</div>
		</section>

		<!-- Unit Content Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-4xl mx-auto">
				<!-- Loading State -->
				<div v-if="pending" class="text-center py-16 unit-content opacity-0">
					<div class="w-12 h-12 mx-auto mb-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
					<p class="font-serif text-lg text-gray-500">Loading unit information...</p>
				</div>

				<!-- Error State -->
				<div v-else-if="error" class="text-center py-16 unit-content opacity-0">
					<div class="w-16 h-16 mx-auto mb-6 border-2 border-divider rounded-full flex items-center justify-center">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-gray-400" />
					</div>
					<p class="font-serif text-xl text-gray-600 mb-2">Unable to Load Unit</p>
					<p class="text-sm text-gray-500">Please try again later</p>
				</div>

				<!-- Unit Details -->
				<div v-else-if="unitData" class="unit-content opacity-0">
					<div class="bg-white border border-divider p-8 lg:p-12">
						<div class="text-center mb-10">
							<div class="w-20 h-20 mx-auto mb-6 rounded-full bg-cream-alt border-2 border-gold flex items-center justify-center">
								<span class="font-serif text-2xl text-gold-dark">{{ unitData.number }}</span>
							</div>
							<h2 class="font-serif text-2xl text-gray-800 mb-2">Unit {{ unitData.number }}</h2>
							<p class="text-sm text-gray-500">1033 Lenox Avenue</p>
						</div>

						<!-- Residents -->
						<div v-if="unitData.people && unitData.people.length" class="border-t border-divider pt-8">
							<h3 class="text-xs tracking-[0.2em] uppercase text-gold-dark mb-6 text-center">Residents</h3>
							<div class="space-y-6">
								<div
									v-for="(person, index) in unitData.people"
									:key="index"
									class="flex items-center gap-4 p-4 bg-cream-alt border border-divider">
									<div class="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
										<UIcon name="i-heroicons-user" class="w-6 h-6 text-gold-dark" />
									</div>
									<div class="flex-1">
										<p class="font-serif text-lg text-gray-800">
											{{ person.people_id.first_name }} {{ person.people_id.last_name }}
										</p>
										<p v-if="person.people_id.email" class="text-sm text-gray-500">{{ person.people_id.email }}</p>
										<p v-if="person.people_id.phone" class="text-sm text-gray-500">{{ person.people_id.phone }}</p>
									</div>
								</div>
							</div>
						</div>

						<!-- No Residents -->
						<div v-else class="border-t border-divider pt-8 text-center">
							<p class="text-gray-500 italic">No resident information available</p>
						</div>
					</div>

					<!-- Back Link -->
					<div class="mt-8 text-center">
						<NuxtLink
							to="/"
							class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gold-dark transition-colors duration-300">
							<UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
							<span class="tracking-wide uppercase">Back to Home</span>
						</NuxtLink>
					</div>
				</div>

				<!-- Not Found State -->
				<div v-else class="text-center py-16 unit-content opacity-0">
					<div class="w-16 h-16 mx-auto mb-6 border-2 border-divider rounded-full flex items-center justify-center">
						<UIcon name="i-heroicons-home" class="w-8 h-8 text-gray-400" />
					</div>
					<p class="font-serif text-xl text-gray-600 mb-2">Unit Not Found</p>
					<p class="text-sm text-gray-500">The requested unit could not be found</p>
				</div>
			</div>
		</section>

		<!-- Footer Section -->
		<section class="py-12 px-6 lg:px-16 bg-cream-alt border-t border-divider">
			<div class="max-w-4xl mx-auto text-center">
				<p class="font-serif text-sm italic text-gray-500">
					1033 Lenox Avenue · Miami Beach, FL 33139
				</p>
			</div>
		</section>
	</div>
</template>

<script setup>
import {onMounted, onUnmounted} from 'vue';
import {gsap} from 'gsap';

const {params} = useRoute();

definePageMeta({
	layout: 'auth',
	middleware: ['auth'],
});

const {
	data: page,
	pending,
	error,
} = await useAsyncData('page', () => {
	return useDirectus(
		readItems('units', {
			filter: {
				number: {
					_eq: params.unit,
				},
			},
			fields: ['*, people.people_id.*'],
		})
	);
});

const unitData = computed(() => {
	if (page.value && page.value.length > 0) {
		return page.value[0];
	}
	return null;
});

let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		gsap.fromTo(
			'.page-header',
			{opacity: 0, y: 30},
			{opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2}
		);
		gsap.fromTo(
			'.unit-content',
			{opacity: 0, y: 20},
			{opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.4}
		);
	});
});

onUnmounted(() => {
	if (ctx) ctx.revert();
});
</script>

<style scoped>
.unit-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}
</style>
