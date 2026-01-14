<script setup>
const {isScrollingDown} = useScrollDirection();

const props = defineProps({
	links: {
		type: Array,
		default: () => [],
	},
});
</script>
<template>
	<div
		id="mobile-toolbar"
		class="mobile-toolbar flex flex-row items-center justify-center bg-cream  lg:hidden relative pb-safe"
		:class="{retracted: isScrollingDown}" 
		:style="{backgroundColor: 'var(--theme-header-bg)'}">
		<nuxt-link v-for="(link, index) in links" :key="index" :to="link.to">
			<UIcon :name="link.icon" />
			<h5>{{ link.name }}</h5>
		</nuxt-link>

		<LayoutNavButton />
		<div class="indicator">
			<span></span>
		</div>
	</div>
</template>

<style scoped>
@reference "~/assets/css/tailwind.css";
.mobile-toolbar {
	position: fixed;
	bottom: 0px;
	left: 0px;
	width: 100%;
	/* Fixed height for content area, padding handled by pb-safe class */
	min-height: 65px;
	/* Extend background behind the home indicator safe area */
	padding-bottom: env(safe-area-inset-bottom, 0px);

	padding-right: 33.333333%;
	background: var(--theme-footer-bg, #eeeeee);
	border-top: solid 1px var(--theme-border-light, rgba(55, 55, 55, 0.05));
	box-shadow: var(--theme-shadow-sm, -1px 2px 10px rgba(0, 0, 0, 0.05));
	overflow: hidden;
	box-shadow: -1px -2px 10px rgba(0, 0, 0, 0.1);
	z-index: 10;

	/* Smooth animation for hide/show */
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	#nav-btn {
		position: absolute;
	}
	a {
		width: 50%;
		height: 50px;
		/* border-right: thin solid var(--white); */
		@apply relative flex flex-col items-center justify-center border-r border-white dark:border-gray-700;

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

/* Retracted state - slide down off screen */
.mobile-toolbar.retracted {
	transform: translateY(calc(100% + env(safe-area-inset-bottom, 0px)));
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
