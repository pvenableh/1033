<script setup>
import { openScreen } from '~~/composables/useScreen';

function sideMenuToggle() {
	// const element = document.getElementById('nav-btn')
	// element.classList.toggle('open')
	const navToggle = document.getElementById('nav-drawer-toggle');
	navToggle.checked = !navToggle.checked;
	openScreen();
}
</script>
<template>
	<div id="nav-btn" @click.prevent="sideMenuToggle()">
		<div id="nav-icon">
			<span></span>
			<span></span>
			<span></span>
		</div>
	</div>
</template>
<style scoped>
#nav-btn {
	bottom: 0px;
	right: 0px;
	z-index: 40;
	display: block;
	position: fixed;
	background: none;
	width: 33.333333%;
	text-align: center;
	cursor: pointer;
	transition: 0.475s var(--curve);
	height: 65px;
	@media (min-width: theme('screens.sm')) {
		/* right: 35px; */
	}

	/* @media (min-width: 1280px) {
    margin-right: 0px;
  } */
	#nav-icon {
		width: 45px;
		height: 65px;
		position: relative;
		margin: 0px auto 0px;
		transform: rotate(0deg);
		cursor: pointer;
		@media (min-width: theme('screens.lg')) {
			/* margin: 16px auto; */
			width: 50px;
		}

		span {
			display: block;
			position: absolute;
			height: 1px;
			width: 100%;

			border-radius: 2px;
			opacity: 1;
			left: 0;
			transform: rotate(0deg);
			transition: 0.25s var(--curve);
			@apply bg-gray-700 dark:bg-gray-400;
		}

		span:nth-child(1) {
			top: 28px;
			/* transform-origin: left center;

			@media (min-width: theme('screens.lg')) {
				top: 9px;
			} */
		}

		span:nth-child(2) {
			top: 25px;
			transform-origin: left center;
			display: none;
		}

		span:nth-child(3) {
			top: 36px;
			transform-origin: left center;
			/*
			@media (min-width: theme('screens.lg')) {
				top: 22px;
			} */
		}
	}
}

#nav-btn.open {
	/* width: 230px; */
	top: 200px;
	right: -10px;
	/* transform: rotate(-360deg); */
	opacity: 0;

	@media (min-width: theme('screens.lg')) {
	}

	#nav-icon {
		width: 55px;

		span {
			background: var(--white);
		}

		/* span:nth-child(1) {
      transform: rotate(40deg);
      top: 1px;
      left: 8px;
      width: 80%;
      @media (min-width: theme('screens.lg')) {
        top: 0;
        width: 100%;
      }
    } */

		span:nth-child(2) {
			width: 0;
			opacity: 0;
		}

		/* span:nth-child(3) {
      transform: rotate(-40deg);
      top: 32px;
      left: 8px;
      width: 80%;
      @media (min-width: theme('screens.lg')) {
        top: 35px;
        width: 100%;
      }
    } */
	}
}
</style>
