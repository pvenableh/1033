<script setup>
const { gtag } = useGtag();

import confetti from 'canvas-confetti';
const toast = useToast();
const options = ref([
	{
		id: 1,
		title: '40YR Balance',
		description: 'Credit towards my 40YR account balance',
		image: null,
	},
	{
		id: 2,
		title: 'HOA Dues',
		description: 'Credit towards my Q2 HOA dues.',
		image: null,
	},
	{
		id: 2,
		title: 'Reserves',
		description:
			'Use towards reserves (please note unless 75% of owners decide on reserves, your vote will be moved to DEFAULT option (#1)',
		image: null,
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
		origin: { y: 0.6 },
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

		gtag('event', 'click', {
			event_category: 'Vote Button',
			event_label: item.title,
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
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

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
			origin: { x: 0 },
			colors: colors,
		});
		confetti({
			particleCount: 3,
			angle: 120,
			spread: 55,
			origin: { x: 1 },
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
		const encodedSubject = `1033 Lenox 2024 Budget Surplus Vote: ${selectedItem.value.title}`;

		const encodedBody = `I submit my vote of OPTION ${selectedItem.value.id}: ${makeUppercase(selectedItem.value.title)} for the use of the 2024 budget surplus. Please let me know if you need any additional information.`;

		gtag('event', 'click', {
			event_category: 'Mailto Vote Button',
			event_label: selectedItem.value.title,
		});

		return `mailto:lenoxplazaboard@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;
	} else {
		return '';
	}
});

function openExternalLink() {
	console.log(mailtoLink.value);
	window.open(mailtoLink.value, '_blank'); // Opens the link in a new tab
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
		<div class="w-full mb-8 max-w-[500px] lg:max-w-[1000px] px-2 lg:px-0 renderings__intro">
			<h1 class="text-3xl lg:text-5xl uppercase font-body text-center mt-10 mb-8 lg:mt-12">2024 Surplus Vote</h1>

			<div class="w-full flex items-center justify-start flex-col mt-6 px-4 max-w-[650px] mx-auto">
				<h3 class="uppercase tracking-wide font-bold text-[20px] leading-6 mb-6 text-center">
					<UIcon name="i-material-symbols-how-to-vote-sharp" class="h-6 w-6 -mb-1" />
					Submit Your Vote:
				</h3>
				<p class="w-full mt-6 mb-2 text-[14px] leading-5">
					As outlined in our Feb 4th, 2025 meeting and discussed in our Feb 24th, 2025 meeting, there is a surplus of
					$900 per unit from the 2024 budget. In the Feb 24th, 2025 meeting, it was explained that owners will be able
					to vote on how they want to utilize this $900.
				</p>

				<p class="w-full mt-6 mb-2 text-[14px] leading-5">
					Please note that your vote it due by:
					<span class="font-bold">Tuesday March 4th, 2025 at 11:59PM EST.</span>
				</p>

				<p class="w-full mt-6 mb-2 text-[14px] leading-5">
					Please note a
					<span class="font-bold text-red-500">non-vote</span>
					or
					<span class="font-bold text-red-500">late vote</span>
					defaults to
					<span class="font-bold text-red-500">Option 1 (40YR Balance)</span>
					.
				</p>
			</div>
		</div>
		<div class="pb-8 options__list">
			<div class="w-full md:w-auto flex flex-col md:flex-row items-center md:items-start justify-around gap-8">
				<div v-for="(item, index) in options" :key="index" class="options__item">
					<div class="w-full flex items-center justify-center flex-col max-w-[500px] options__item-caption">
						<h3 class="w-full mt-6 text-center leading-4 options__item-title">
							<span class="label">Option {{ item.id }}:</span>
							<span class="font-bold block">{{ item.title }}</span>
						</h3>
						<p>{{ item.description }}</p>

						<UButton
							color="gray"
							variant="outline"
							:ui="{ rounded: 'rounded-sm' }"
							class="mb-6 tracking-wide leading-4 flex flex-col text-[12px]"
							@click="toggleVote(item)"
						>
							Vote for
							<span class="font-bold block">{{ item.title }} Credit</span>
						</UButton>
					</div>
				</div>
			</div>
		</div>
		<UModal v-model="isVoteOpen">
			<div class="py-8 px-6 text-center relative">
				<UIcon
					name="i-heroicons-x-circle"
					class="cursor-pointer h-6 w-6 absolute right-[10px] top-[10px]"
					@click="closeVote()"
				/>
				<p class="text-sm">
					This is to confirm that you are voting for:
					<span class="block text-lg uppercase mt-2">
						Option {{ selectedItem.id }}:
						<strong class="font-bold">{{ selectedItem.title }}</strong>
					</span>
				</p>

				<p class="text-sm mt-2 mb-4">Click the button below to submit your vote by email to the board:</p>
				<nuxt-link
					@click.prevent="openExternalLink()"
					class="rounded-sm border uppercase tracking-wide border-gray-500 px-4 py-2 inline-block bg-cover bg-no-repeat bg-center text-white bg-slate-700 cursor-pointer"
				>
					Send Email Vote for {{ selectedItem.title }}
				</nuxt-link>
			</div>
		</UModal>
	</div>
</template>
<style scoped>
.options {
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
		max-width: 450px;
		height: 265px;
		@apply px-0 w-full relative flex flex-col  items-start justify-start border border-gray-200 shadow-lg mx-auto;
		@media (min-width: 600px) {
			/* flex-direction: row; */
		}
		@media (min-width: theme('screens.md')) {
		}
		@media (min-width: theme('screens.lg')) {
		}
		@media (min-width: theme('screens.xl')) {
		}
		button {
			@apply w-10/12 absolute bottom-0;
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
		p {
			@apply w-full mt-6 text-[14px] leading-5 mb-4 text-center md:text-left;
		}
		&-image {
			@apply w-full;
			@media (min-width: 600px) {
				flex-direction: row;
			}
			@media (min-width: theme('screens.lg')) {
				max-width: 250px;
			}
		}
	}
}
</style>
