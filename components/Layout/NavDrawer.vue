<template>
	<div class="flex items-center justify-center flex-col nav-drawer">
		<div class="w-full nav-drawer__menu-box p-4 relative">
			<!-- <XIcon class="cursor-pointer h-8 heroicon-sw-1.2 close-btn" /> -->
			<Icon color="var(--white)" class="lenox-icon"/>
			<ul class="w-full nav-drawer__menu outline-0 text-center">
				<li class="outline-0"><nuxt-link to="/">Home</nuxt-link></li>
				<li>
					<nuxt-link to="/meetings/">Meetings</nuxt-link>
				</li>
				<li>
					<nuxt-link to="/announcements/">Announcements</nuxt-link>
				</li>
				<li>
					<nuxt-link to="/projects/">Projects</nuxt-link>
				</li>
				<li>
					<nuxt-link to="/rules-regulations/">Rules / Regulations</nuxt-link>
				</li>
				<li>
					<nuxt-link to="/documents/">By-Laws</nuxt-link>
				</li>
				<li v-if="!user">
					<nuxt-link to="/auth/signin">Login</nuxt-link>
				</li>
				<li v-if="user">
					<nuxt-link to="/account/">Account</nuxt-link>
				</li>
				<li v-if="user">
					<a @click.prevent="onLogout()" class="cursor-pointer">Logout</a>
				</li>
			</ul>
		</div>
	</div>
</template>
<script setup>
import { navigateTo } from '#imports';

const { logout, user } = useDirectusAuth();

const onLogout = async () => {
	logout();
	return navigateTo('/');
};

</script>
<style>
.nav-drawer {
	min-height: 100vh;
	max-height: 100vh;
	width: 100%;
	position: fixed;
	right: 0px;
	top: 0px;
	z-index: 30;
	background: rgba(0, 0, 0, 0.75);
	/* transform: translateX(110%); */
	transition: 0.55s var(--curve);
	@apply shadow-lg max-w-md;

	.close-btn {
		/* right: 0px;
    top: 0px;
    @apply absolute; */
	}
	.lenox-icon {
		position: absolute;
		top: 25%;
		opacity: 0.05;
		filter: drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.95));
	}
	&__menu {
		li {
			transform: translateX(50px);
			opacity: 0;
			transition: 0.55s var(--curve);
			@apply my-1;

			a {
				color: var(--white);
				font-size: 13px;
				letter-spacing: 0.3em;
				@apply block uppercase py-1;
			}

			a.router-link-exact-active {
				color: var(--blue);
				letter-spacing: 0.6em;
				@apply font-bold cursor-default;
			}
		}

		a:hover {
			letter-spacing: 0.6em;
		}

		li:nth-of-type(2) {
			transition-delay: 0.075s;
		}

		li:nth-of-type(3) {
			transition-delay: 0.125s;
		}

		li:nth-of-type(4) {
			transition-delay: 0.150s;
		}

		li:nth-of-type(5) {
			transition-delay: 0.170s;
		}

		li:nth-of-type(6) {
			transition-delay: 0.180s;
		}
	}
}

.nav-drawer.opened {
	transform: translateX(0%);

	.nav-drawer__bg {
		right: 0px;
		width: 110vw;
	}

	.nav-drawer__menu {
		li {
			transform: translateX(0px);
			opacity: 1;
			@apply my-1;
		}
	}
}
</style>
