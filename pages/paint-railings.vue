<script setup>
definePageMeta({
	layout: 'email',
});

const selectedOption = ref(null);

const renderings = ref([
	{
		id: '74d30830-73d7-40b2-a170-6cb2c76737bf',
		status: 'published',
		sort: 1,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T14:55:28.332Z',
		user_updated: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_updated: '2024-05-29T15:45:05.686Z',
		title: 'Option 1',
		building_color: 'White',
		gate_color: 'Black',
		image: 'c29bf74d-3729-4da7-bccb-31042041f12f',
		cost: '6785.71',
		extra_cost: null,
		description: null,
		railings_color: 'Black',
	},
	{
		id: '4d456884-d7b1-4dd7-94a3-48e882b3a056',
		status: 'draft',
		sort: 2,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T14:56:37.573Z',
		user_updated: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_updated: '2024-05-29T15:48:37.573Z',
		title: 'Option 2',
		building_color: 'White',
		gate_color: 'Grey',
		image: '1f2d3c26-95e1-4b1e-9030-d2cd8b7cccc9',
		cost: '6785.71',
		extra_cost: '$300 + TBD Cost to paint entry gates grey',
		description: null,
		railings_color: 'Grey',
	},
	{
		id: '9ea256b7-6db1-4270-a4ca-5ccb92a32539',
		status: 'published',
		sort: 3,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T14:57:38.193Z',
		user_updated: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_updated: '2024-05-29T15:48:43.651Z',
		title: 'Option 3',
		building_color: 'White with Grey Top',
		gate_color: 'Black',
		image: '828c98ec-91ca-4f99-831a-3efab8824175',
		cost: '6785.71',
		extra_cost: null,
		description: null,
		railings_color: 'Black',
	},
	{
		id: '1afb145f-de94-46c2-8acf-496cd05a487d',
		status: 'published',
		sort: 4,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T14:57:55.031Z',
		user_updated: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_updated: '2024-05-29T15:48:49.159Z',
		title: 'Option 4',
		building_color: 'White with Grey Top',
		gate_color: 'Grey',
		image: '828c98ec-91ca-4f99-831a-3efab8824175',
		cost: '6785.71',
		extra_cost: '$300 + TBD Cost to paint entry gates grey',
		description: null,
		railings_color: 'Grey',
	},
	{
		id: 'b802c4a3-31ef-48db-adc3-489acfbdba74',
		status: 'published',
		sort: 5,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T14:59:41.793Z',
		user_updated: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_updated: '2024-05-29T15:49:16.813Z',
		title: 'Option 5',
		building_color: 'White with Grey Top and Bottom',
		gate_color: 'Black',
		image: '828c98ec-91ca-4f99-831a-3efab8824175',
		cost: '6785.71',
		extra_cost: null,
		description: null,
		railings_color: 'Black',
	},
	{
		id: 'f9f38c66-9d4b-4a4a-a659-a98eaf80f815',
		status: 'published',
		sort: 6,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T14:59:04.510Z',
		user_updated: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_updated: '2024-05-29T15:49:41.298Z',
		title: 'Option 6',
		building_color: 'White with Grey Top and Bottom',
		gate_color: 'Grey',
		image: 'ae20f7fd-4fae-4ab4-9387-6c8c38f3750c',
		cost: '6785.71',
		extra_cost: '$300 + TBD Cost to paint entry gates grey',
		description: null,
		railings_color: 'Grey',
	},
	{
		id: '026324ab-6149-440a-9a64-46762044c4d1',
		status: 'published',
		sort: 7,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T15:43:20.852Z',
		user_updated: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_updated: '2024-05-29T15:50:20.638Z',
		title: 'Option 9',
		building_color: 'White with Grey Top and Bottom',
		gate_color: 'Black',
		image: '0a71c613-effa-4d30-82d1-ede7c370133f',
		cost: '6785.71',
		extra_cost: ' $12,500 - $14,000/unit for glass railings',
		description: null,
		railings_color: 'Glass',
	},
	{
		id: 'cb400f0f-c287-4eb3-a09b-ef17d2ce3c28',
		status: 'draft',
		sort: 8,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T15:51:40.927Z',
		user_updated: null,
		date_updated: null,
		title: 'Option 8',
		building_color: 'White with Grey Top',
		gate_color: 'Black',
		image: '6811b678-d53f-468d-b2a9-be5a00600a68',
		cost: '6785.71',
		extra_cost: ' $12,500 - $14,000/unit for glass railings',
		description: null,
		railings_color: 'Glass',
	},
	{
		id: '6c90f419-8ba0-4f1f-a8c1-45c9652dc5cb',
		status: 'draft',
		sort: 9,
		user_created: '7c04ac8d-9a56-47da-b66d-7c5044268252',
		date_created: '2024-05-29T15:51:02.464Z',
		user_updated: null,
		date_updated: null,
		title: 'Option 7',
		building_color: 'White',
		gate_color: 'Black',
		image: '99fcff7d-9177-4fd8-a37d-f90a3f0b5cf0',
		cost: '6785.71',
		extra_cost: ' $12,500 - $14,000/unit for glass railings',
		description: null,
		railings_color: 'Glass',
	},
]);

const selectedImage = ref('');
const isOpen = ref(false);

function toggleModal(image) {
	if (isOpen.value) {
		isOpen.value = false;
		selectedImage.value = '';
	} else {
		isOpen.value = true;
		selectedImage.value = '/images/' + image;
	}
}
</script>
<template>
	<div class="flex items-center justify-center flex-col renderings">
		<UModal v-model="isOpen">
			<img :src="selectedImage" alt="1033 Lenox Design Rendering" />
		</UModal>
		<div
			v-for="(item, index) in renderings"
			:key="index"
			class="flex items-center justify-center flex-col md:flex-row renderings__item"
		>
			<div class="w-full md:w-1/2 max-w-[450px] cursor-pointer" @click="toggleModal('OPT-1A.jpg')">
				<img src="/images/OPT-1A.jpg" :alt="item.title" class="w-full" />
			</div>
			<div class="w-full md:pl-6 renderings__item-caption">
				<h3 class="renderings__item-title">
					<span class="label">Design:</span>
					{{ item.title }}
				</h3>
				<h4 class="renderings__item-subtitle">
					<span class="label">Building Color:</span>
					{{ item.building_color }}
				</h4>
				<h4 class="renderings__item-subtitle">
					<span class="label">Railing Color:</span>
					{{ item.railings_color }}
				</h4>
				<h4 class="renderings__item-subtitle">
					<span class="label">Gate Color:</span>
					{{ item.gate_color }}
				</h4>
				<h4 class="renderings__item-subtitle">
					<span class="label">Cost:</span>
					${{ item.cost }} / unit
				</h4>
				<h4 v-if="item.extra_cost" class="renderings__item-subtitle">
					<span class="label">Extra Cost:</span>
					{{ item.extra_cost }}
				</h4>
				<UButton @click="selectedOption = item">Select {{ item.title }}</UButton>
			</div>
		</div>

		<!-- <Ballot :option="selectedOption" /> -->
	</div>
</template>
<style scoped>
.renderings {
	&__item {
		@apply px-4;
		&-caption {
		}
		&-title {
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
