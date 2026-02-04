<template>
	<div class="rules-page bg-cream min-h-screen">
		<!-- Hero Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-5xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 text-gold-dark">Community Guidelines</p>
					<h1
						class="font-serif text-[clamp(2.5rem,6vw,4rem)] font-light tracking-tight leading-tight mb-6 text-gray-800">
						Rules & Regulations
					</h1>
					<div class="w-16 h-px bg-gold mx-auto mb-6"></div>
					<p class="font-serif text-lg italic text-gray-500 max-w-xl mx-auto">
						Standards and policies for harmonious community living
					</p>
				</div>
			</div>
		</section>

		<!-- Content Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-6xl mx-auto">
				<div class="flex flex-col lg:flex-row gap-8 lg:gap-16">
					<!-- Navigation Sidebar -->
					<div class="rules-nav lg:w-56 flex-shrink-0 opacity-0">
						<div class="lg:sticky lg:top-8">
							<div class="flex flex-col gap-2 mb-4">
								<span class="font-serif text-sm text-gold">Contents</span>
								<span class="text-xs tracking-wider uppercase text-gray-500">Sections</span>
							</div>
							<nav class="flex flex-row flex-wrap lg:flex-col gap-2 lg:gap-0 border-t border-divider pt-4">
								<a
									v-for="(rule, index) in page"
									:key="index"
									:href="'#' + rule.url"
									class="nav-link flex items-center gap-2 py-2 text-gray-500 hover:text-gold-dark transition-colors duration-300">
									<span class="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0 opacity-50"></span>
									<span class="text-xs tracking-[0.1em] uppercase">{{ rule.title }}</span>
								</a>
							</nav>
						</div>
					</div>

					<!-- Rules Content -->
					<div class="flex-1 rules-content opacity-0">
						<div class="space-y-12">
							<div
								v-for="(rule, index) in page"
								:key="index"
								class="rule-section bg-white border border-divider p-6 lg:p-10">
								<h3
									:id="rule.url"
									class="font-serif text-2xl font-normal text-gray-800 mb-6 pb-4 border-b border-divider">
									{{ rule.title }}
								</h3>
								<div v-html="rule.description" class="rule-content prose prose-gray max-w-none"></div>
							</div>
						</div>
					</div>
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

definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

useSeoMeta({
	title: 'Rules & Regulations - 1033 Lenox',
});

const rulesCollection = useDirectusItems('rules');

const page = await rulesCollection.list({
	fields: ['*'],
});

let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		gsap.fromTo('.page-header', {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2});
		gsap.fromTo('.rules-nav', {opacity: 0, x: -20}, {opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.4});
		gsap.fromTo(
			'.rules-content',
			{opacity: 0, y: 20},
			{opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.5}
		);

		const sections = document.querySelectorAll('.rule-section');
		sections.forEach((section, index) => {
			gsap.fromTo(
				section,
				{opacity: 0.5, y: 10},
				{
					opacity: 1,
					y: 0,
					duration: 0.4,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: section,
						start: 'top 85%',
						toggleActions: 'play none none none',
					},
					delay: index * 0.05,
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
.rules-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

:deep(.rule-content) {
	h4,
	h5 {
		@apply font-serif font-normal text-gray-800 mt-6 mb-3;
	}
	h4 {
		@apply text-lg;
	}
	h5 {
		@apply text-base;
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
	strong {
		@apply text-gray-800;
	}
}
</style>
