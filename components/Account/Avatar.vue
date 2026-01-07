<script setup>
import { UiAvatar } from '~/components/ui/avatar'

const {user} = useDirectusAuth();

const props = defineProps({
	chip: {
		type: Boolean,
		default: false,
	},
	text: {
		type: String,
		default: '',
	},
	size: {
		type: String,
		default: 'sm',
	},
});

const avatar = computed(() => {
	if (user.value.avatar) {
		return 'https://admin.1033lenox.com/assets/' + user.value.avatar + '?key=medium';
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
	<div v-if="user" class="flex items-center justify-center mr-2 border rounded-full border-gray-300">
		<UiAvatar
			v-if="chip"
			chip
			chip-color="sky"
			:chip-text="text"
			chip-position="top-right"
			:size="size"
			:src="avatar"
			:alt="user?.first_name + ' ' + user?.last_name" />
		<UiAvatar v-else :size="size" :src="avatar" :alt="user?.first_name + ' ' + user?.last_name" />
	</div>
	<div v-else class="scale-75 sm:scale-100 absolute inline-block right-[10px] sm:pr-1 md:px-6">
		<UiAvatar :size="size" fallback="?" />
	</div>
</template>

<style></style>
