<script setup>
const {gtag} = useGtag();

import confetti from 'canvas-confetti';
const toast = useToast();

const renderings = ref([
	{
		id: 1,
		title: 'Blink Video Doorbell',
		image: '5d769212-d30f-4fcb-a143-7322d65ae5ae',
		image2: '38b0628c-ed63-4eec-bfd6-63b852e5efb1',
		description: `<div class="flex items-center justify-center flex-col">
			<h5 class="font-bold text-red-500 uppercase">Free with HOA*</h5>
			<div class="w-full flex flex-row items-start justify-center">
				<ul class="list-disc list-inside pl-2 text-left"><li>$37.50</li>
				<li>White</li>
				<li>Wifi</li>
				<li>Battery Operated</li>
			</ul>
			</div>`,
		aside: 'If you select this option, the Board will buy and install the camera for your unit.',
		label: 'Blink Video Doorbell',
		link: 'https://www.bestbuy.com/site/blink-smart-wifi-video-doorbell-wired-battery-operated-white/6481226.p?skuId=6481226&utm_source=feed&ref=212&loc=SaleEvent&gad_source=1&gbraid=0AAAAAD-ORIjnOrgIwDBn8UZJrq8HqtZ_I&gclsrc=aw.ds',
		note: '*Selecting this option will not credit your HOA account. Your vote must be in by no later than Saturday May 24th, 2025 11:59pm',
	},
	{
		id: 2,
		title: 'Google Nest Doorbell [Similar]',
		image: '28bedf75-dda8-432a-9940-868f7146b357',
		image2: '15273883-d1fe-4a63-8c0e-63c033b70a4d',
		description: `<div class="flex items-center justify-center flex-col">
			<h5 class="font-bold text-red-500 uppercase">Receive Credit from HOA*</h5>
			<ul class="list-disc list-inside pl-2 text-left"><li>$179.99 [Receive credit of $37.50]</li>
				<li>White</li>
				<li>Wifi</li>
				<li>Battery Operated</li>
			</ul>
			</div>`,
		label: 'Opt Out / Receive Credit',
		link: 'https://www.bestbuy.com/site/google-nest-wi-fi-video-doorbell-battery-operated-snow/6473256.p?skuId=6473256',
		note: '*For owners who choose this option, the Board will credit their HOA account $37.50 Your vote must be in by no later than Saturday May 24th, 2025 11:59pm',
	},
]);

function randomInRange(min, max) {
	return Math.random() * (max - min) + min;
}

const launchConfetti = () => {
	confetti({
		angle: randomInRange(55, 125),
		spread: randomInRange(50, 70),
		particleCount: randomInRange(50, 100),
		origin: {y: 0.6},
	});
};

const selectedItem = ref({});
const isVoteOpen = ref(false);

function toggleVote(item) {
	if (isVoteOpen.value) {
		isVoteOpen.value = false;
		selectedItem.value = {};
	} else {
		launchConfetti();
		isVoteOpen.value = true;
		selectedItem.value = item;

		// GA4 format for custom events
		gtag('event', 'vote_button_click', {
			item_id: item.id,
			item_title: item.title,
			screen_name: 'door_voting',
		});
	}
}

function closeVote() {
	isVoteOpen.value = false;
	selectedItem.value = {};
}

function makeUppercase(title) {
	if (!title) return '';
	return title.toUpperCase();
}

var duration = 15 * 1000;
var animationEnd = Date.now() + duration;
var defaults = {startVelocity: 30, spread: 360, ticks: 60, zIndex: 0};

// const defaults = {
// 	spread: 360,
// 	ticks: 50,
// 	gravity: 0,
// 	decay: 0.94,
// 	startVelocity: 30,
// 	colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
// };

function startConfetti(duration = 7000) {
	const end = Date.now() + duration;
	const colors = ['#00bfff', '#0ef62d', '#e8fc00', '#ffcc00', '#ff005c', '#ff00cc', '#502989'];

	function frame() {
		confetti({
			particleCount: 6,
			angle: 60,
			spread: 55,
			origin: {x: 0},
			colors: colors,
		});
		confetti({
			particleCount: 3,
			angle: 120,
			spread: 55,
			origin: {x: 1},
			colors: colors,
		});

		if (Date.now() < end) {
			requestAnimationFrame(frame);
		}
	}

	frame();
}
function sendConfetti() {
	isVoteOpen.value = false;
	selectedItem.value = {};

	startConfetti();
	// var interval = setInterval(function () {
	// 	var timeLeft = animationEnd - Date.now();

	// 	if (timeLeft <= 0) {
	// 		return clearInterval(interval);
	// 	}

	// 	var particleCount = 50 * (timeLeft / duration);
	// 	// since particles fall down, start a bit higher than random
	// 	confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
	// 	confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
	// }, 250);
	// setTimeout(shoot, 0);
	// setTimeout(shoot, 100);
	// setTimeout(shoot, 200);
}

const mailtoLink = computed(() => {
	if (selectedItem?.value) {
		const encodedSubject = `1033 Lenox Doorbell Camera Vote: ${selectedItem.value.label}`;
		let bodyDetails = '';
		if (selectedItem.value.id == 1) {
			bodyDetails = `I submit my vote of OPTION ${selectedItem.value.id}: ${makeUppercase(selectedItem.value.title)}. I would like the Board to purchase the ${selectedItem.value.label} for my unit at the cost of $37.50. Please let me know if you need any additional information.`;
		} else if (selectedItem.value.id == 2) {
			bodyDetails = `I submit my vote of OPTION ${selectedItem.value.id}: ${makeUppercase(selectedItem.value.label)}. I would like the Board to credit my HOA account at the cost of $37.50. I will purchase an approved doorbell camera, similar to the ${selectedItem.value.title} for my unit. Please let me know if you need any additional information.`;
		}

		// GA4 format for email link events
		gtag('event', 'vote_email_click', {
			item_id: selectedItem.value.id,
			item_title: selectedItem.value.label,
			screen_name: 'doorbell_voting',
		});

		return `mailto:lenoxplazaboard@gmail.com?subject=${encodedSubject}&body=${bodyDetails}`;
	} else {
		return '';
	}
});

function openExternalLink() {
	console.log(mailtoLink.value);
	window.open(mailtoLink.value, '_blank'); // Opens the link in a new tab

	// GA4 format for vote submission events
	gtag('event', 'vote_email_created', {
		item_id: selectedItem.value.id,
		item_title: selectedItem.value.title,
		submission_method: 'email',
	});

	toast.add({
		title: 'Success',
		description: 'Email created successfully',
		color: 'green',
		timeout: 8000,
	});
	sendConfetti();
}
</script>
<template>
	<div class="flex items-center justify-center flex-col w-full renderings">
		<div class="w-full mb-8 max-w-[650px] lg:max-w-[1000px] px-2 lg:px-0 renderings__intro">
			<h1 class="text-3xl lg:text-5xl uppercase font-bold text-center mt-10 mb-8">Doorbell Cameras</h1>

			<div class="w-full flex items-center justify-start flex-col mt-6 px-4 mx-auto">
				<h3 class="uppercase tracking-wide font-bold text-[20px] leading-6 mb-6 text-center">
					<UIcon name="i-material-symbols-how-to-vote-sharp" class="h-6 w-6 -mb-1" />
					Submit Your Vote:
				</h3>
				<p class="max-w-[600px] mb-6">
					The Board has obtained new doorbell cameras for every unit. This is the approved doorbell camera and will be
					covered with your HOA.
				</p>
				<p class="max-w-[600px] mb-6">
					The goal of this process, on the type of cameras and placement, will help us keep the structural integrity of
					the building while keeping an aesthetically cohesive experience.
				</p>
				<p class="w-full max-w-[600px] mb-4">Review the two options below to inform the board of your vote:</p>

				<ul class="w-full list-disc list-inside text-left text-[14px] mt-4 mb-2 leading-5 max-w-[450px]">
					<li class="mb-4">
						OPTION 1 - Included in your HOA, the Board will purchase and install a Blink Smart Video Doorbell for you
						next week.
					</li>
					<li>
						OPTION 2 - Choose to opt out of HOA doorbell and wish to receive a $37.50 credit to your HOA account. Will
						install an approved doorbell on my own.
					</li>
				</ul>

				<h5 class="font-bold uppercase tracking-wide text-center mt-2 mb-2">Approved HOA Doorbell Camera</h5>
				<!-- <p class="w-full mt-2 mb-2 text-[14px] text-center leading-5 max-w-[600px]">
					View the
					<strong>two options</strong>
					below and submit your vote by clicking your choice below to open a new email with your selected choice that
					you can send directly to the board.
				</p> -->
				<p class="w-full mt-4 mb-2 text-[14px] text-center leading-5">
					Please note that your vote is due by:
					<span class="font-bold">Saturday May 24th, 2025 at 11:59PM EST.</span>
				</p>
			</div>
		</div>
		<div class="w-full flex items-center justify-center flex-col mb-42">
			<div class="mb-8 renderings__list">
				<div class="w-full flex flex-col sm:flex-row items-start justify-around gap-8 max-w-[1400px]">
					<div
						v-for="(item, index) in renderings"
						:key="index"
						class="flex items-center justify-center flex-col border border-gray-200 shadow-lg renderings__item">
						<div class="w-full relative flex flex-row items-center justify-center max-w-[500px] renderings__item-image">
							<img
								:src="'https://admin.1033lenox.com/assets/' + item.image + '?key=medium'"
								:alt="item.title"
								class="w-full" />
							<img
								v-if="item.image2"
								:src="'https://admin.1033lenox.com/assets/' + item.image2 + '?key=medium'"
								:alt="item.title"
								class="w-full" />
						</div>
						<div class="w-full flex items-center justify-center flex-col max-w-[500px] renderings__item-caption">
							<h3 class="w-full mt-6 mb-4 text-center leading-4 renderings__item-title">
								<span class="label">Option {{ item.id }}:</span>
								<span class="font-bold block">{{ item.title }}</span>
							</h3>
							<div v-if="item.description" class="w-full mb-4 text-center text-[14px] leading-5">
								<div v-html="item.description" />
							</div>
							<a
								v-if="item.link"
								class="mb-6 leading-4 flex flex-row text-[12px] uppercase tracking-wide max-w-[500px]"
								:href="item.link"
								target="_blank">
								Doorbell Details
								<UIcon name="i-heroicons-arrow-right" class="h-3 w-3 ml-2 mt-0.5" />
							</a>
							<UButton
								color="gray"
								variant="outline"
								:ui="{rounded: 'rounded-sm'}"
								class="mb-6 tracking-wide leading-4 flex flex-col text-[12px] max-w-[500px]"
								@click="toggleVote(item)">
								<span class="opacity-65 block">Vote for:</span>
								<span class="font-bold block">{{ item.label }}</span>
							</UButton>

							<p v-if="item.note" class="w-full mt-2 mb-6 text-[12px] leading-5 text-red-500">
								<span class="font-bold">{{ item.note }}</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="w-full flex items-center justify-center flex-col mb-42 mt-12">
			<h5 class="font-bold uppercase tracking-wide text-center mt-2 mb-2">🚪📐 PLACEMENT / INSTALLATION / DESIGN</h5>
			<ul class="w-full list-disc list-inside text-left text-[14px] mt-4 mb-2 leading-5 max-w-[450px]">
				<li class="">
					<strong class="font-bold">CAMERA DESIGN:</strong>
					The only approved camera design is WHITE and VERTICAL
				</li>
				<li class="">
					<strong class="font-bold">NO DRILLING</strong>
					on Door or Wall
				</li>
				<li class="">
					Back Stick
					<strong class="font-bold">ONLY</strong>
				</li>

				<li class="">
					Position on the right door frame
					<strong>(not the wall nor the door itself)</strong>
				</li>
				<li class="">Position 5 feet from the bottom to the top of the camera (as shown)</li>
			</ul>
			<p class="w-full mt-12 px-10 text-center text-[14px] leading-5 mb-36">
				If you have questions or any problems, please contact the board as soon as possible (before the deadline) so we
				can assist you.
			</p>
		</div>

		<Modal v-model="isVoteOpen">
			<div class="py-8 px-6 text-center relative">
				<UIcon
					name="i-heroicons-x-circle"
					class="cursor-pointer h-6 w-6 absolute right-[10px] top-[10px]"
					@click="closeVote()" />
				<p class="text-sm">
					This is to confirm that you are voting for:
					<span class="block text-lg uppercase mt-2">
						Option {{ selectedItem.id }}:
						<strong class="font-bold">{{ selectedItem.label }}</strong>
					</span>
				</p>

				<p class="text-sm mt-2 mb-4">Click the button below to submit your vote by email to the board:</p>
				<nuxt-link
					@click.prevent="openExternalLink()"
					class="rounded-sm border uppercase border-gray-500 px-4 py-2 inline-block bg-cover bg-no-repeat bg-center text-white bg-slate-700 cursor-pointer">
					Send Email Vote for {{ selectedItem.label }}
				</nuxt-link>
			</div>
		</Modal>
	</div>
</template>
<style scoped>
.renderings {
	&__list {
		flex-direction: column;
		@apply w-full flex items-center justify-center gap-8 px-2;
		@media (min-width: 600px) {
			flex-direction: row;
			align-items: flex-start;
		}
		@media (min-width: theme('screens.lg')) {
		}
	}
	&__item {
		/* max-width: 220px; */
		@apply px-0 w-full;
		@media (min-width: 600px) {
			/* flex-direction: row; */
		}
		/*@media (min-width: theme('screens.md')) {
			 max-width: 500px;
		} */
		/* @media (min-width: theme('screens.lg')) {
			max-width: 400px;
		} */
		/* @media (min-width: theme('screens.xl')) {
			max-width: 250px;
		} */
		button {
			@apply w-full;
		}
		&-caption {
			@apply px-3;
		}
		&-title {
			font-size: 16px;
			@apply uppercase tracking-wide;
		}
		&-subtitle {
			@apply uppercase;
		}
		.label {
			@apply opacity-50;
		}
		&-image {
			img {
				@apply w-1/2 h-auto;
			}
			img:first-of-type {
				@apply px-6 py-2;
			}
			@media (min-width: theme('screens.lg')) {
				max-width: 500px;
			}
		}
	}
}
</style>
