<script setup>
const { gtag } = useGtag();

const renderings = ref([
	{
		id: 1,
		title: 'Light Slate',
		image: '4d4036a1-a449-47e9-bf30-78562f1b235a',
	},
	{
		id: 2,
		title: 'Dark Slate',
		image: 'dccfb63c-e9d5-45c6-8ebf-c03c41ae970f',
	},
]);

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

		gtag('event', 'click', {
			event_category: 'Image',
			event_label: image.title,
		});
	}
}

function toggleVote(item) {
	if (isVoteOpen.value) {
		isVoteOpen.value = false;
		selectedItem.value = {};
	} else {
		isVoteOpen.value = true;
		selectedItem.value = item;

		gtag('event', 'click', {
			event_category: 'Vote Button',
			event_label: item.title,
		});
	}
}

const mailtoLink = computed(() => {
	if (selectedItem?.value) {
		gtag('event', 'click', {
			event_category: 'Mailto Vote Button',
			event_label: selectedItem.value.title,
		});

		const encodedSubject = `1033 Lenox Floor Color Vote: ${selectedItem.value.title}`;

		const encodedBody = `I submit my vote of OPTION ${selectedItem.value.id}: ${selectedItem.value.title.toUpperCase()} for the color of the exterior floors. Please let me know if you need any additional information.`;

		return `mailto:lenoxplazaboard@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;
	} else {
		return '';
	}
});
</script>
<template>
	<div class="flex items-center justify-center flex-col w-full renderings">
		<div class="w-full mb-8 max-w-[500px] lg:max-w-[1000px] px-2 lg:px-0 renderings__intro">
			<h1 class="text-3xl lg:text-5xl uppercase font-bold text-center mt-10 mb-8 lg:mt-12">Exterior Floors</h1>

			<div class="w-full flex items-center justify-start flex-col mt-6 px-4 max-w-[600px]">
				<h3 class="uppercase tracking-wide font-bold text-[20px] leading-6 mb-4 text-center">🗳️ Submit Your Vote:</h3>
				<ul class="w-full list-disc list-inside text-left">
					<li class="w-full mb-2">View the options below</li>
					<li class="w-full mb-2">Select your option</li>

					<li class="w-full">
						Submit your vote from there to open a new email with your selected choice that you can send directly to the
						board.
					</li>
				</ul>
				<p class="w-full mt-6 mb-2">
					Please note that your vote it due by:
					<span class="font-bold">Tuesday December 17th, 2024 at 11:59PM EST</span>
				</p>
			</div>
		</div>
		<div class="w-full flex flex-col sm:flex-row items-center justify-center gap-8">
			<div
				v-for="(item, index) in renderings"
				:key="index"
				class="flex items-center justify-center flex-col w-full max-w-[250px] mb-8 border border-gray-200 shadow-lg renderings__item"
			>
				<div class="w-full max-w-[250px] relative">
					<img
						:src="'https://admin.1033lenox.com/assets/' + item.image + '?key=medium'"
						:alt="item.title"
						class="w-full"
					/>
				</div>
				<div class="w-full flex items-center justify-center flex-col max-w-[500px] renderings__item-caption">
					<h3 class="w-full my-6 text-center renderings__item-title">
						<span class="label">Option {{ item.id }}:</span>
						{{ item.title }}
					</h3>

					<UButton
						color="gray"
						variant="outline"
						:ui="{ rounded: 'rounded-sm' }"
						class="mb-6 tracking-wide"
						@click="toggleVote(item)"
					>
						Vote for {{ item.title }}
					</UButton>
				</div>
			</div>
		</div>
		<UModal v-model="isVoteOpen">
			<div class="py-8 px-6 text-center relative">
				<UIcon
					name="i-heroicons-x-circle"
					class="cursor-pointer h-6 w-6 absolute right-[10px] top-[10px]"
					@click="toggleVote()"
				/>
				<p class="text-sm">
					This is to confirm that you are voting for:
					<span class="ml-8 block text-lg uppercase mt-2">
						Option {{ selectedItem.id }}:
						<strong>{{ selectedItem.title }}</strong>
					</span>
				</p>

				<p class="text-sm mt-2 mb-4">Click the button below to submit your vote by email to the board:</p>
				<nuxt-link
					:to="mailtoLink"
					class="rounded-sm border uppercase tracking-wide border-gray-500 px-4 py-2 inline-block bg-cover bg-no-repeat bg-center text-white bg-slate-700"
					:style="'background-image: url(https://admin.1033lenox.com/assets/' + selectedItem.image + '?key=medium-png)'"
				>
					Send Email Vote for {{ selectedItem.title }}
				</nuxt-link>
			</div>
		</UModal>
	</div>
</template>
<style scoped>
.renderings {
	&__item {
		@apply px-0;
		&-caption {
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
	}
}
</style>
