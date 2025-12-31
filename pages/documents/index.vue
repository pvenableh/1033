<template>
	<div class="documents-page bg-cream min-h-screen">
		<!-- Hero Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-5xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 text-gold-dark">Governing Documents</p>
					<h1 class="font-serif text-[clamp(2.5rem,6vw,4rem)] font-light tracking-tight leading-tight mb-6 text-gray-800">
						By-Laws
					</h1>
					<div class="w-16 h-px bg-gold mx-auto mb-6"></div>
					<p class="font-serif text-lg italic text-gray-500 max-w-xl mx-auto">
						The official governing rules of the Lenox Plaza Association
					</p>
				</div>
			</div>
		</section>

		<!-- Content Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-6xl mx-auto">
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
									v-for="(section, index) in sections"
									:key="index"
									:href="'#' + section.id"
									class="nav-link flex items-center gap-2 py-2 text-gray-500 hover:text-gold-dark transition-colors duration-300">
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
								v-if="page.document"
								v-html="page.document"
								class="by-laws-content prose prose-gray max-w-none"></div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Footer Section -->
		<section class="py-12 px-6 lg:px-16 bg-cream-alt border-t border-divider">
			<div class="max-w-5xl mx-auto text-center">
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

definePageMeta({
	layout: 'auth',
	middleware: ['auth'],
});

const sections = [
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

const byLawsCollection = useDirectusItems('by_laws');

const page = await byLawsCollection.list({
	fields: ['*'],
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
			'.docs-nav',
			{opacity: 0, x: -20},
			{opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.4}
		);
		gsap.fromTo(
			'.docs-content',
			{opacity: 0, y: 20},
			{opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.5}
		);
	});
});

onUnmounted(() => {
	if (ctx) ctx.revert();
});
</script>

<style scoped>
.documents-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

:deep(.by-laws-content) {
	h2, h3, h4 {
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
	ul, ol {
		@apply text-gray-600 mb-4 pl-6;
	}
	li {
		@apply mb-2;
	}
}
</style>
