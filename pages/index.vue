<script setup>
const {user} = useDirectusAuth();

const {x, y} = useMouse({touch: false});

const {readSingleton} = useDirectusItems();

const features = await readSingleton('features', {
	fields: [
		'featured_images.directus_files_id.id',
		'featured_images.directus_files_id.title',
		'featured_images.directus_files_id.width', // Add this
		'featured_images.directus_files_id.height', // Add this
		'featured_images.directus_files_id.filename_download',
	],
});

const config = useRuntimeConfig();
const directusUrl = config.public.directusUrl;

const transformedImages = computed(() => {
	if (!features.featured_images) return [];

	return features.featured_images.map((item) => {
		const image = item.directus_files_id;

		const width = parseInt(image.width);
		const height = parseInt(image.height);

		if (isNaN(width) || isNaN(height)) {
			console.warn('Invalid dimensions for image:', image.id);
		}

		return {
			id: image.id,
			width,
			height,
			src: `${directusUrl}/assets/${image.id}?key=medium`,
			alt: image.title || image.filename_download,
			aspectRatio: height / width,
		};
	});
});
</script>
<template>
	<div class="relative w-full flex items-center justify-center flex-col home">
		<div class="relative w-full min-h-screen flex items-center justify-center flex-col">
			<div class="relative w-full min-h-[calc(100vh-220px)] flex items-center justify-center flex-col">
				<h1 v-if="!user" class="-mt-2 md:-mt-20 mb-12 text-center px-4 md:px-6 temp-heading">
					Welcome to
					<span class="font-bold">1033 Lenox:</span>
					a boutique community in Miami Beach focused on the local, active lifestyle.
				</h1>
				<h1 v-else class="-mt-2 md:-mt-20 mb-12 text-center px-6 temp-heading">
					{{ greetUser() }}
					<span class="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-600 font-bold">
						{{ user.first_name }}.
					</span>
					<span class="font-bold">Welcome to 1033 Lenox</span>
				</h1>
				<div class="w-full h-[190px] sm:h-[300px] relative flex items-center justify-center">
					<img src="~/assets/img/palm-tree.png" class="absolute h-[60px] w-auto top-[5px] sm:top-[10px] ml-12" />
					<img
						src="~/assets/img/palm-tree.png"
						class="absolute h-[70px] w-auto top-[7px] sm:-top-[2px] -ml-28 -scale-x-100"
						:style="{marginRight: -x / 60 + 'px'}" />
					<img
						src="~/assets/img/palm-tree.png"
						class="absolute h-[60px] sm:h-[90px] w-auto top-[8px] sm:top-[0px] ml-20 -scale-x-100"
						:style="{marginRight: -x / 50 + 'px'}" />
					<img
						src="~/assets/img/palm-tree.png"
						class="absolute h-[50px] sm:h-[70px] w-auto top-[10px] sm:top-[3px] mr-32"
						:style="{marginLeft: -x / 30 + 'px'}" />
					<img
						ref="movableElement"
						src="https://admin.1033lenox.com/assets/22f2b886-0804-4fa4-9661-27da9d2ce6a6?key=medium"
						alt="1033 Lenox Ave Miami Beach, FL Graphic"
						class="lg:absolute mt-8 mb-8 px-8 drop-shadow-[15px_15px_10px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)] transition-transform building"
						:style="{marginTop: -y / 40 + 'px', marginLeft: -x / 20 + 'px'}" />
				</div>
				<div class="w-full flex flex-row items-center justify-center">
					<!-- <FormVButton
						class="mb-6 m-3 w-full"
						type="submit"
						variant="outline"
						style="max-width: 450px"
						@click="toggleInquiry"
					>
						Submit Inquiry
					</FormVButton> -->

					<LayoutBottomSheet
						max-width="max-w-none"
						max-height="max-h-[80vh]"
						content-class="px-4 py-4"
						:show-handle="true"
						:close-on-click-outside="true"
						:swipe-threshold="30"
						@open="onOpen"
						@close="onClose">
						<!-- Custom trigger button -->
						<template #trigger="{toggle}">
							<FormVButton type="submit" variant="outline" @click="toggle">Submit Inquiry</FormVButton>
						</template>

						<!-- Main content -->
						<div>
							<Inquiry />
						</div>
					</LayoutBottomSheet>
				</div>
				<!-- <nuxt-link v-if="!user" to="/auth/signin">
						<FormVButton class="w-full mb-6" type="submit" variant="outline" style="max-width: 450px">
							Login
						</FormVButton>
					</nuxt-link>
					<nuxt-link v-else to="/dashboard">
						<FormVButton class="w-full mb-6" type="submit" style="max-width: 450px">Dashboard</FormVButton>
					</nuxt-link> -->
			</div>
			<div v-if="transformedImages.length > 0" class="w-full mt-12">
				<h2 class="uppercase tracking-wider text-center text-[12px]">2025 Transformation</h2>
				<p class="text-center text-[12px] px-4 max-w-lg mx-auto mt-2 mb-4 leading-4">
					The building is in the process of completing the 40-year recertification process and has been completely
					transformed. The project officially broke ground in April of 2024.
				</p>
				<MasonryGrid :images="transformedImages" :gap="2" />
			</div>
		</div>
	</div>
</template>

<style>
.swiper {
	width: 100%; /* Or your desired width */
	height: 350px; /* Or your desired height */
}

.swiper-slide {
	text-align: center;
	font-size: 18px;
	background: #fff;

	display: block; /* Important: Restore default display */
}

.swiper-slide img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover; /* or contain, depending on your needs */
}
.home {
	/* background-color: rgba(0,0,0,0.35);
    background-blend-mode: darken; */
	.building {
		max-width: 350px;

		@media (min-width: theme('screens.sm')) {
			max-width: 575px;
		}

		@media (min-width: theme('screens.md')) {
			max-width: 575px;
		}

		@media (min-width: theme('screens.lg')) {
			max-width: 600px;
		}
	}

	.temp-heading {
		font-size: 12px;
		/* background: linear-gradient(-45deg, #cccccc, #666666);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent; */
		bottom: 0px;
		/* color: #cccccc; */
		@apply uppercase tracking-wide;
		max-width: 400px;

		@media (min-width: theme('screens.md')) {
			max-width: 400px;
		}

		@media (min-width: theme('screens.lg')) {
			max-width: 440px;
		}
	}

	.logo {
		max-width: 400px;
		@apply px-6 mt-8;

		/* filter: drop-shadow(0 0.2rem 0.25rem rgba(0, 0, 0, 0.5)); */
		@media (min-width: theme('screens.md')) {
			max-width: 400px;
		}

		@media (min-width: theme('screens.lg')) {
			max-width: 600px;
		}

		path {
			opacity: 0.4;
			animation-name: example;
			animation-duration: 5s;
			animation-timing-function: var(--curve);
			animation-iteration-count: infinite;
		}

		path:nth-of-type(1) {
			animation-delay: 0.1s;
		}

		path:nth-of-type(2) {
			animation-delay: 0.2s;
		}

		path:nth-of-type(3) {
			animation-delay: 0.3s;
		}

		path:nth-of-type(4) {
			animation-delay: 0.4s;
		}

		path:nth-of-type(5) {
			animation-delay: 0.5s;
		}

		path:nth-of-type(6) {
			animation-delay: 0.6s;
		}

		path:nth-of-type(7) {
			animation-delay: 0.7s;
		}

		path:nth-of-type(8) {
			animation-delay: 0.8s;
		}

		path:nth-of-type(9) {
			animation-delay: 0.9s;
		}

		path:nth-of-type(10) {
			animation-delay: 1s;
		}

		path:nth-of-type(11) {
			animation-delay: 1.1s;
		}

		path:nth-of-type(12) {
			animation-delay: 1.2s;
		}

		path:nth-of-type(13) {
			animation-delay: 1.3s;
		}

		path:nth-of-type(14) {
			animation-delay: 1.4s;
		}

		path:nth-of-type(15) {
			animation-delay: 1.5s;
		}

		path:nth-of-type(16) {
			animation-delay: 1.6s;
		}

		path:nth-of-type(17) {
			animation-delay: 1.7s;
		}

		path:nth-of-type(18) {
			animation-delay: 1.8s;
		}

		path:nth-of-type(19) {
			animation-delay: 1.9s;
		}

		path:nth-of-type(20) {
			animation-delay: 2s;
		}

		path:nth-of-type(21) {
			animation-delay: 2.1s;
		}

		path:nth-of-type(22) {
			animation-delay: 2.2s;
		}

		path:nth-of-type(23) {
			animation-delay: 2.3s;
		}

		path:nth-of-type(24) {
			animation-delay: 2.4s;
		}

		path:nth-of-type(25) {
			animation-delay: 2.5s;
		}

		path:nth-of-type(26) {
			animation-delay: 0.1s;
		}

		path:nth-of-type(27) {
			animation-delay: 0.2s;
		}

		path:nth-of-type(28) {
			animation-delay: 0.3s;
		}

		path:nth-of-type(29) {
			animation-delay: 0.4s;
		}

		path:nth-of-type(30) {
			animation-delay: 0.5s;
		}

		path:nth-of-type(31) {
			animation-delay: 0.6s;
		}

		path:nth-of-type(32) {
			animation-delay: 0.7s;
		}

		path:nth-of-type(33) {
			animation-delay: 0.8s;
		}

		path:nth-of-type(34) {
			animation-delay: 0.9s;
		}

		path:nth-of-type(35) {
			animation-delay: 1s;
		}

		path:nth-of-type(36) {
			animation-delay: 1.1s;
		}

		path:nth-of-type(37) {
			animation-delay: 1.2s;
		}

		path:nth-of-type(38) {
			animation-delay: 1.3s;
		}

		path:nth-of-type(39) {
			animation-delay: 1.4s;
		}

		path:nth-of-type(40) {
			animation-delay: 1.5s;
		}

		path:nth-of-type(41) {
			animation-delay: 1.6s;
		}

		path:nth-of-type(42) {
			animation-delay: 1.7s;
		}

		path:nth-of-type(43) {
			animation-delay: 1.8s;
		}

		path:nth-of-type(44) {
			animation-delay: 1.9s;
		}

		path:nth-of-type(45) {
			animation-delay: 2s;
		}

		path:nth-of-type(46) {
			animation-delay: 2.1s;
		}

		path:nth-of-type(47) {
			animation-delay: 2.2s;
		}

		path:nth-of-type(48) {
			animation-delay: 2.23s;
		}

		path:nth-of-type(49) {
			animation-delay: 2.26s;
		}

		path:nth-of-type(50) {
			animation-delay: 2.29s;
		}

		path:nth-of-type(51) {
			animation-delay: 2.32s;
		}

		path:nth-of-type(52) {
			animation-delay: 2.35s;
		}

		path:nth-of-type(53) {
			animation-delay: 2.38s;
		}

		path:nth-of-type(54) {
			animation-delay: 2.41s;
		}

		path:nth-of-type(55) {
			animation-delay: 2.44s;
		}

		path:nth-of-type(56) {
			animation-delay: 2.47s;
		}

		path:nth-of-type(57) {
			animation-delay: 2.5s;
		}
	}

	@keyframes example {
		0% {
			opacity: 0.4;
		}

		50% {
			opacity: 1;
		}

		100% {
			opacity: 0.4;
		}
	}
}
</style>
