<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

const announcementsCollection = useDirectusItems('announcements');

const announcements = await announcementsCollection.list({
	fields: ['*'],
	filter: {
		status: {
			_eq: 'sent',
		},
		date_sent: {
			_nnull: true,
		},
		private: {
			_eq: false,
		},
	},
	sort: '-date_sent',
});

const filteredAnnouncements = computed(() => {
	let possibleStrings = ['Minutes', 'Agenda', 'Board Meeting'];

	return announcements
		.map((item) => {
			if (item.tags) {
				if (!possibleStrings.some((possibleString) => item.tags.includes(possibleString))) {
					return item;
				}

				return null;
			} else {
				return item;
			}
		})
		.filter(Boolean);
});

const sectionRef = ref(null);
let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		// Header animation
		gsap.fromTo(
			'.page-header',
			{opacity: 0, y: 30},
			{
				opacity: 1,
				y: 0,
				duration: 0.8,
				ease: 'power3.out',
				delay: 0.2,
			}
		);

		// Animate announcement cards
		const cards = document.querySelectorAll('.announcement-card');
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

<template>
	<div class="announcements-page t-bg min-h-screen">
		<!-- Hero Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 t-section-alt">
			<div class="max-w-4xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 t-text-accent-tertiary">Official Communications</p>
					<h1 class="t-heading text-[clamp(2.5rem,6vw,4rem)] font-light tracking-tight leading-tight mb-6 t-text">
						Announcements
					</h1>
					<div class="w-16 h-px t-bg-accent mx-auto mb-6"></div>
					<p class="t-heading text-lg italic t-text-tertiary max-w-xl mx-auto">
						Stay informed with the latest updates from the Lenox Plaza Association
					</p>
				</div>
			</div>
		</section>

		<!-- Announcements List Section -->
		<section ref="sectionRef" class="py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-4xl mx-auto">
				<div v-if="filteredAnnouncements && filteredAnnouncements.length" class="space-y-6">
					<a
						v-for="(item, index) in filteredAnnouncements"
						:key="index"
						class="announcement-card group block t-bg-elevated p-6 lg:p-8 border t-border-divider hover:border-gold transition-all duration-300 opacity-0"
						:href="'https://1033lenox.com/announcements/email/' + item.url"
						target="_blank">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-3">
									<span class="w-1.5 h-1.5 t-bg-accent rounded-full flex-shrink-0"></span>
									<span class="text-xs tracking-[0.15em] uppercase t-text-accent-tertiary">
										{{ getFriendlyDate(item.date_sent) }}
									</span>
								</div>
								<h3 class="t-heading text-xl lg:text-2xl font-normal t-text leading-snug mb-2 group-hover:t-text-accent-tertiary transition-colors duration-300">
									{{ item.title }}
								</h3>
								<p v-if="item.subtitle" class="text-[0.9375rem] t-text-tertiary leading-relaxed">
									{{ item.subtitle }}
								</p>
							</div>
							<div class="flex-shrink-0 w-10 h-10 rounded-full border t-border-divider group-hover:border-gold group-hover:t-bg-accent flex items-center justify-center transition-all duration-300">
								<UIcon name="i-heroicons-arrow-right" class="w-5 h-5 t-text-muted group-hover:text-white transition-colors duration-300" />
							</div>
						</div>
					</a>
				</div>

				<!-- Empty State -->
				<div v-else class="text-center py-16">
					<div class="w-16 h-16 mx-auto mb-6 border-2 t-border-divider rounded-full flex items-center justify-center">
						<UIcon name="i-heroicons-megaphone" class="w-8 h-8 t-text-muted" />
					</div>
					<p class="t-heading text-xl t-text-secondary mb-2">No Announcements</p>
					<p class="text-sm t-text-tertiary">Check back later for updates</p>
				</div>
			</div>
		</section>

		<!-- Footer Section -->
		<section class="py-12 px-6 lg:px-16 t-section-alt border-t t-border-divider">
			<div class="max-w-4xl mx-auto text-center">
				<p class="t-heading text-sm italic t-text-tertiary">
					1033 Lenox Avenue · Miami Beach, FL 33139
				</p>
			</div>
		</section>
	</div>
</template>

<style scoped>
.announcements-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}
</style>
