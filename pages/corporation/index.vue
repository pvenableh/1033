<template>
	<div class="corporation-page bg-cream min-h-screen">
		<!-- Hero Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-5xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 text-gold-dark">Official Records</p>
					<h1
						class="font-serif text-[clamp(2.5rem,6vw,4rem)] font-light tracking-tight leading-tight mb-6 text-gray-800">
						Corporation
					</h1>
					<div class="w-16 h-px bg-gold mx-auto mb-6"></div>
					<p class="font-serif text-lg italic text-gray-500 max-w-xl mx-auto">
						Governing documents and official corporate filings
					</p>
				</div>
			</div>
		</section>

		<!-- By-Laws Section -->
		<section v-if="byLaws && byLaws.document" class="py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-6xl mx-auto">
				<div class="section-header mb-10 opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-3 text-gold-dark">Governing Documents</p>
					<h2 class="font-serif text-3xl font-light text-gray-800">By-Laws</h2>
					<div class="w-12 h-px bg-gold mt-4"></div>
				</div>

				<div class="flex flex-col lg:flex-row gap-8 lg:gap-16">
					<!-- Navigation Sidebar -->
					<div class="docs-nav lg:w-48 flex-shrink-0 opacity-0">
						<div class="lg:sticky lg:top-8">
							<div class="flex flex-col gap-2 mb-4">
								<span class="font-serif text-sm text-gold">Contents</span>
								<span class="text-xs tracking-wider uppercase text-gray-500">Sections</span>
							</div>
							<nav class="flex flex-row flex-wrap lg:flex-col gap-2 lg:gap-0 border-t border-divider pt-4">
								<a
									v-for="(section, index) in byLawsSections"
									:key="index"
									:href="'#' + section.id"
									class="nav-link flex items-center gap-2 py-2 text-gray-500 hover:text-gold-dark transition-colors duration-300"
									@click="trackSectionClick(section.id, section.label)">
									<span class="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0 opacity-50"></span>
									<span class="text-xs tracking-[0.1em] uppercase">{{ section.label }}</span>
								</a>
							</nav>
						</div>
					</div>

					<!-- Document Content -->
					<div class="flex-1 docs-content opacity-0">
						<div class="bg-white border border-divider p-6 lg:p-10">
							<div
								v-html="byLaws.document"
								class="by-laws-content prose prose-gray max-w-none"></div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Corporate Documents Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-4xl mx-auto">
				<div class="section-header mb-10 opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-3 text-gold-dark">Corporate Filings</p>
					<h2 class="font-serif text-3xl font-light text-gray-800">Corporate Documents</h2>
					<div class="w-12 h-px bg-gold mt-4"></div>
				</div>

				<div v-if="corporationFiles && corporationFiles.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<a
						v-for="(file, index) in corporationFiles"
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
					<p class="font-serif text-xl text-gray-600 mb-2">No Corporate Documents Available</p>
					<p class="text-sm text-gray-500">Check back later for updates</p>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup>
import {onMounted, onUnmounted} from 'vue';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Analytics
const analytics = useAnalytics();

definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

useSeoMeta({
	title: 'Corporation - 1033 Lenox',
});

// Track document section navigation
const trackSectionClick = (sectionId, sectionLabel) => {
	analytics.trackEvent('document_section_click', {
		section_id: sectionId,
		section_label: sectionLabel,
		document_type: 'by_laws',
	});
};

const byLawsSections = [
	{id: 'one', label: 'Identity'},
	{id: 'two', label: 'Members'},
	{id: 'three', label: "Members' Meeting"},
	{id: 'four', label: 'Directors'},
	{id: 'five', label: 'Officers'},
	{id: 'six', label: 'Fiscal Management'},
	{id: 'seven', label: 'Parliamentary Rules'},
	{id: 'eight', label: 'Developer'},
	{id: 'nine', label: 'Amendment'},
];

// Fetch by-laws
const byLawsCollection = useDirectusItems('by_laws');
const byLawsData = await byLawsCollection.list({
	fields: ['*'],
});
const byLaws = byLawsData?.[0] || null;

// Fetch corporation files
const corporationCollection = useDirectusItems('corporation');
const corporationData = await corporationCollection.list({
	fields: ['*.*.*'],
});
const corporationFiles = computed(() => {
	if (corporationData && corporationData.length > 0 && corporationData[0].files) {
		return corporationData[0].files.filter((f) => f.directus_files_id);
	}
	return [];
});

function getSubstringAfterSlash(str) {
	if (!str) return '';
	const parts = str.split('/');
	return parts.slice(1).join('/');
}

let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		gsap.fromTo('.page-header', {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2});

		gsap.fromTo('.section-header', {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.3, stagger: 0.2});
		gsap.fromTo('.docs-nav', {opacity: 0, x: -20}, {opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.4});
		gsap.fromTo('.docs-content', {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.5});

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
@reference "~/assets/css/tailwind.css";

.corporation-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

:deep(.by-laws-content) {
	h2,
	h3,
	h4 {
		@apply font-serif font-normal text-gray-800 mt-8 mb-4 first:mt-0;
	}
	h2 {
		@apply text-2xl border-b border-divider pb-3;
	}
	h3 {
		@apply text-xl;
	}
	p {
		@apply text-gray-600 leading-relaxed mb-4;
	}
	ul,
	ol {
		@apply text-gray-600 mb-4 pl-6;
	}
	li {
		@apply mb-2;
	}
}
</style>
