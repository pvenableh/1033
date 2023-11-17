<template>
	<div id="mobile-toolbar" class="mobile-toolbar flex flex-row items-center justify-center">
		<nuxt-link to="/">
			<UIcon name="i-heroicons-home-modern" />
			<h5>Home</h5>
		</nuxt-link>
		<nuxt-link to="/account">
			<UIcon name="i-heroicons-identification" />
			<h5>Account</h5>
		</nuxt-link>
		<div class="indicator">
			<span></span>
		</div>
	</div>
</template>
<script setup></script>
<style scoped>
.mobile-toolbar {
	position: fixed;
	bottom: 0px;
	left: 0px;
	width: 100%;
	height: 50px;
	background: #eeeeee;
	border-top: solid 1px rgba(55, 55, 55, 0.05);
	padding-right: 33.333333%;
	overflow: hidden;
	box-shadow: -1px 2px 10px rgba(0, 0, 0, 0.15);
	z-index: 10;

	/* @media (min-width: theme('screens.lg')) {
		display: none;
	} */

	a {
		width: 50%;
		height: 50px;
		border-right: thin solid var(--white);
		@apply relative flex flex-col items-center justify-center;

		svg {
			height: 20px;
			width: auto;
			margin-top: 2px;
			transition: 0.25s var(--curve);

			path {
				fill: var(--grey) !important;
				transition: 0.25s var(--curve);
			}
		}

		h5 {
			font-size: 7px;
			margin-top: 2px;
			@apply uppercase tracking-widest;
		}
	}

	a.router-link-exact-active {
		color: var(--blue);
		svg {
			path {
				fill: var(--blue) !important;
			}
		}
	}

	.indicator {
		z-index: 10;
		position: absolute;
		top: 0px;
		left: -0%;
		height: 2px;
		width: 33.333333%;
		top: -2px;
		opacity: 0;
		transition: 0.25s var(--curve);
		@apply flex items-center justify-center;

		span {
			display: block;
			width: 40px;
			height: 2px;
			background: var(--blue);

			@media (min-width: theme('screens.sm')) {
				width: 60px;
			}
		}
	}
}

.mobile-toolbar a:nth-of-type(1).router-link-exact-active ~ .indicator {
	left: 0%;
	top: 0px;
	opacity: 1;
}

.mobile-toolbar a:nth-of-type(2).router-link-exact-active ~ .indicator {
	left: 33.333333%;
	top: 0px;
	opacity: 1;
}

.mobile-toolbar a:nth-of-type(3).router-link-exact-active ~ .indicator {
	left: 53%;
	top: 0px;
	opacity: 1;
}

.mobile-toolbar a:nth-of-type(4).router-link-exact-active ~ .indicator {
	left: 60%;
	top: 0px;
	opacity: 1;
}
</style>
