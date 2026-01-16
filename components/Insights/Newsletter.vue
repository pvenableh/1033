<script setup>
const newslettersCollection = useDirectusItems('newsletters', {requireAuth: false});

const newsletters = await newslettersCollection.list({
	fields: ['*'],
});
</script>
<template>
	<div class="insight newsletter">
		<h1 class="insight__label">Latest Newsletter:</h1>
		<a
			v-if="newsletters"
			class="relative uppercase mb-4 inline-block w-full p-6 newsletter__cover"
			:href="'https://1033lenox.com/newsletters/' + newsletters[0].link"
			target="_blank"
			style="
				background-image: url('https://admin.1033lenox.com/assets/bda84bff-e6e1-4bfb-ac82-f44a999d7073?key=medium');
			">
			<h3 class="uppercase newsletter__title">
				{{ newsletters[0].title }}
			</h3>
			<span class="absolute bottom-[10px] right-[10px] newsletter__link">
				Read Newsletter
				<UIcon name="i-heroicons-arrow-right" class="ml-2 mb-[-3px] opacity-75" />
			</span>
		</a>
	</div>
</template>
<style>
@reference "~/assets/css/tailwind.css";

.newsletter__cover {
	@apply bg-no-repeat bg-center bg-cover h-full;
}

.newsletter__title {
	color: var(--white);
	font-size: 6vw;
	line-height: 1em;
	text-shadow: 2px 2px #ff0000;
	@apply tracking-wide;
}

.newsletter__link {
	color: var(--white);
	text-shadow: 2px 2px #ff0000;
	@apply font-bold tracking-wider;
}
</style>
