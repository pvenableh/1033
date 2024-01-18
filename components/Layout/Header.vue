<script setup>
const previousScrollTop = ref(0);
const isRetracted = ref(false);

const manageNavBarAnimations = () => {
	const header = document.querySelector('header');
	const scrollTop = document.documentElement.scrollTop;

	if (scrollTop > previousScrollTop.value && scrollTop >= 10) {
		isRetracted.value = true;
	} else {
		isRetracted.value = false;
	}

	previousScrollTop.value = scrollTop;
};

onMounted(() => {
	window.addEventListener('scroll', manageNavBarAnimations);
});

const { user } = useDirectusAuth();

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
	<header
		class="w-full flex items-center justify-center px-4 md:px-6 sticky top-0 left-0 z-40 header"
		:class="{ retracted: isRetracted }"
	>
		<InsightsWeather class="absolute left-[5px] sm:pl-1 md:px-6 -mt-[4px]" />
		<nuxt-link to="/">
			<Logo />
		</nuxt-link>
		<nuxt-link to="/tasks" class="scale-75 sm:scale-100 absolute inline-block right-[10px] sm:pr-1 md:px-6">
			<AccountAvatar v-if="user" text="12" />
			<UAvatar v-else icon="i-heroicons-user" size="sm" />
		</nuxt-link>

		<DarkModeToggle />
	</header>
</template>

<style>
header {
	background: #eeeeee;
	border-bottom: solid 1px rgba(55, 55, 55, 0.05);
	box-shadow: -1px 2px 10px rgba(0, 0, 0, 0.05);
	transition: transform 0.25s var(--curve);
}

header.retracted {
	transform: translateY(-100px);
}

.logo {
	width: 320px;
	max-width: 380px;
	@apply px-6 py-4 lg:py-6;

	/* filter: drop-shadow(0 0.2rem 0.25rem rgba(0, 0, 0, 0.5)); */
	@media (min-width: theme('screens.sm')) {
		width: 320px;
	}

	@media (min-width: theme('screens.md')) {
		width: 380px;
	}

	path {
		opacity: 0.4;
		animation-name: logo;
		animation-duration: 5s;
		animation-timing-function: var(--curve);
		animation-iteration-count: infinite;
	}

	path:nth-of-type(1) {
		animation-delay: 0.1s;
	}

	path:nth-of-type(2) {
		animation-delay: 0.2s;
	}

	path:nth-of-type(3) {
		animation-delay: 0.3s;
	}

	path:nth-of-type(4) {
		animation-delay: 0.4s;
	}

	path:nth-of-type(5) {
		animation-delay: 0.5s;
	}

	path:nth-of-type(6) {
		animation-delay: 0.6s;
	}

	path:nth-of-type(7) {
		animation-delay: 0.7s;
	}

	path:nth-of-type(8) {
		animation-delay: 0.8s;
	}

	path:nth-of-type(9) {
		animation-delay: 0.9s;
	}

	path:nth-of-type(10) {
		animation-delay: 1s;
	}

	path:nth-of-type(11) {
		animation-delay: 1.1s;
	}

	path:nth-of-type(12) {
		animation-delay: 1.2s;
	}

	path:nth-of-type(13) {
		animation-delay: 1.3s;
	}

	path:nth-of-type(14) {
		animation-delay: 1.4s;
	}

	path:nth-of-type(15) {
		animation-delay: 1.5s;
	}

	path:nth-of-type(16) {
		animation-delay: 1.6s;
	}

	path:nth-of-type(17) {
		animation-delay: 1.7s;
	}

	path:nth-of-type(18) {
		animation-delay: 1.8s;
	}

	path:nth-of-type(19) {
		animation-delay: 1.9s;
	}

	path:nth-of-type(20) {
		animation-delay: 2s;
	}

	path:nth-of-type(21) {
		animation-delay: 2.1s;
	}

	path:nth-of-type(22) {
		animation-delay: 2.2s;
	}

	path:nth-of-type(23) {
		animation-delay: 2.3s;
	}

	path:nth-of-type(24) {
		animation-delay: 2.4s;
	}

	path:nth-of-type(25) {
		animation-delay: 2.5s;
	}

	path:nth-of-type(26) {
		animation-delay: 0.1s;
	}

	path:nth-of-type(27) {
		animation-delay: 0.2s;
	}

	path:nth-of-type(28) {
		animation-delay: 0.3s;
	}

	path:nth-of-type(29) {
		animation-delay: 0.4s;
	}

	path:nth-of-type(30) {
		animation-delay: 0.5s;
	}

	path:nth-of-type(31) {
		animation-delay: 0.6s;
	}

	path:nth-of-type(32) {
		animation-delay: 0.7s;
	}

	path:nth-of-type(33) {
		animation-delay: 0.8s;
	}

	path:nth-of-type(34) {
		animation-delay: 0.9s;
	}

	path:nth-of-type(35) {
		animation-delay: 1s;
	}

	path:nth-of-type(36) {
		animation-delay: 1.1s;
	}

	path:nth-of-type(37) {
		animation-delay: 1.2s;
	}

	path:nth-of-type(38) {
		animation-delay: 1.3s;
	}

	path:nth-of-type(39) {
		animation-delay: 1.4s;
	}

	path:nth-of-type(40) {
		animation-delay: 1.5s;
	}

	path:nth-of-type(41) {
		animation-delay: 1.6s;
	}

	path:nth-of-type(42) {
		animation-delay: 1.7s;
	}

	path:nth-of-type(43) {
		animation-delay: 1.8s;
	}

	path:nth-of-type(44) {
		animation-delay: 1.9s;
	}

	path:nth-of-type(45) {
		animation-delay: 2s;
	}

	path:nth-of-type(46) {
		animation-delay: 2.1s;
	}

	path:nth-of-type(47) {
		animation-delay: 2.2s;
	}

	path:nth-of-type(48) {
		animation-delay: 2.23s;
	}

	path:nth-of-type(49) {
		animation-delay: 2.26s;
	}

	path:nth-of-type(50) {
		animation-delay: 2.29s;
	}

	path:nth-of-type(51) {
		animation-delay: 2.32s;
	}

	path:nth-of-type(52) {
		animation-delay: 2.35s;
	}

	path:nth-of-type(53) {
		animation-delay: 2.38s;
	}

	path:nth-of-type(54) {
		animation-delay: 2.41s;
	}

	path:nth-of-type(55) {
		animation-delay: 2.44s;
	}

	path:nth-of-type(56) {
		animation-delay: 2.47s;
	}

	path:nth-of-type(57) {
		animation-delay: 2.5s;
	}
}

@keyframes logo {
	0% {
		opacity: 0.9;
		fill: #666666;
	}

	50% {
		opacity: 1;
		fill: var(--cyan);
	}

	100% {
		opacity: 0.9;
		fill: #666666;
	}
}
</style>
