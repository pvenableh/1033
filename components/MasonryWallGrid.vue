<script setup>
const props = defineProps({
	images: {
		type: Array,
		required: true,
		default: () => [],
	},
	wideThreshold: {
		type: Number,
		default: 1.3,
	},
	baseRowHeight: {
		// Make baseRowHeight a prop for flexibility
		type: Number,
		default: 20,
	},
	gap: {
		type: Number,
		default: 16,
	},
});

const columns = ref(4);
const containerRef = ref(null);
const isClient = ref(false);
// Optimize image order
const optimizedImages = computed(() => {
	if (!props.images.length) return [];

	const wideImages = [];
	const tallImages = [];
	const normalImages = [];

	// Sort images into categories
	props.images.forEach((image) => {
		const aspectRatio = image.width / image.height;
		if (aspectRatio > props.wideThreshold) {
			wideImages.push({...image, aspectRatio});
		} else if (aspectRatio < 0.8) {
			tallImages.push({...image, aspectRatio});
		} else {
			normalImages.push({...image, aspectRatio});
		}
	});

	tallImages.sort((a, b) => b.height - a.height);

	const optimized = [];
	let wideIndex = 0;
	let tallIndex = 0;
	let normalIndex = 0;

	while (wideIndex < wideImages.length || tallIndex < tallImages.length || normalIndex < normalImages.length) {
		if (tallIndex < tallImages.length) {
			optimized.push(tallImages[tallIndex]);
			tallIndex++;
		}

		if (wideIndex < wideImages.length) {
			optimized.push(wideImages[wideIndex]);
			wideIndex++;
		}

		if (normalIndex < normalImages.length) {
			optimized.push(normalImages[normalIndex]);
			normalIndex++;
		}
	}

	return optimized;
});

const updateColumns = () => {
	if (!isClient.value) return;

	const width = window.innerWidth;
	if (width < 640) {
		columns.value = 1;
	} else if (width < 768) {
		columns.value = 2;
	} else if (width < 1024) {
		columns.value = 4;
	} else {
		columns.value = 6;
	}
};

const getColumnSpan = (image) => {
	if (!isClient.value || !image || !image.height || !image.width) return 1;

	const aspectRatio = image.width / image.height;
	if (aspectRatio > props.wideThreshold && columns.value > 1) {
		return Math.min(2, columns.value);
	}
	return 1;
};

const getRowSpan = (image) => {
	if (!isClient.value || !image || !image.height || !image.width) {
		return 1; // Default to 1
	}

	const aspectRatio = image.width / image.height;
	const columnSpan = getColumnSpan(image);

	if (aspectRatio > props.wideThreshold && columns.value > 1) {
		// Wide image handling
		return Math.max(1, Math.round(props.baseRowHeight / aspectRatio)); // Key change!
	} else {
		// Normal/Tall Image Handling
		const containerWidth = containerRef.value?.offsetWidth || window.innerWidth;
		const totalColumnWidth = (containerWidth / columns.value) * columnSpan;
		const totalGapWidth = props.gap * (columnSpan - 1); // Use prop for gap
		const effectiveWidth = totalColumnWidth - totalGapWidth;
		const scaledHeight = effectiveWidth / aspectRatio;
		return Math.ceil(scaledHeight / props.baseRowHeight);
	}
};

onMounted(() => {
	isClient.value = true;
	updateColumns();
	window.addEventListener('resize', updateColumns);
});

onUnmounted(() => {
	if (isClient.value) {
		window.removeEventListener('resize', updateColumns);
	}
});

// Watch for changes in props that might affect layout
watch([props.wideThreshold, props.baseRowHeight, props.gap], () => {
	updateColumns(); // Recalculate layout when props change
});
</script>

<template>
	<div ref="containerRef" class="max-w-[2500px] mx-auto px-4">
		<div
			class="grid gap-1"
			:style="{
				gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
				gridAutoRows: `${props.baseRowHeight}px`, // Use prop here too
				gridAutoFlow: 'dense',
			}">
			<div
				v-for="image in optimizedImages"
				:key="image.id"
				class="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800 transition-all duration-300 hover:scale-[1.02]"
				:style="{
					gridRow: `span ${getRowSpan(image)}`,
					gridColumn: `span ${getColumnSpan(image)}`,
				}">
				<img
					:src="image.src"
					:alt="image.alt"
					class="absolute inset-0 w-full h-full object-cover"
					loading="lazy"
					@load="updateColumns" />
			</div>
		</div>
	</div>
</template>
<style scoped>
.masonry-item {
	/* Style your masonry items here */
	overflow: hidden; /* To prevent image overflow */
	border-radius: 8px; /* Example */
}

.masonry-item img {
	display: block; /* Important for preventing small vertical gaps */
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0;
	animation: fadeIn 0.5s ease-in forwards;
}

@keyframes fadeIn {
	to {
		opacity: 1;
	}
}
.grid {
	display: grid;
	width: 100%;
	grid-auto-flow: dense; /* Or add it here */
}

img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0;
	animation: fadeIn 0.5s ease-in forwards;
}

@keyframes fadeIn {
	to {
		opacity: 1;
	}
}
</style>
