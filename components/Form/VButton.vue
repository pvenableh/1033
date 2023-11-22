<template>
	<button :type="type" :class="[
		'btn',
		{
			'btn-default': variant === 'default',
			'btn-primary': variant === 'primary',
			'btn-outline': variant === 'outline',
			'btn-danger': variant === 'danger',
		},
	]">
		<slot />
	</button>
</template>

<script setup>
const props = defineProps({
	type: {
		type: String,
		default: 'button',
	},
	variant: {
		type: String,
		default: 'default',
	},
});
</script>

<style>
/* Using Tailwind @apply so we can easily re-use these styles for other 'button' based components like VDropdown */
.btn {
	@apply inline-flex border-transparent items-center justify-center px-6 py-2 tracking-wider font-body uppercase shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:hover:scale-95 transition ease-in-out duration-150;
	display: inline-block;
	border: 0;
	color: var(--white);
	text-decoration: none;
	background-color: rgba(80, 80, 80, 0.5);
	backdrop-filter: blur(30px);
	font-size: 14px;
	cursor: pointer;
	text-transform: uppercase;
	border-radius: 1px;
}

.btn-default {}

.btn-primary {}

.btn-outline {}

.btn-danger {}
</style>
