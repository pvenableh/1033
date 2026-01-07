<script setup>
definePageMeta({
	layout: 'email',
});
</script>
<template>
	<div class="min-h-dvh flex items-center flex-col w-full intro">
		<div class="relative w-full flex items-center justify-center py-40 intro__header">
			<InsightsWeather class="absolute left-[5px] top-[30px] sm:pl-1 md:px-6" />
			<div class="absolute right-[5px] top-[30px] sm:pl-1 md:px-6">
				<DarkModeToggle class="" />
			</div>
			<div class="max-w-4xl text-white px-6">
				<NewLogo class="intro__logo" />
				<!-- <h2 class="uppercase tracking-widest mb-12 text-center">Welcome</h2> -->
				<p class="mt-12 text-shadow-lg">
					Experience the epitome of residential Miami Beach at 1033 Lenox, a boutique condominium building nestled in
					the heart of Miami Beach's vibrant Flamingo Park neighborhood. With only 28 one-bedroom apartments, each
					featuring an oversized balcony, 1033 Lenox offers a private and professional living experience designed for
					discerning individuals who value quality and exclusivity.
				</p>
			</div>
		</div>
		<div
			class="w-full flex items-center justify-center py-40 bg-[rgba(255,255,255,0.25)] backdrop-blur-lg shadow-inner dark:bg-gray-800 text-white">
			<div class="max-w-4xl px-6">
				<h2 class="uppercase tracking-widest mb-12 text-center">Prime Location</h2>
				<p>
					1033 Lenox is perfectly situated to access the best of Miami Beach. Just one block away, you'll find Whole
					Foods Market. One block the other way is Flamingo Park, featuring an array of recreational facilities
					including an outdoor gym, pool, track and field, basketball and racquetball courts, tennis courts, and a
					soon-to-open butterfly garden. Enjoy the luxury of a walkable neighborhood that caters to the active
					lifestyle.
				</p>
			</div>
		</div>
		<div class="w-full flex items-center justify-center py-40 bg-white dark:bg-gray-800 dark:text-white">
			<div class="w-full max-w-4xl px-6">
				<h2 class="uppercase tracking-widest mb-12 text-center">Exclusive Amenities</h2>
				<!-- <p>At 1033 Lenox, every detail is designed with your comfort and convenience in mind. Our amenities include:</p> -->
				<div class="w-full flex flex-row flex-wrap mt-8 items-center justify-center">
					<div class="intro__amenity">
						<Icon name="Balcony" class="h-12 w-12" />
						<h5>Oversized Balconies</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="Elevator" class="h-12 w-12" />
						<h5>Elevator</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="CourtYard" class="h-12 w-12" />
						<h5>Courtyard</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="SecurityCamera" class="h-12 w-12" />
						<h5>Security System</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="AccessPanel" class="h-12 w-12" />
						<h5>Access Control</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="Parking" class="h-12 w-12" />
						<h5>Assigned Parking</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="Laundry" class="h-12 w-12" />
						<h5>Laundry Facility</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="Storage" class="h-12 w-12" />
						<h5>Individual Storage</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="Wifi" class="h-12 w-12" />
						<h5>Network</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="BikeStorage" class="h-12 w-12" />
						<h5>Bike Storage</h5>
					</div>
				</div>
				<div class="w-full flex flex-row flex-wrap mt-8 items-center justify-center">
					<h3 class="w-full text-center uppercase tracking-widest text-[10px]">Proposed</h3>
					<div class="intro__amenity">
						<Icon name="Coworking" class="h-12 w-12" />
						<h5>Coworking Space</h5>
					</div>
					<div class="intro__amenity">
						<Icon name="ExerciseBike" class="h-12 w-12" />
						<h5>Exercise Room</h5>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<style>
@reference "~/assets/css/tailwind.css";

.intro {
	background-image: url('https://admin.1033lenox.com/assets/bda84bff-e6e1-4bfb-ac82-f44a999d7073');
	background-color: rgba(0, 0, 0, 0.5);
	background-attachment: fixed;
	@apply bg-cover bg-center bg-no-repeat bg-blend-darken opacity-100;
	.weather__stats {
		@apply text-white;
	}
	&__logo {
		filter: drop-shadow(0 0.2rem 0.25rem rgba(0, 0, 0, 0.5));
		path {
			fill: white;
		}
		line {
			stroke: white;
		}
	}
	&__header {
	}
	&__amenity {
		@apply flex flex-col items-center justify-center px-4 mx-4 mb-6 transition-all;
		h5 {
			@apply uppercase tracking-wide text-[9px];
		}
	}
	&__amenity:hover {
		@apply transform scale-105;
	}
}
</style>
