<template>
	<div class="relative w-full min-h-screen flex items-center justify-start flex-col">
		<h1 class="w-full uppercase tracking-wider mt-6 mb-6 pb-2 text-center border-b max-w-2xl">
			Garbage Room Reminders
		</h1>

		<div class="w-full max-w-2xl px-6 rule">
			<div v-html="page[0].description"></div>
		</div>
	</div>
</template>

<script setup>
useSeoMeta({
	title: 'Garbage Room Reminders - 1033 Lenox',
});

const rulesCollection = useDirectusItems('rules', {requireAuth: false});

const page = await rulesCollection.list({
	fields: ['*'],
	limit: 1,
	filter: {
		url: {
			_eq: 'trash-recycling',
		},
	},
});
</script>
<style>
@reference "~/assets/css/tailwind.css";
.rule {
	@media (min-width: theme('screens.lg')) {
	}
	strong {
		@apply font-bold;
	}

	h1 {
		font-size: 24px;
		letter-spacing: 0.05em;
		@apply pt-10 mt-10 uppercase font-bold;
	}

	h2 {
		font-size: 20px;
		text-decoration: none !important;
		letter-spacing: 0.05em;
		@apply mt-6 uppercase font-bold;
	}

	h3 {
		font-size: 16px;
		text-decoration: none !important;
		letter-spacing: 0.05em;
		@apply mt-6 uppercase font-bold;
	}

	p {
		line-height: 1.4em;
		@apply my-3;
	}

	ol,
	ul {
		@apply ml-8;
		list-style-type: disc;

		li {
			line-height: 1.4em;
			@apply pl-2 my-3;
		}
	}

	ol {
		list-style-type: decimal;
	}

	a {
		text-decoration: underline;
		color: var(--blue);
	}
}

h1 {
	@media (min-width: theme('screens.md')) {
		max-width: 400px;
	}
}
</style>
