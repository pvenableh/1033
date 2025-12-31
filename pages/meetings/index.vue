<template>
	<div class="meetings-page bg-cream min-h-screen">
		<!-- Hero Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-4xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 text-gold-dark">Association Records</p>
					<h1 class="font-serif text-[clamp(2.5rem,6vw,4rem)] font-light tracking-tight leading-tight mb-6 text-gray-800">
						Board Meetings
					</h1>
					<div class="w-16 h-px bg-gold mx-auto mb-6"></div>
					<p class="font-serif text-lg italic text-gray-500 max-w-xl mx-auto">
						Meeting minutes, agendas, and official board proceedings
					</p>
				</div>
			</div>
		</section>

		<!-- Meetings List Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-4xl mx-auto">
				<!-- Loading State -->
				<div v-if="pending" class="text-center py-16">
					<div class="w-12 h-12 mx-auto mb-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
					<p class="font-serif text-lg text-gray-500">Loading meetings...</p>
				</div>

				<!-- Error State -->
				<div v-else-if="error" class="text-center py-16">
					<div class="w-16 h-16 mx-auto mb-6 border-2 border-divider rounded-full flex items-center justify-center">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-gray-400" />
					</div>
					<p class="font-serif text-xl text-gray-600 mb-2">Unable to Load Meetings</p>
					<p class="text-sm text-gray-500">Please try again later</p>
				</div>

				<!-- Meetings List -->
				<div v-else-if="pastMeetings && pastMeetings.length" class="space-y-6">
					<div
						v-for="(item, index) in pastMeetings"
						:key="index"
						class="meeting-card opacity-0">
						<MeetingsCard :meeting="item" />
					</div>
				</div>

				<!-- Empty State -->
				<div v-else class="text-center py-16">
					<div class="w-16 h-16 mx-auto mb-6 border-2 border-divider rounded-full flex items-center justify-center">
						<UIcon name="i-heroicons-calendar" class="w-8 h-8 text-gray-400" />
					</div>
					<p class="font-serif text-xl text-gray-600 mb-2">No Meetings Found</p>
					<p class="text-sm text-gray-500">Check back later for updates</p>
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
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

definePageMeta({
	layout: 'auth',
	middleware: ['auth'],
});

const meetingsCollection = useDirectusItems('meetings');
const pending = ref(false);
const error = ref(null);

const meetings = await meetingsCollection.list({
	fields: [
		'id,status,title,category,description,date,time,files.directus_files_id.id,files.directus_files_id.tags,files.directus_files_id.description,files.directus_files_id.title,url,presentations.*,people.people_id.unit.units_id.number,people.people_id.board_member.status,people.people_id.first_name,people.people_id.last_name,people.people_id.email,people.people_id.board_member.title,people.people_id.board_member.start,people.people_id.board_member.finish,people.people_id.board_member.person',
	],
	sort: '-date',
});

const pastMeetings = computed(() => {
	if (meetings) {
		return meetings.filter((meeting) => {
			return new Date(meeting.date) < new Date();
		});
	} else {
		return [];
	}
});

const futureMeetings = computed(() => {
	if (meetings) {
		return meetings.filter((meeting) => {
			return new Date(meeting.date) >= new Date();
		});
	} else {
		return [];
	}
});

let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		gsap.fromTo(
			'.page-header',
			{opacity: 0, y: 30},
			{opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2}
		);

		const cards = document.querySelectorAll('.meeting-card');
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
.meetings-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}
</style>
