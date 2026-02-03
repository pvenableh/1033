<template>
	<section ref="listingsRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg">
		<div class="max-w-6xl mx-auto">
			<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
				<div class="content-label flex flex-col gap-2 opacity-0">
					<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">10</span>
					<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Availability</span>
				</div>
				<div class="content-main max-w-4xl">
					<h2
						class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
						Available Units
					</h2>
					<p class="section-body text-[1.0625rem] leading-relaxed t-text-secondary mb-12 opacity-0">
						View current listings at 1033 Lenox. Updated in real-time from major listing platforms.
					</p>

					<div class="listings-grid grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">
						<a
							v-for="(listing, index) in listings"
							:key="index"
							:href="listing.url"
							target="_blank"
							rel="noopener noreferrer"
							class="listing-card group opacity-0">
							<div
								class="aspect-[4/3] t-bg-elevated border t-border-divider flex flex-col items-center justify-center p-6 transition-all duration-300 group-hover:t-bg-elevated group-hover:border-gold/30 group-hover:shadow-lg">
								<div
									class="w-12 h-12 mb-4 border t-border-divider rounded-full flex items-center justify-center transition-all duration-300 group-hover:t-border-accent group-hover:scale-110">
									<UIcon
										:name="listing.icon"
										class="w-5 h-5 t-text-muted group-hover:t-text-accent-tertiary transition-colors duration-300" />
								</div>
								<p class="text-sm font-medium t-text mb-1">{{ listing.name }}</p>
								<p class="text-xs t-text-muted mb-4">{{ listing.tagline }}</p>
								<span
									class="text-[0.6875rem] tracking-[0.15em] uppercase t-text-accent-tertiary opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
									View Listings →
								</span>
							</div>
						</a>
					</div>

					<p class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 border-t t-border-divider opacity-0">
						Your next chapter starts here.
					</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const listingsRef = ref(null);

const listings = [
	{
		name: 'Zillow',
		tagline: 'Zestimates & details',
		url: 'https://www.zillow.com/b/lenox-plaza-condominium-miami-beach-fl-5XmvqP/',
		icon: 'i-heroicons-home-modern',
	},
	{
		name: 'Redfin',
		tagline: 'Market insights',
		url: 'https://www.redfin.com/FL/Miami-Beach/1033-Lenox-Ave-Miami-Beach-FL-33139/building/50543',
		icon: 'i-heroicons-chart-bar',
	},
	{
		name: 'Trulia',
		tagline: 'Neighborhood data',
		url: 'https://www.trulia.com/home/1033-lenox-ave-miami-beach-fl-33139-2099072457',
		icon: 'i-heroicons-map-pin',
	},
];

let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		if (!listingsRef.value) return;

		const selectors = ['.content-label', '.section-title', '.section-body', '.listing-card', '.section-tagline'];

		selectors.forEach((selector) => {
			const elements = listingsRef.value.querySelectorAll(selector);
			elements.forEach((el, elIndex) => {
				gsap.fromTo(
					el,
					{opacity: 0, y: 20},
					{
						opacity: 1,
						y: 0,
						duration: 0.5,
						ease: 'power2.out',
						scrollTrigger: {
							trigger: el,
							start: 'top 90%',
							toggleActions: 'play none none none',
						},
						delay: elIndex * 0.03,
					}
				);
			});
		});
	});
});

onUnmounted(() => {
	if (ctx) ctx.revert();
});
</script>
