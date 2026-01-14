<script setup>
const boardCollection = useDirectusItems('board_member', {requireAuth: false});

const board = await boardCollection.list({
	fields: ['*,person.*'],
	filter: {
		status: {
			_eq: 'published',
		},
	},
	sort: 'sort',
});
</script>
<template>
	<div class="insight board w-full">
		<h1 class="w-full insight__label">Board of Directors:</h1>

		<div v-if="pending">Loading</div>
		<div v-if="board" class="flex flex-row items-center justify-between flex-wrap lg:flex-nowrap">
			<div v-for="(item, index) in board" :key="index" class="relative uppercase mb-4 py-6 w-1/2 sm:w-1/3 lg:w-auto">
				<h5 class="insight__subtitle">{{ item.title }}</h5>
				<h2 class="insight__title">
					{{ item.person.first_name }}
					<br />
					{{ item.person.last_name }}
				</h2>
				<p>{{ item.icon }}</p>
				<p class="text-xs hidden">
					<span>Appointed:</span>
					{{ getFriendlyDate(item.start) }}
					<span>Expires:</span>
					{{ getFriendlyDate(item.finish) }}
				</p>
			</div>
		</div>

		<div v-if="error">Error</div>
	</div>
</template>
<style>
@reference "~/assets/css/tailwind.css";
.board {
	height: auto;
	@media (min-width: theme('screens.lg')) {
		min-height: auto !important;
	}
	.insight__title {
		font-size: 22px;
		background: linear-gradient(75deg, var(--pink), var(--purple));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		@apply font-bold leading-5;
	}
	.insight__subtitle {
		@apply mb-0;
	}
}
</style>
