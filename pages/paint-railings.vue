<script setup>
// definePageMeta({
// 	layout: 'email',
// });

const { readItems } = useDirectusItems();

const renderings = await readItems('renderings', {
	fields: ['*'],
});

const selectedItem = ref({});
const selectedImage = ref({});
const isOpen = ref(false);
const isVoteOpen = ref(false);

function toggleModal(image) {
	if (isOpen.value) {
		isOpen.value = false;
		selectedImage.value = {};
	} else {
		isOpen.value = true;
		selectedImage.value = image;
	}
}

function toggleVote(item) {
	if (isVoteOpen.value) {
		isVoteOpen.value = false;
		selectedItem.value = {};
	} else {
		isVoteOpen.value = true;
		selectedItem.value = item;
	}
}

const mailtoLink = computed(() => {
	if (selectedItem?.value) {
		const encodedSubject = `1033 Lenox Design Vote: ${selectedItem.value.title}`;

		const encodedBody = `I submit my vote of ${selectedItem.value.title} for the design of the building. Please let me know if you need any additional information.`;

		return `mailto:huestudios.com@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;
	} else {
		return '';
	}
});
</script>
<template>
	<div class="flex items-center justify-center flex-col w-full renderings">
		<div class="w-full mb-12 renderings__intro">
			<h1 class="text-3xl lg:text-5xl uppercase font-bold text-center mt-6 mb-6 lg:mt-12">Paint and Railings</h1>

			<div class="w-full px-6 max-w-[1000px] flex items-start justify-start flex-col">
				<h3 class="uppercase tracking-wide font-bold text-[20px] leading-6">📈 Our Goal:</h3>
				<p>
					Focus on the return on our investment with the 40 YR construction. We want to increase property values, rental
					rates, lower insurance, increase longevity, and create an overall better living experience.
				</p>
			</div>
			<div class="w-full px-6 max-w-[1000px] flex items-start justify-start flex-col mt-6">
				<h3 class="uppercase tracking-wide font-bold text-[20px] leading-6">🗳️ Your Vote:</h3>
				<p class="">
					View the rendered design options below with the various color schemes. After review, submit your vote before
					Friday May 31st, 2024.
				</p>
			</div>
		</div>
		<UModal v-model="isOpen" fullscreen>
			<div class="w-full h-full flex items-center justify-center flex-col p-2 lg:p-12 relative" @click="isOpen = false">
				<UIcon name="i-heroicons-x-circle" class="cursor-pointer h-8 w-8 absolute shadow-lg right-[10px] top-[10px]" />
				<h5 class="w-full uppercase font-bold mt-3 leading-4 max-w-[1200px]">
					<span class="opacity-50">DESIGN:</span>
					{{ selectedImage.title }}
				</h5>
				<div class="w-full flex flex-row items-center justify-between">
					<p class="w-full uppercase text-[10px] mb-1 leading-4 max-w-[1200px]">
						<span class="opacity-50">Building Color:</span>
						{{ selectedImage.building_color }}
						<span class="opacity-50 inline-block ml-3">Railing COLOR:</span>
						{{ selectedImage.railings_color }}
						<span class="opacity-50 inline-block ml-3">Gate Color:</span>
						{{ selectedImage.gate_color }}
					</p>
					<p class="lg:w-1/2 text-right uppercase text-[10px] mb-1 leading-4 max-w-[1200px] text-red-500">
						<span class="inline-block ml-3">Extra Cost:</span>
						{{ selectedImage.extra_cost }}
					</p>
				</div>
				<img
					:src="'https://admin.1033lenox.com/assets/' + selectedImage.image + '?key=large'"
					alt="1033 Lenox Design Rendering"
					class="w-full h-auto max-w-[1200px]"
				/>
			</div>
		</UModal>
		<div
			v-for="(item, index) in renderings"
			:key="index"
			class="flex items-center justify-center flex-col lg:items-start lg:flex-row w-full mb-20 renderings__item"
		>
			<div class="w-full lg:w-1/2 max-w-[500px] relative cursor-pointer" @click="toggleModal(item)">
				<img
					:src="'https://admin.1033lenox.com/assets/' + item.image + '?key=medium'"
					:alt="item.title"
					class="w-full"
				/>
				<UIcon
					name="i-heroicons-magnifying-glass-plus"
					class="text-white cursor-pointer h-8 w-8 absolute shadow-lg right-[10px] top-[10px]"
				/>
			</div>
			<div class="w-full flex items-start justify-start flex-col max-w-[500px] lg:pl-6 renderings__item-caption">
				<h3 class="w-full mt-2 lg:mt-0 renderings__item-title">
					<span class="label">Design:</span>
					{{ item.title }}
				</h3>
				<ul class="list-disc ml-6 uppercase my-2 text-sm font-bold">
					<li class="renderings__item-subtitle">
						<span class="label">Building Color:</span>
						{{ item.building_color }}
					</li>
					<li class="renderings__item-subtitle">
						<span class="label">Railing Color:</span>
						{{ item.railings_color }}
					</li>
					<li class="renderings__item-subtitle">
						<span class="label">Gate Color:</span>
						{{ item.gate_color }}
					</li>
					<li v-if="item.cost" class="renderings__item-subtitle">
						<span class="label">Cost:</span>
						${{ item.cost }}
						<span class="opacity-50">per unit</span>
					</li>
					<li v-if="item.extra_cost" class="text-red-500 renderings__item-subtitle">
						<span class="">Extra Cost:</span>
						{{ item.extra_cost }}
						<span class="">per unit</span>
					</li>
				</ul>
				<UButton color="sky" class="mt-2 lg:mt-5 tracking-wide" @click="toggleVote(item)">
					Vote for {{ item.title }}
				</UButton>
			</div>
		</div>
		<UModal v-model="isVoteOpen">
			<div class="py-8 px-6 relative">
				<UIcon
					name="i-heroicons-x-circle"
					class="cursor-pointer h-6 w-6 absolute right-[10px] top-[10px]"
					@click="toggleVote()"
				/>
				<h3 class="uppercase font-bold mb-2">Submit Your Vote!</h3>
				<p class="text-sm">
					This is to confirm that you are voting for
					<strong>{{ selectedItem.title }}</strong>
					which includes:
				</p>
				<ul class="list-disc ml-6 uppercase my-2 text-sm font-bold">
					<li>
						<span class="opacity-50">Building Color:</span>
						{{ selectedItem.building_color }}
					</li>
					<li>
						<span class="opacity-50">Railing Color:</span>
						{{ selectedItem.railings_color }}
					</li>
					<li>
						<span class="opacity-50">Gate Color:</span>
						{{ selectedItem.gate_color }}
					</li>
				</ul>
				<p v-if="selectedItem.cost" class="text-sm mb-2">
					The cost is ${{ selectedItem.cost }} per unit
					<span v-if="!selectedItem.extra_cost">.</span>
					<span v-else class="text-red-500">plus {{ selectedItem.extra_cost }}.</span>
				</p>
				<p v-else class="text-sm mb-2">
					The cost is
					<span class="text-red-500">{{ selectedItem.extra_cost }}.</span>
				</p>
				<p class="text-sm mb-4">Click the button below to send your vote by email to the board.</p>
				<UButton :to="mailtoLink" color="sky" class="tracking-wide">
					Send Email Vote for {{ selectedItem.title }}
				</UButton>
			</div>
		</UModal>
	</div>
</template>
<style scoped>
.renderings {
	&__item {
		@apply px-4;
		&-caption {
		}
		&-title {
			border-bottom: thin solid rgba(0, 0, 0, 0.25);
			font-size: 22px;
			@apply uppercase tracking-wide;
		}
		&-subtitle {
			@apply uppercase;
		}
		.label {
			@apply opacity-50;
		}
	}
}
</style>
