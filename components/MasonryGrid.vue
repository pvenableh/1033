<script setup>
defineProps({
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
</script>

<template>
	<div class="masonry-container">
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
			:rtl="false"
		>
			<template #default="{ item }">
				<div class="masonry-item">
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
}

/* .masonry-item:hover {
	transform: scale(1.02);
} */

.masonry-item img {
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
