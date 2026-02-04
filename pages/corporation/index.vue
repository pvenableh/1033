<template>
	<div class="corporation-page bg-cream min-h-screen">
		<!-- Hero Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-4xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 text-gold-dark">Official Records</p>
					<h1
						class="font-serif text-[clamp(2.5rem,6vw,4rem)] font-light tracking-tight leading-tight mb-6 text-gray-800">
						Corporate Documents
					</h1>
					<div class="w-16 h-px bg-gold mx-auto mb-6"></div>
					<p class="font-serif text-lg italic text-gray-500 max-w-xl mx-auto">
						Access official corporate filings and governing documents
					</p>
				</div>
			</div>
		</section>

		<!-- Documents List Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-4xl mx-auto">
				<div v-if="page && page.files" class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<a
						v-for="(file, index) in page.files"
						:key="index"
						:href="'https://admin.1033lenox.com/assets/' + file.directus_files_id.id"
						target="_blank"
						class="document-card group block bg-white p-6 lg:p-8 border border-divider hover:border-gold transition-all duration-300 opacity-0">
						<div class="flex items-start gap-4">
							<div
								class="flex-shrink-0 w-12 h-12 rounded-full border border-divider group-hover:border-gold group-hover:bg-gold flex items-center justify-center transition-all duration-300">
								<UIcon
									name="i-heroicons-document-arrow-down"
									class="w-6 h-6 text-gray-400 group-hover:text-white transition-colors duration-300" />
							</div>
							<div class="flex-1">
								<h3
									class="font-serif text-lg font-normal text-gray-800 leading-snug mb-2 group-hover:text-gold-dark transition-colors duration-300">
									{{ file.directus_files_id.title }}
								</h3>
								<p class="text-xs tracking-[0.15em] uppercase text-gold-dark">
									{{ getSubstringAfterSlash(file.directus_files_id.type) }}
								</p>
							</div>
						</div>
					</a>
				</div>

				<!-- Empty State -->
				<div v-else class="text-center py-16">
					<div class="w-16 h-16 mx-auto mb-6 border-2 border-divider rounded-full flex items-center justify-center">
						<UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400" />
					</div>
					<p class="font-serif text-xl text-gray-600 mb-2">No Documents Available</p>
					<p class="text-sm text-gray-500">Check back later for updates</p>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup>
useSeoMeta({
	title: 'Corporate Documents - 1033 Lenox',
});

import {onMounted, onUnmounted} from 'vue';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const page = await readItems('corporation', {
	fields: ['*.*.*'],
});

function getSubstringAfterSlash(str) {
	const parts = str.split('/');
	return parts.slice(1).join('/');
}

let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		gsap.fromTo('.page-header', {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2});

		const cards = document.querySelectorAll('.document-card');
		cards.forEach((card, index) => {
			gsap.fromTo(
				card,
				{opacity: 0, y: 20},
				{
					opacity: 1,
					y: 0,
					duration: 0.6,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: card,
						start: 'top 90%',
						toggleActions: 'play none none none',
					},
					delay: index * 0.08,
				}
			);
		});
	});
});

onUnmounted(() => {
	if (ctx) ctx.revert();
});
</script>

<style scoped>
.corporation-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}
</style>
