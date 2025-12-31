<script setup>
const props = defineProps({
	images: {
		type: Array,
		required: true,
		default: () => [],
	},
	direction: {
		type: String,
		default: 'left',
		validator: (value) => ['left', 'right', 'up', 'down'].includes(value),
	},
	speed: {
		type: Number,
		default: 30, // seconds for one complete cycle
	},
	pauseOnHover: {
		type: Boolean,
		default: true,
	},
	gap: {
		type: Number,
		default: 16, // gap in pixels between images
	},
	imageHeight: {
		type: Number,
		default: 200, // height of images in pixels (for horizontal) or width (for vertical)
	},
});

const isVertical = computed(() => props.direction === 'up' || props.direction === 'down');
const isReverse = computed(() => props.direction === 'right' || props.direction === 'down');

const animationStyle = computed(() => {
	const animationName = isVertical.value ? 'marquee-vertical' : 'marquee-horizontal';
	const direction = isReverse.value ? 'reverse' : 'normal';

	return {
		'--marquee-duration': `${props.speed}s`,
		'--marquee-gap': `${props.gap}px`,
		animationName,
		animationDuration: `${props.speed}s`,
		animationTimingFunction: 'linear',
		animationIterationCount: 'infinite',
		animationDirection: direction,
	};
});

const containerClass = computed(() => {
	return [
		'marquee-container',
		isVertical.value ? 'marquee-vertical-container' : 'marquee-horizontal-container',
		props.pauseOnHover ? 'pause-on-hover' : '',
	];
});

const trackClass = computed(() => {
	return [
		'marquee-track',
		isVertical.value ? 'marquee-track-vertical' : 'marquee-track-horizontal',
	];
});
</script>

<template>
	<div :class="containerClass" :style="{ '--image-size': `${imageHeight}px` }">
		<div :class="trackClass" :style="animationStyle">
			<!-- First set of images -->
			<div
				v-for="(image, index) in images"
				:key="`first-${index}`"
				class="marquee-item"
				:style="{ gap: `${gap}px` }">
				<img
					:src="typeof image === 'string' ? image : image.src"
					:alt="typeof image === 'string' ? `Image ${index + 1}` : image.alt || `Image ${index + 1}`"
					class="marquee-image" />
			</div>
			<!-- Duplicate set for seamless loop -->
			<div
				v-for="(image, index) in images"
				:key="`second-${index}`"
				class="marquee-item"
				:style="{ gap: `${gap}px` }">
				<img
					:src="typeof image === 'string' ? image : image.src"
					:alt="typeof image === 'string' ? `Image ${index + 1}` : image.alt || `Image ${index + 1}`"
					class="marquee-image" />
			</div>
		</div>
	</div>
</template>

<style scoped>
.marquee-container {
	overflow: hidden;
	position: relative;
}

.marquee-horizontal-container {
	width: 100%;
}

.marquee-vertical-container {
	height: var(--image-size, 200px);
	width: fit-content;
}

.marquee-track {
	display: flex;
}

.marquee-track-horizontal {
	flex-direction: row;
	width: max-content;
	gap: var(--marquee-gap, 16px);
}

.marquee-track-vertical {
	flex-direction: column;
	height: max-content;
	gap: var(--marquee-gap, 16px);
}

.marquee-item {
	flex-shrink: 0;
}

.marquee-image {
	display: block;
	object-fit: cover;
	border-radius: 0.5rem;
}

.marquee-horizontal-container .marquee-image {
	height: var(--image-size, 200px);
	width: auto;
}

.marquee-vertical-container .marquee-image {
	width: var(--image-size, 200px);
	height: auto;
}

/* Horizontal animation */
@keyframes marquee-horizontal {
	0% {
		transform: translateX(0);
	}
	100% {
		transform: translateX(-50%);
	}
}

/* Vertical animation */
@keyframes marquee-vertical {
	0% {
		transform: translateY(0);
	}
	100% {
		transform: translateY(-50%);
	}
}

/* Pause on hover */
.pause-on-hover:hover .marquee-track {
	animation-play-state: paused;
}
</style>
