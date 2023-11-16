<script setup>
const {
	data: announcements,
	pending,
	error,
} = await useAsyncData('announcements', () => {
	return useDirectus(
		readItems('announcements', {
			fields: ['*'],
			filter: {
				status: {
					_eq: 'sent',
				},
			},
			sort: '-date_sent',
			limit: 7,
		}),
	);
});

const filteredAnnouncements = computed(() => {
	let possibleStrings = ['Minutes', 'Agenda', 'Board Meeting'];

	return announcements.value
		.map((item) => {
			if (item.tags) {
				if (!possibleStrings.some((possibleString) => item.tags.includes(possibleString))) {
					console.log(item.tags);
					return item;
				}

				return null;
			} else {
				return item;
			}
		})
		.filter(Boolean);
});
</script>
<template>
	<div class="insight announcements">
		<h1 class="relative insight__label">Announcements: <UBadge size="xs" color="sky" :ui="{ rounded: 'rounded-full' }" class="absolute top-[-10px] scale-90">{{ announcements.length }}</UBadge> </h1>

		<div v-if="pending">Loading</div>
		<div v-if="announcements" class="my-4">
			<nuxt-link v-for="(item, index) in filteredAnnouncements" :key="index" class="relative uppercase  inline-block w-full relative mb-5" :to="'/announcements/email/' + item.url">
				<h3 class="leading-4 uppercase">
					{{ item.title }} <UIcon name="i-heroicons-arrow-right" class="ml-2 mb-[-2px] opacity-75" />
				</h3>
				<h5 class="text-xs opacity-75 mt-[2px] leading-4">{{ item.subtitle }}</h5>
				<p class="uppercase text-xs mt-[2px] leading-4"><span class="opacity-50">Sent on:</span> {{  getFriendlyDate(item.date_sent) }}</p>
			</nuxt-link>
		</div>
		<div class="w-full flex items-center justify-center mt-8">
			<nuxt-link to="/announcements/" class="insight__link">View All Announcements
				<UIcon name="i-heroicons-arrow-right" />
			</nuxt-link>
		</div>
		<div v-if="error">Error</div>
	</div>
</template>
<style></style>
