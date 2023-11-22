<script setup>
const props = defineProps({
	pet: {
		type: Object,
		default: null,
	},
});

const icon = computed(() => {
	if (!props.pet.image && props.pet.category === 'Dog') {
		return 'i-ph-dog';
	} else {
		return (
			'https://ui-avatars.com/api/?name=' +
			user.value?.first_name +
			' ' +
			user.value?.last_name +
			'&background=eeeeee&color=00bfff'
		);
	}
});
</script>
<template>
	<div class="flex flex-row mb-2 pet">
		<div v-if="pet.image" class="w-20 h-20 bg-no-repeat bg-center bg-contain bg-black pet__image"
			:style="'background-image: url(https://admin.1033lenox.com/assets/' + pet.image + '?key=medium)'"></div>
		<div v-else class="w-10 h-10 rounded-full flex items-center justify-center pet__icon">
			<UIcon :name="icon" />
		</div>
		<div class="text-xs uppercase ml-4 pl-2 pet__stats">
			<h3 class="uppercase tracking-wide">
				<span class="opacity-50">{{ pet.category }}:</span>
				{{ pet.name }}
			</h3>
			<h5 v-if="pet.breed" class="uppercase tracking-wide">
				<span class="opacity-50">Breed:</span>
				{{ pet.breed }}
			</h5>
		</div>
	</div>
</template>
<style >
.pet {
	height: auto;

	&__icon {
		color: var(--cyan);
		background: rgba(80, 80, 80, 0.15);

	}
}
</style>
