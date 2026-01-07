<template>
	<button
		:type="type"
		class="relative overflow-hidden p-px"
		:class="[
			'btn',
			{
				'btn-default': variant === 'default',
				'btn-primary': variant === 'primary',
				'btn-outline': variant === 'outline',
				'btn-danger': variant === 'danger',
				'btn-bronze': variant === 'bronze',
			},
		]">
		<div class="foreground">
			<slot />
		</div>
		<div v-if="glow" class="glow inset-0 w-[60px] h-[60px] absolute"></div>
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
	glow: {
		type: Boolean,
		default: true,
	},
});
</script>

<style>
.glow {
	animation: move 4s linear infinite;
	offset-path: rect(0% auto 100% auto);
	background: radial-gradient(#00ffed, var(--cyan), transparent);
	background: linear-gradient(#00ffed, var(--cyan), transparent);
}

@keyframes move {
	0% {
		offset-distance: 0%;
	}

	100% {
		offset-distance: 100%;
		/* transform: rotate(720deg); */
	}
}

.btn {
	/* background: var(--black); */
	@apply text-white inline-flex border-transparent items-center justify-center tracking-wider font-sans uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:hover:scale-95 transition ease-in-out duration-150 rounded relative;
	.background {
		@apply block absolute rounded-sm z-10 px-6 py-2 w-full h-full;
	}
	.foreground {
		@apply block rounded-sm z-10 relative px-6 py-2 w-full h-full;
		background-color: var(--theme-button-bg, #6b7280);
	}
}

.btn-default {
}

.btn-primary {
}

.btn-outline {
	.foreground {
		background-color: var(--theme-bg-secondary, #f3f4f6);
		color: var(--theme-text-primary, #111827);
	}
}

.btn-danger {
}

.btn-bronze {
	.glow {
		animation: move 4s linear infinite;
		offset-path: rect(0% auto 100% auto);
		background: radial-gradient(#b08d57, #9c7a3c, transparent);
	}
	.background {
		background: linear-gradient(45deg, #171311 0%, #9c7a3c 50%, #231815 100%);
	}
	.foreground {
		background: linear-gradient(45deg, #2c1810 0%, #925e3c 50%, #4a3425 100%);
		box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
		background: linear-gradient(45deg, #2c1810 0%, #925e3c 50%, #4a3425 100%);
		background: linear-gradient(45deg, #2c1810 0%, #cd7f32 50%, #533d32 100%);
		background: linear-gradient(45deg, #3d2b1f 0%, #b08d57 50%, #614e3c 100%);
		background: linear-gradient(45deg, #392e28 0%, #9c7a3c 50%, #50382c 100%);
		background: linear-gradient(45deg, rgb(23, 19, 17) 0%, #9c7a3c 50%, #231815 100%);
		background: rgba(23, 19, 17, 0.5);
	}
}
</style>
