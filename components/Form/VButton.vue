<template>
	<button
		:type="type"
		:class="[
			'btn',
			{
				'btn-default': variant === 'default',
				'btn-primary': variant === 'primary',
				'btn-outline': variant === 'outline',
				'btn-danger': variant === 'danger',
			},
		]"
	>
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
	background: var(--black) !important;
	@apply text-white inline-flex  border-transparent  items-center justify-center px-6 py-2 tracking-widest font-body uppercase shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:hover:scale-95 transition ease-in-out duration-150;
}
.btn-default {
}
.btn-primary {
}
.btn-outline {
}
.btn-danger {
}
</style>
