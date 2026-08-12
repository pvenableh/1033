<template>
	<div class="presentation-viewer">
		<!-- Loading -->
		<div v-if="pending" class="pv-center">
			<div class="pv-spinner" />
		</div>

		<!-- Not found -->
		<div v-else-if="!presentation" class="pv-center pv-missing">
			<p class="text-lg font-medium">Presentation not found</p>
			<p class="text-sm opacity-60">This link may have expired or been moved.</p>
		</div>

		<!-- Deck -->
		<template v-else>
			<Transition name="pv-icon">
				<button
					v-if="!showInfo"
					type="button"
					class="pv-info-btn"
					aria-label="About this presentation"
					@click="showInfo = true">
					<Icon name="lucide:info" class="pv-info-icon" />
				</button>
			</Transition>

			<!-- Info slide-out -->
			<div v-if="showInfo" class="pv-info-backdrop" @click="showInfo = false" />
			<Transition name="pv-slide-in">
				<aside v-if="showInfo" class="pv-info-panel" role="dialog" aria-label="Presentation details">
					<button
						type="button"
						class="pv-info-close"
						aria-label="Close"
						@click="showInfo = false">
						<Icon name="lucide:x" />
					</button>
					<h2 class="pv-info-title">{{ presentation.title }}</h2>
					<p v-if="presentation.description" class="pv-info-desc">
						{{ presentation.description }}
					</p>
					<p v-else class="pv-info-desc pv-info-desc--muted">No description provided.</p>
				</aside>
			</Transition>

			<Swiper
				:modules="modules"
				:slides-per-view="1"
				:space-between="0"
				:keyboard="{enabled: true}"
				:lazy-preload-prev-next="1"
				:a11y="{enabled: true}"
				class="pv-swiper"
				@swiper="onSwiper"
				@slide-change="onSlideChange">
				<SwiperSlide v-for="(slide, i) in slides" :key="slide.id" class="pv-slide">
					<NuxtImg
						:src="slide.id"
						:alt="`${presentation.title} — slide ${i + 1}`"
						class="pv-img"
						provider="directus"
						format="webp"
						quality="80"
						fit="contain"
						width="1920"
						height="1080"
						densities="1x"
						sizes="640px sm:960px md:1280px lg:1600px xl:1920px"
						:loading="i === 0 ? 'eager' : 'lazy'"
						:preload="i === 0"
						draggable="false" />
				</SwiperSlide>
			</Swiper>

			<!-- Bottom controls: chevron · fraction · chevron -->
			<div class="pv-controls">
				<button
					type="button"
					class="pv-nav"
					:disabled="active === 0"
					aria-label="Previous slide"
					@click="goPrev">
					<Icon name="lucide:chevron-left" />
				</button>
				<span class="pv-fraction">{{ active + 1 }} / {{ slides.length }}</span>
				<button
					type="button"
					class="pv-nav"
					:disabled="active === slides.length - 1"
					aria-label="Next slide"
					@click="goNext">
					<Icon name="lucide:chevron-right" />
				</button>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import {Swiper, SwiperSlide} from 'swiper/vue';
import {Keyboard, A11y} from 'swiper/modules';
import type {Swiper as SwiperClass} from 'swiper/types';
import 'swiper/css';

// Public page — shared link, no auth middleware.
definePageMeta({layout: false});

const modules = [Keyboard, A11y];
const showInfo = ref(false);

interface SlideFile {
	id: string;
	width?: number;
	height?: number;
	title?: string;
}
interface Presentation {
	id: number;
	url: string;
	title: string;
	description?: string | null;
	status: string;
	slides: {directus_files_id: SlideFile}[];
}

const route = useRoute();
const slug = computed(() => String(route.params.url));

const presentations = useDirectusItems<Presentation>('presentations', {requireAuth: false});

const {data: presentation, pending} = await useAsyncData(
	() => `presentation-${slug.value}`,
	async () => {
		const results = await presentations.list({
			filter: {url: {_eq: slug.value}, status: {_eq: 'published'}},
			fields: [
				'id',
				'url',
				'title',
				'description',
				'status',
				'slides.directus_files_id.id',
				'slides.directus_files_id.width',
				'slides.directus_files_id.height',
				'slides.directus_files_id.title',
			],
			limit: 1,
		});
		return results?.[0] ?? null;
	}
);

const slides = computed<SlideFile[]>(
	() =>
		presentation.value?.slides
			?.map((s) => s.directus_files_id)
			.filter((f): f is SlideFile => Boolean(f?.id)) ?? []
);

const active = ref(0);
const swiper = shallowRef<SwiperClass | null>(null);
const onSwiper = (sw: SwiperClass) => {
	swiper.value = sw;
	active.value = sw.activeIndex;
};
const onSlideChange = (sw: SwiperClass) => {
	active.value = sw.activeIndex;
};
const goPrev = () => swiper.value?.slidePrev();
const goNext = () => swiper.value?.slideNext();

// 404 for unknown slugs
if (!pending.value && !presentation.value) {
	throw createError({statusCode: 404, statusMessage: 'Presentation not found'});
}

const {public: config} = useRuntimeConfig();
const ogImage = computed(() =>
	slides.value[0]
		? `${config.assetsUrl}${slides.value[0].id}?width=1200&format=jpg&quality=80`
		: undefined
);

useHead(() => ({
	title: presentation.value ? presentation.value.title : 'Presentation',
	// Shared privately — keep it out of search engines.
	meta: [
		{name: 'robots', content: 'noindex, nofollow'},
		...(presentation.value
			? [
					{property: 'og:title', content: presentation.value.title},
					{property: 'og:type', content: 'website'},
					...(ogImage.value ? [{property: 'og:image', content: ogImage.value}] : []),
				]
			: []),
	],
}));
</script>

<style scoped>
.presentation-viewer {
	position: fixed;
	inset: 0;
	background: #0b0b0d;
	color: #f5f5f5;
	display: flex;
	flex-direction: column;
}

.pv-center {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	text-align: center;
	padding: 1.5rem;
}

.pv-spinner {
	width: 34px;
	height: 34px;
	border: 3px solid rgba(255, 255, 255, 0.2);
	border-top-color: #fff;
	border-radius: 50%;
	animation: pv-spin 0.8s linear infinite;
}
@keyframes pv-spin {
	to {
		transform: rotate(360deg);
	}
}

/* Floating info button */
.pv-info-btn {
	position: fixed;
	z-index: 22;
	top: max(0.9rem, env(safe-area-inset-top));
	right: max(0.9rem, env(safe-area-inset-right));
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 38px;
	height: 38px;
	border-radius: 999px;
	color: #fff;
	background: transparent;
	border: none;
	transition: opacity 0.2s;
	opacity: 0.9;
	filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
}
.pv-info-btn:hover {
	opacity: 1;
}
.pv-info-icon {
	font-size: 22px;
}

/* Info slide-out panel */
.pv-info-backdrop {
	position: fixed;
	inset: 0;
	z-index: 20;
}
.pv-info-panel {
	position: fixed;
	z-index: 21;
	top: 0;
	right: 0;
	width: min(360px, 100vw);
	max-height: 100vh;
	overflow-y: auto;
	padding: 1.5rem 1.5rem 1.6rem;
	padding-top: max(1.5rem, env(safe-area-inset-top));
	background: rgba(0, 0, 0, 0.82);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	border-left: 1px solid rgba(255, 255, 255, 0.12);
	border-bottom: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 0;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}
.pv-info-close {
	position: absolute;
	top: 0.6rem;
	right: 0.6rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 999px;
	color: #fff;
	opacity: 0.6;
	transition: opacity 0.2s, background 0.2s;
}
.pv-info-close:hover {
	opacity: 1;
	background: rgba(255, 255, 255, 0.12);
}
.pv-info-title {
	font-size: 0.9rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.07em;
	line-height: 1.35;
	padding-right: 1.75rem;
	margin-bottom: 0.55rem;
	animation: pv-content-in 0.42s ease both;
	animation-delay: 0.12s;
}
.pv-info-desc {
	font-size: 0.85rem;
	line-height: 1.55;
	color: rgba(245, 245, 245, 0.85);
	white-space: pre-line;
	animation: pv-content-in 0.42s ease both;
	animation-delay: 0.22s;
}
.pv-info-desc--muted {
	color: rgba(245, 245, 245, 0.5);
	font-style: italic;
}
@keyframes pv-content-in {
	from {
		opacity: 0;
		transform: translateY(7px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* Panel slide-in-from-right transition */
.pv-slide-in-enter-active,
.pv-slide-in-leave-active {
	transition: transform 0.28s ease, opacity 0.28s ease;
}
.pv-slide-in-enter-from,
.pv-slide-in-leave-to {
	transform: translateX(100%);
	opacity: 0;
}

/* Info icon: slides out to the left when panel opens, back in from the left when it closes */
.pv-icon-enter-active,
.pv-icon-leave-active {
	transition: transform 0.28s ease, opacity 0.28s ease;
}
.pv-icon-enter-from,
.pv-icon-leave-to {
	transform: translateX(-16px);
	opacity: 0;
}

.pv-swiper {
	flex: 1;
	width: 100%;
	min-height: 0;
}
.pv-slide {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.5rem 1rem 1rem;
}
.pv-img {
	max-width: 100%;
	max-height: 100%;
	width: auto;
	height: auto;
	object-fit: contain;
	user-select: none;
	border-radius: 4px;
}

/* Bottom controls: chevron · fraction · chevron */
.pv-controls {
	flex: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	padding: 0.5rem 1rem;
	padding-bottom: max(0.6rem, env(safe-area-inset-bottom));
}
.pv-nav {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 999px;
	color: #fff;
	opacity: 0.85;
	transition: opacity 0.2s, background 0.2s;
}
.pv-nav:hover:not(:disabled) {
	opacity: 1;
	background: rgba(255, 255, 255, 0.1);
}
.pv-nav:disabled {
	opacity: 0.25;
	cursor: default;
}
.pv-nav :deep(.iconify) {
	font-size: 26px;
}
.pv-fraction {
	min-width: 4.5rem;
	text-align: center;
	font-size: 0.9rem;
	font-variant-numeric: tabular-nums;
	letter-spacing: 0.03em;
	opacity: 0.85;
}
</style>
