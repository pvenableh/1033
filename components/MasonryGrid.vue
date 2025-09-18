<script setup>
import {ref, onMounted} from 'vue';
import {gsap} from 'gsap';

const props = defineProps({
	images: {
		type: Array,
		required: true,
		default: () => [],
	},
	gap: {
		type: Number,
		default: 1,
	},
});

const masonryRef = ref(null);
const imageRefs = ref([]);

// Initialize refs array based on images length
onMounted(() => {
	imageRefs.value = Array(props.images.length)
		.fill()
		.map(() => ref(null));

	// Set up Intersection Observer to trigger animations
	if (window.IntersectionObserver) {
		const options = {
			root: null,
			rootMargin: '0px',
			threshold: 0.1,
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				// Store animation state on elements
				if (!entry.target.hasAttribute('data-animated')) {
					entry.target.setAttribute('data-animated', 'false');
				}

				const isAnimated = entry.target.getAttribute('data-animated') === 'true';

				if (entry.isIntersecting && !isAnimated) {
					// Get the index from the data attribute
					const index = parseInt(entry.target.dataset.index);

					// Animate the item when it enters viewport with gooey effect
					gsap.fromTo(
						entry.target,
						{
							y: 30,
							opacity: 0,
							scale: 0.9,
						},
						{
							y: 0,
							opacity: 1,
							scale: 1,
							duration: 0.8,
							ease: 'elastic.out(1, 0.7)',
							stagger: 0.1,
							onComplete: () => {
								entry.target.setAttribute('data-animated', 'true');
							},
						}
					);
				} else if (!entry.isIntersecting && isAnimated) {
					// Reset animation state when element leaves viewport
					entry.target.setAttribute('data-animated', 'false');

					// Gooey effect when leaving viewport
					gsap.to(entry.target, {
						opacity: 0,
						scale: 0.9,
						y: 20,
						duration: 0.5,
						ease: 'back.in(1.2)',
					});
				}
			});
		}, options);

		// Start observing elements when they're mounted
		setTimeout(() => {
			const itemElements = document.querySelectorAll('.masonry-item');
			itemElements.forEach((el, index) => {
				el.dataset.index = index;
				observer.observe(el);
			});
		}, 100); // Small delay to ensure all items are mounted
	}
});
</script>

<template>
	<div class="masonry-container" ref="masonryRef">
		<MasonryWall
			:items="images"
			:gap="gap"
			:cols="{
				default: 5,
				1024: 4,
				768: 3,
				640: 2,
				400: 1,
			}"
			:rtl="false">
			<template #default="{item, index}">
				<div
					class="masonry-item"
					:ref="
						(el) => {
							if (el) imageRefs[index] = el;
						}
					">
					<img :src="item.src" :alt="item.alt" loading="lazy" />
				</div>
			</template>
		</MasonryWall>
	</div>
</template>

<style scoped>
.masonry-container {
	width: 100%;
	max-width: 2500px;
	margin: 0 auto;
	padding: 0 1rem;
}

.masonry-item {
	overflow: hidden;
	border-radius: 0px;
	background-color: #f3f4f6;
	transition: transform 0.3s ease;
	opacity: 0; /* Start with 0 opacity for GSAP animation */
	transform: scale(0.9);
}

/* .masonry-item:hover {
  transform: scale(1.02);
} */

.masonry-item img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}
</style>
