<script setup>
const props = defineProps({
	user: {
		type: Object,
		default: null,
	},
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
	if (props.user.avatar) {
		return 'https://admin.1033lenox.com/assets/' + props.user.avatar + '?key=medium';
	} else {
		return (
			'https://ui-avatars.com/api/?name=' +
			props.user?.first_name +
			' ' +
			props.user?.last_name +
			'&background=eeeeee&color=00bfff'
		);
	}
});
</script>
<template>
	<UAvatar
		v-if="chip"
		chip-color="sky"
		:chip-text="text"
		chip-position="top-right"
		size="sm"
		:src="avatar"
		:alt="user?.first_name + ' ' + user?.last_name"
	/>
	<UAvatar v-else size="sm" :src="avatar" :alt="user?.first_name + ' ' + user?.last_name" />
</template>

<style></style>
