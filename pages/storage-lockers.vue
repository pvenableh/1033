<script setup>
useSeoMeta({
	title: 'Storage Lockers Vote - 1033 Lenox',
});

const analytics = useAnalytics();

import confetti from 'canvas-confetti';
const toast = useToast();

const VOTE_DEADLINE = 'Monday September 28th, 2026 at 11:59PM EST';

// Directus asset IDs, from the Storage Lockers folder
const IMAGES = {
	rendering: 'b2a911c2-ed65-4698-81c9-4616138e209e',
	locker: 'fc12d1b5-7ad5-4566-bfcf-18a84c79eb82',
};

// Photos of the room from a past clean-out. Order and spans are tuned so the
// grid packs with no gaps: 2 columns on mobile (10 cells), 3 from sm up (9 cells).
const beforePhotos = [
	{
		id: 'bb172d1b-1aed-49ab-9765-6661751dfe27',
		caption: 'A car transmission, carried out of the storage room',
		class: 'col-span-2 row-span-2',
		featured: true,
	},
	{id: 'ba49c187-9f4c-40b3-a49d-be872f1aba0f', caption: 'Chairs, bins, furniture and bags piled wall to wall'},
	{id: '30b08aed-9903-4e5d-9ca6-23697323bd85', caption: 'Bikes, lamps, rugs and boxes stacked to the pipes'},
	{id: '60e91496-6e56-4059-8443-fd516494f6ad', caption: 'A toilet and chemical jugs buried in the pile'},
	{id: 'c7c3e98f-03a2-43d4-b15c-d7e104f5c976', caption: 'Unmarked boxes, paint cans and trash bags'},
	{
		id: '18d0799f-fba0-4a0e-967d-1e2b78f1be8c',
		caption: 'Tangled bikes and water-damaged boxes',
		class: 'col-span-2 sm:col-span-1',
	},
];

const UNITS = 28;
const COST_PER_UNIT = 320;

const facts = [
	{label: 'Units, one locker each', value: UNITS},
	{label: 'Locker size (W × D × H)', value: '36″ × 36″ × 45″'},
	{label: 'Storage per unit', value: '~34 cu ft'},
	{label: 'One-time assessment per unit*', value: `~$${COST_PER_UNIT}`},
];

const problems = [
	{
		title: 'No assigned space',
		body: 'The room is shared with no record of what belongs to whom, so a few items can take over space meant for everyone.',
	},
	{
		title: 'Floor markings only go so far',
		body: 'We tried outlined floor spaces for all 28 units. Without walls or doors, items drifted beyond their spaces and were hard to keep in place.',
	},
	{
		title: 'Unclaimed items and safety',
		body: 'Past clean-outs turned up broken bikes, old furniture, a toilet, chemicals, and even a car transmission. Unclaimed items are a fire, pest, and liability concern for every owner.',
	},
	{
		title: 'Nothing is secure',
		body: 'Anything stored today is open to anyone with access to the room, so many residents choose not to use it at all.',
	},
];

const benefits = [
	{
		icon: 'i-heroicons-lock-closed',
		title: 'Secure & private',
		body: 'Every unit gets its own lockable, see-through wire locker. Only you have the key.',
	},
	{
		icon: 'i-heroicons-scale',
		title: 'Fair to all 28 units',
		body: 'The same space for every apartment - no first-come, first-served, no one spilling into your area.',
	},
	{
		icon: 'i-heroicons-sun',
		title: 'Room for beach life',
		body: 'Beach chairs, a cooler, luggage, tools, holiday decorations - out of your one-bedroom and into storage.',
	},
	{
		icon: 'i-heroicons-arrow-trending-up',
		title: 'Adds value',
		body: 'After major investment into our building, dedicated storage is an amenity buyers and renters in Miami Beach look for.',
	},
];

// Floor plan layouts traced from the architect's drawing, in feet.
// Each locker footprint is 3′ × 3′ and holds two stacked 45″ lockers.
const ROOM = {w: 18 + 4 / 12, h: 17.5};
const layouts = [
	{
		id: 'A',
		title: 'Perimeter',
		lockers: [
			...[0, 1, 2].map((i) => ({x: 4.7 + i * 2.95, y: 0})),
			...[0, 1, 2, 3].map((i) => ({x: 0, y: 5.46 + i * 2.95})),
			...[0, 1, 2, 3, 4].map((i) => ({x: 15.39, y: 2.46 + i * 2.95})),
			...[0, 1].map((i) => ({x: 6.23 + i * 2.95, y: 14.5})),
		],
		shelf: null,
	},
	{
		id: 'B',
		title: 'Center island',
		lockers: [
			...[0, 1, 2, 3].map((i) => ({x: 0, y: 5.4 + i * 2.95})),
			...[0, 1, 2, 3, 4].map((i) => ({x: 15.4, y: 2.46 + i * 2.95})),
			{x: 7.69, y: 8.4},
			...[0, 1].flatMap((i) => [
				{x: 6.2 + i * 2.95, y: 11.4},
				{x: 6.2 + i * 2.95, y: 14.35},
			]),
		],
		shelf: {x: 4.3, y: 0.05, w: 9.8, h: 0.95, label: 'Building wall storage'},
	},
];

const options = [
	{
		id: 'yes',
		title: 'Yes - Install Lockers',
		short: 'YES',
		summary: 'Install 14 double storage lockers, one secure locker for every unit.',
		cost: `Paid through a one-time assessment of about $${COST_PER_UNIT} per unit, including installation.`,
		bar: `~$${COST_PER_UNIT} assessment`,
		bullets: ['One locker per unit', 'Locked & secure', `~$${COST_PER_UNIT} one-time assessment`],
		body: `I vote YES to install secure storage lockers in the 1033 Lenox storage room, one for each of the ${UNITS} units, funded by a one-time assessment of about $${COST_PER_UNIT} per unit.`,
	},
	{
		id: 'no',
		title: 'No - Divide Without Lockers',
		short: 'NO',
		summary: 'Divide the room into marked floor spaces for each unit, with no lockers or doors.',
		cost: 'No locker assessment.',
		bar: 'No lockers',
		bullets: ['Marked floor space per unit', 'Open & unsecured', 'No locker assessment'],
		body: 'I vote NO on installing storage lockers. The storage room should be divided into spaces for each unit without lockers.',
	},
];

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
const unitNumber = ref('');

// Units 201-214 and 301-314
const UNIT_NUMBERS = [2, 3].flatMap((floor) => Array.from({length: 14}, (_, i) => String(floor * 100 + i + 1)));

const isValidUnit = computed(() => UNIT_NUMBERS.includes(unitNumber.value));

// Units matching what's been typed so far; hidden until typing starts and once a unit is chosen
const unitSuggestions = computed(() => {
	if (!unitNumber.value || isValidUnit.value) return [];
	return UNIT_NUMBERS.filter((unit) => unit.startsWith(unitNumber.value));
});

function onUnitInput(event) {
	// Digits only, and never more than a unit number's three
	const digits = event.target.value.replace(/\D/g, '').slice(0, 3);
	unitNumber.value = digits;
	event.target.value = digits;
}

const intro = ref(null);
const voteCards = ref(null);
const introVisible = ref(true);
const voteCardsVisible = ref(false);

// The bar appears once the intro (which holds its own vote link) has scrolled
// away, and retires as soon as any sliver of the vote cards is on screen.
// Observers rather than scroll offsets: the app layout scrolls an inner element
// on some screens, so there is no single scroll position to watch.
const showVoteBar = computed(() => !introVisible.value && !voteCardsVisible.value);

let observer;

onMounted(() => {
	observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (entry.target === intro.value) introVisible.value = entry.isIntersecting;
			if (entry.target === voteCards.value) voteCardsVisible.value = entry.isIntersecting;
		}
	});
	if (intro.value) observer.observe(intro.value);
	if (voteCards.value) observer.observe(voteCards.value);
});

onBeforeUnmount(() => observer?.disconnect());

function openVote(item) {
	if (item.id === 'yes') launchConfetti();
	selectedItem.value = item;
	isVoteOpen.value = true;

	analytics.trackEvent('vote_button_click', {
		item_id: item.id,
		item_title: item.title,
		vote_category: 'storage_lockers',
	});
}

function closeVote() {
	isVoteOpen.value = false;
	selectedItem.value = {};
}

function startConfetti(duration = 7000) {
	const end = Date.now() + duration;
	const colors = ['#00bfff', '#0ef62d', '#e8fc00', '#ffcc00', '#ff005c', '#ff00cc', '#502989'];

	function frame() {
		confetti({particleCount: 6, angle: 60, spread: 55, origin: {x: 0}, colors});
		confetti({particleCount: 3, angle: 120, spread: 55, origin: {x: 1}, colors});

		if (Date.now() < end) {
			requestAnimationFrame(frame);
		}
	}

	frame();
}

const mailtoLink = computed(() => {
	if (!selectedItem.value?.id) return '';

	const unit = unitNumber.value;
	const subject = `1033 Lenox Storage Locker Vote: ${selectedItem.value.short} - Unit ${unit}`;
	const body = `${selectedItem.value.body}\n\nUnit: ${unit}\n\nPlease let me know if you need any additional information.`;

	return `mailto:lenoxplazaboard@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

function openExternalLink() {
	if (!isValidUnit.value) return;

	analytics.trackEvent('vote_email_created', {
		item_id: selectedItem.value.id,
		item_title: selectedItem.value.title,
		submission_method: 'email',
		vote_category: 'storage_lockers',
	});
	analytics.trackConversion('vote_submitted', 1, {
		vote_category: 'storage_lockers',
		item_title: selectedItem.value.title,
	});

	window.open(mailtoLink.value, '_blank');
	toast.add({
		title: 'Success',
		description: 'Email created successfully',
		color: 'green',
		timeout: 8000,
	});
	closeVote();
	startConfetti();
}

// Full-size photo viewer, stepping through the before photos in order
const photoIndex = ref(null);
const isPhotoOpen = computed({
	get: () => photoIndex.value !== null,
	set: (open) => {
		if (!open) photoIndex.value = null;
	},
});
const activePhoto = computed(() => (photoIndex.value === null ? null : beforePhotos[photoIndex.value]));

function openPhoto(index) {
	photoIndex.value = index;
}

function stepPhoto(delta) {
	if (photoIndex.value === null) return;
	photoIndex.value = (photoIndex.value + delta + beforePhotos.length) % beforePhotos.length;
}

function onPhotoKeydown(event) {
	if (event.key === 'ArrowRight') stepPhoto(1);
	if (event.key === 'ArrowLeft') stepPhoto(-1);
}

watch(isPhotoOpen, (open) => {
	if (open) window.addEventListener('keydown', onPhotoKeydown);
	else window.removeEventListener('keydown', onPhotoKeydown);
});

onBeforeUnmount(() => window.removeEventListener('keydown', onPhotoKeydown));

function assetUrl(id, key = 'large-png') {
	return `https://admin.1033lenox.com/assets/${id}${key ? `?key=${key}` : ''}`;
}
</script>
<template>
	<div class="flex items-center justify-center flex-col w-full pb-28 lockers">
		<!-- Intro -->
		<div ref="intro" class="w-full max-w-[720px] px-4 lockers__intro">
			<p class="uppercase tracking-[0.2em] text-[11px] font-bold text-center mt-10 lg:mt-12 opacity-60">
				Community Vote
			</p>
			<h1 class="text-2xl sm:text-4xl uppercase font-bold text-center mt-2 mb-4">Storage Room Lockers</h1>
			<p class="text-center text-[15px] leading-6 opacity-90">
				Our storage room is an asset. It's time to reopen it — but let's work together to get it done right. We're asking every
				owner to review the proposal: lockers that keep the room organized, your belongings secure, and the setup fair to all. Installation would be funded by a one-time assessment of about
				${{ COST_PER_UNIT }} per unit that includes tax, shipping and installation.
			</p>
			<p class="text-center text-[15px] leading-6 opacity-90 mt-3">Below you'll find the options and a link to cast your vote.</p>
			<p class="w-full mt-6 text-[14px] leading-5 text-center">
				Please note that your vote is due by:
				<span class="block font-bold text-red-600 dark:text-red-400">{{ VOTE_DEADLINE }}</span>
			</p>
			<div class="flex justify-center mt-6">
				<UButton color="gray" variant="outline" :ui="{rounded: 'rounded-sm'}" class="tracking-wide text-[12px] uppercase" to="#vote">
					<UIcon name="i-material-symbols-how-to-vote-sharp" class="h-4 w-4 mr-1" />
					Skip to the vote
				</UButton>
			</div>
		</div>

		<!-- The problem -->
		<section class="w-full max-w-[1000px] px-4 mt-14">
			<h2 class="lockers__heading">Why the room needs a system</h2>
			<p class="lockers__lede">
				Photos from a past clean-out show what builds up in a shared room with no assigned space.
			</p>
			<div class="grid grid-cols-2 sm:grid-cols-3 auto-rows-[150px] sm:auto-rows-[210px] gap-2 mt-6">
				<button
					v-for="(photo, index) in beforePhotos"
					:key="photo.id"
					type="button"
					:aria-label="`View full size: ${photo.caption}`"
					class="relative block overflow-hidden rounded-sm shadow-lg group text-left cursor-zoom-in lockers__photo"
					:class="photo.class"
					@click="openPhoto(index)">
					<img
						:src="assetUrl(photo.id, photo.featured ? 'large-png' : 'medium-png')"
						:alt="photo.caption"
						loading="lazy"
						class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						:class="photo.featured ? 'object-[center_20%]' : ''" />
					<span
						class="absolute inset-x-0 bottom-0 px-3 pt-8 pb-2 text-white leading-4 bg-gradient-to-t from-black/80 to-transparent"
						:class="photo.featured ? 'text-[14px] font-bold' : 'text-[11px]'">
						{{ photo.caption }}
					</span>
				</button>
			</div>
			<p class="text-[12px] text-center mt-2 opacity-60">Tap any photo to view it full size.</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
				<div v-for="item in problems" :key="item.title" class="glass-card rounded-sm p-5">
					<h3 class="font-bold uppercase tracking-wide text-[13px] mb-2 flex items-center gap-2">
						<UIcon name="i-heroicons-light-bulb" class="h-4 w-4 shrink-0" />
						{{ item.title }}
					</h3>
					<p class="text-[14px] leading-5 opacity-90">{{ item.body }}</p>
				</div>
			</div>
		</section>

		<!-- The proposal -->
		<section class="w-full max-w-[1000px] px-4 mt-16">
			<h2 class="lockers__heading">The proposal</h2>
			<p class="lockers__lede">
				Replace the open floor with 14 double-stacked wire storage lockers - 28 lockers total, one assigned to each unit.
			</p>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
				<div v-for="fact in facts" :key="fact.label" class="glass-card rounded-sm p-4 text-center">
					<div class="text-xl sm:text-2xl font-bold">{{ fact.value }}</div>
					<div class="uppercase tracking-wide text-[10px] mt-1 opacity-60">{{ fact.label }}</div>
				</div>
			</div>
			<p class="text-[12px] mt-4 mb-2 opacity-60 text-center">
				*Estimate includes $30-$35 per unit for installation. The final assessment amount will be confirmed before ordering.
			</p>

			<div v-if="IMAGES.locker" class="glass-card rounded-sm p-5 mt-10 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-center">
				<img :src="assetUrl(IMAGES.locker, 'medium-png')" alt="Uline double wire storage locker" class="w-full max-w-[200px] mx-auto" />
				<div>
					<h3 class="font-bold uppercase tracking-wide text-[13px] mb-2">The locker</h3>
					<p class="text-[14px] leading-5 opacity-90">
						A commercial-grade Uline wire double locker: a 36″ × 36″ footprint, 90″ tall, split into two separately locking 45″
						compartments. Each unit gets one compartment - room for a shop vac, bins, luggage or beach gear. The open mesh keeps
						air moving and lets anyone see at a glance that nothing hazardous is being stored.
					</p>
				</div>
			</div>

			<figure v-if="IMAGES.rendering" class="mt-8 max-w-[720px] mx-auto">
				<img :src="assetUrl(IMAGES.rendering)" alt="Rendering of the storage room with wire lockers installed" class="w-full rounded-sm shadow-lg" />
				<figcaption class="text-[12px] text-center mt-2 opacity-60">Concept rendering for reference.</figcaption>
			</figure>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
				<div v-for="item in benefits" :key="item.title" class="glass-card rounded-sm p-5">
					<h3 class="font-bold uppercase tracking-wide text-[13px] mb-2 flex items-center gap-2">
						<UIcon :name="item.icon" class="h-4 w-4 shrink-0" />
						{{ item.title }}
					</h3>
					<p class="text-[14px] leading-5 opacity-90">{{ item.body }}</p>
				</div>
			</div>
		</section>

		<!-- Floor plans -->
		<section class="w-full max-w-[1000px] px-4 mt-16">
			<h2 class="lockers__heading">Layout options</h2>
			<p class="lockers__lede">
				The room is 18′ 4″ wide by 17′ 6″ long. Both layouts fit all 28 lockers with clear aisles; the board will choose the final
				arrangement with the installer.
			</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
				<div v-for="layout in layouts" :key="layout.id" class="glass-card rounded-sm p-5">
					<h3 class="uppercase tracking-wide text-[13px] mb-3 text-center">
						<span class="opacity-50">Layout {{ layout.id }}:</span>
						<span class="font-bold">{{ layout.title }}</span>
					</h3>
					<svg
						:viewBox="`-1.2 -0.6 ${ROOM.w + 1.8} ${ROOM.h + 1.4}`"
						class="w-full h-auto lockers__plan"
						role="img"
						:aria-label="`Floor plan layout ${layout.id}: ${layout.lockers.length} locker footprints`">
						<rect x="0" y="0" :width="ROOM.w" :height="ROOM.h" class="lockers__plan-room" />
						<!-- door -->
						<rect x="-0.25" y="0.3" width="0.25" height="2.9" class="lockers__plan-door" />
						<text x="-0.5" y="1.75" class="lockers__plan-label" text-anchor="middle" transform="rotate(-90 -0.5 1.75)">DOOR</text>
						<g v-if="layout.shelf">
							<rect :x="layout.shelf.x" :y="layout.shelf.y" :width="layout.shelf.w" :height="layout.shelf.h" class="lockers__plan-shelf" />
							<text :x="layout.shelf.x + layout.shelf.w / 2" :y="layout.shelf.y + 0.62" class="lockers__plan-label" text-anchor="middle">
								{{ layout.shelf.label.toUpperCase() }}
							</text>
						</g>
						<rect
							v-for="(locker, i) in layout.lockers"
							:key="i"
							:x="locker.x"
							:y="locker.y"
							width="2.95"
							height="2.95"
							class="lockers__plan-locker" />
						<text :x="ROOM.w / 2" :y="ROOM.h + 0.7" class="lockers__plan-label" text-anchor="middle">18′ 4″</text>
					</svg>
					<p class="text-[12px] text-center mt-2 opacity-60">
						{{ layout.lockers.length }} footprints × 2 stacked lockers = {{ layout.lockers.length * 2 }} lockers
					</p>
				</div>
			</div>
		</section>

		<!-- Vote -->
		<section id="vote" class="w-full max-w-[1000px] px-4 mt-16 scroll-mt-20">
			<h2 class="lockers__heading">
				<UIcon name="i-material-symbols-how-to-vote-sharp" class="h-6 w-6 -mb-1" />
				Submit your vote
			</h2>
			<ul class="w-full list-disc list-inside text-left text-[14px] leading-5 max-w-[420px] mx-auto mt-4">
				<li class="mb-2"><strong class="font-bold">Select</strong> Yes or No below</li>
				<li class="mb-2"><strong class="font-bold">Add</strong> your unit number</li>
				<li>
					<strong class="font-bold">Submit</strong>
					your vote to open a new email with your choice that you can send directly to the board.
				</li>
			</ul>

			<div ref="voteCards" class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 max-w-[760px] mx-auto">
				<div
					v-for="item in options"
					:key="item.id"
					class="glass-card rounded-sm p-6 flex flex-col items-center text-center"
					:class="item.id === 'yes' ? 'lockers__option--yes' : ''">
					<h3 class="uppercase tracking-wide text-[20px] font-bold">{{ item.title }}</h3>
					<p class="text-[14px] leading-5 mt-2 opacity-90">{{ item.summary }}</p>
					<p class="text-[13px] leading-5 mt-2 font-bold" :class="item.id === 'yes' ? '' : 'opacity-70'">{{ item.cost }}</p>
					<div class="flex flex-wrap justify-center gap-1.5 my-4">
						<span
							v-for="bullet in item.bullets"
							:key="bullet"
							class="uppercase text-[10px] tracking-wide rounded-full border font-bold px-3 py-1 opacity-60"
							style="border-color: #999999">
							{{ bullet }}
						</span>
					</div>
					<UButton
						color="gray"
						variant="outline"
						:ui="{rounded: 'rounded-sm'}"
						class="mt-auto w-full tracking-wide uppercase text-[13px] justify-center"
						@click="openVote(item)">
						Vote&nbsp;<span style="font-weight: 600 !important">{{ item.short }}</span>
					</UButton>
				</div>
			</div>
			<p class="text-[13px] leading-5 text-center mt-8 opacity-70 max-w-[520px] mx-auto">
				You can also reply to the announcement email with your vote. Questions or problems? Contact the board before the deadline so we
				can help.
			</p>
		</section>

		<Transition name="lockers-bar">
			<div v-show="showVoteBar" class="lockers__bar glass-surface">
				<div class="w-full max-w-[760px] mx-auto flex items-center gap-3 px-3 py-3">
					<p class="hidden sm:block text-[12px] uppercase tracking-wide font-bold opacity-60 shrink-0">Your vote</p>
					<div class="flex-1 grid grid-cols-2 gap-2">
						<UButton
							v-for="item in options"
							:key="item.id"
							color="gray"
							variant="outline"
							:ui="{rounded: 'rounded-sm'}"
							class="w-full justify-center text-center"
							@click="openVote(item)">
							<span class="flex flex-col items-center gap-[3px] leading-none">
								<span class="uppercase tracking-wide text-[13px] font-bold leading-none">Vote {{ item.short }}</span>
								<span class="text-[10px] uppercase tracking-wide leading-none opacity-70">{{ item.bar }}</span>
							</span>
						</UButton>
					</div>
				</div>
			</div>
		</Transition>

		<Modal
			v-model="isPhotoOpen"
			class="max-w-5xl w-[calc(100%-2rem)] p-0 gap-0 border-0 bg-black text-white overflow-hidden sm:rounded-sm">
			<figure v-if="activePhoto" class="relative">
				<img
					:key="activePhoto.id"
					:src="assetUrl(activePhoto.id, 'large-png')"
					:alt="activePhoto.caption"
					class="block w-full max-h-[80vh] object-contain bg-black" />
				<button
					type="button"
					aria-label="Previous photo"
					class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 p-2"
					@click="stepPhoto(-1)">
					<UIcon name="i-heroicons-chevron-left" class="h-5 w-5 block" />
				</button>
				<button
					type="button"
					aria-label="Next photo"
					class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 p-2"
					@click="stepPhoto(1)">
					<UIcon name="i-heroicons-chevron-right" class="h-5 w-5 block" />
				</button>
				<figcaption class="flex items-center justify-between gap-4 px-4 py-3 text-[13px] leading-5">
					<span>{{ activePhoto.caption }}</span>
					<span class="shrink-0 opacity-60">{{ photoIndex + 1 }} / {{ beforePhotos.length }}</span>
				</figcaption>
			</figure>
		</Modal>

		<Modal v-model="isVoteOpen">
			<div class="lockers__modal py-8 px-6 text-center relative dark:bg-white dark:text-gray-900">
				<p class="text-sm">
					This is to confirm that you are voting:
					<strong class="block text-lg uppercase mt-2 font-bold">{{ selectedItem.title }}</strong>
				</p>
				<p v-if="selectedItem.id === 'yes'" class="text-sm mt-3 font-bold">
					This includes a one-time assessment of about ${{ COST_PER_UNIT }} per unit, including installation.
				</p>
				<label class="block text-sm mt-4 mb-1" for="unit-number">Your unit number</label>
				<input
					id="unit-number"
					:value="unitNumber"
					type="text"
					inputmode="numeric"
					autocomplete="off"
					maxlength="3"
					aria-describedby="unit-number-hint"
					class="border rounded-sm px-3 py-2 w-32 text-center bg-white text-gray-900"
					:class="isValidUnit ? 'border-green-600' : 'border-gray-400'"
					@input="onUnitInput" />
				<div v-if="unitSuggestions.length" class="flex flex-wrap justify-center gap-1.5 mt-3 max-w-[320px] mx-auto">
					<button
						v-for="unit in unitSuggestions"
						:key="unit"
						type="button"
						class="text-[13px] rounded-full border border-gray-400 px-3 py-1 hover:bg-gray-100"
						@click="unitNumber = unit">
						{{ unit }}
					</button>
				</div>
				<p id="unit-number-hint" class="text-[12px] mt-2" :class="unitNumber && !isValidUnit && !unitSuggestions.length ? 'text-red-600' : 'text-gray-500'">
					<template v-if="unitNumber && !isValidUnit && !unitSuggestions.length">Not a unit in our building.</template>
					Units 201-214 and 301-314
				</p>
				<p class="text-sm mt-4 mb-4">Click the button below to submit your vote by email to the board:</p>
				<button
					type="button"
					:disabled="!isValidUnit"
					class="rounded-sm border uppercase tracking-wide border-gray-500 px-4 py-2 inline-block cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
					@click="openExternalLink()">
					Send Email Vote:
					<span class="font-bold">{{ selectedItem.short }}</span>
				</button>
			</div>
		</Modal>
	</div>
</template>
<style scoped>
@reference "~/assets/css/tailwind.css";

/* The shared button sets its own height and padding for single-line labels;
   these two carry a second line, so give them room to breathe. */
.lockers__bar button {
	height: auto;
	padding-top: 11px;
	padding-bottom: 11px;
}

.lockers__bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 40;
	padding-bottom: env(safe-area-inset-bottom);
	border-radius: 0;
	border-left: 0;
	border-right: 0;
	border-bottom: 0;
}

.lockers-bar-enter-active,
.lockers-bar-leave-active {
	transition:
		transform 0.25s ease,
		opacity 0.25s ease;
}

.lockers-bar-enter-from,
.lockers-bar-leave-to {
	transform: translateY(100%);
	opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
	.lockers-bar-enter-active,
	.lockers-bar-leave-active {
		transition: none;
	}
}

/*
 * Body copy in Proxima Regular rather than the site's default Light. Long
 * passages at Light go thin and grey once they also carry opacity; Regular is a
 * real cut of the face, not a synthesised weight.
 */
.lockers p,
.lockers li,
.lockers figcaption,
.lockers__bar,
.lockers__modal p,
.lockers__modal label {
	font-family: 'Proxima Nova W01 Regular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.lockers__heading {
	@apply text-xl sm:text-2xl uppercase font-bold tracking-wide text-center;
}

.lockers__lede {
	@apply text-[15px] leading-6 text-center opacity-90 max-w-[640px] mx-auto mt-2;
}

/* An outline rather than an inset shadow, which would replace the drop shadow
   .glass-card gives every card. */
.lockers__option--yes {
	outline: 2px solid rgba(201, 169, 110, 0.7);
	outline-offset: -2px;
}

.lockers__plan-room {
	fill: rgba(128, 128, 128, 0.18);
	stroke: currentColor;
	stroke-width: 0.06;
}

.lockers__plan-door {
	fill: currentColor;
	opacity: 0.5;
}

.lockers__plan-shelf {
	fill: none;
	stroke: currentColor;
	stroke-width: 0.04;
	opacity: 0.6;
}

.lockers__plan-locker {
	fill: rgba(201, 169, 110, 0.45);
	stroke: currentColor;
	stroke-width: 0.05;
}

.lockers__plan-label {
	font-size: 0.5px;
	fill: currentColor;
	opacity: 0.6;
	letter-spacing: 0.02px;
}
</style>
