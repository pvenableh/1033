<script setup>
const announcementsCollection = useDirectusItems('announcements', {requireAuth: false});

const announcements = await announcementsCollection.list({
	fields: ['*'],
	filter: {
		status: {
			_eq: 'sent',
		},
	},
	sort: '-date_sent',
	limit: 7,
});

const filteredAnnouncements = computed(() => {
	let possibleStrings = ['Minutes', 'Agenda', 'Board Meeting'];

	return announcements
		.map((item) => {
			if (item.tags) {
				if (!possibleStrings.some((possibleString) => item.tags.includes(possibleString))) {
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
		<h1 class="relative insight__label">
			Announcements:
			<Badge size="xs" color="sky" :ui="{rounded: 'rounded-full'}" class="absolute top-[-10px] scale-90">
				{{ announcements.length }}
			</Badge>
		</h1>

		<div v-if="pending">Loading</div>
		<div v-if="announcements" class="my-4">
			<a
				v-for="(item, index) in filteredAnnouncements"
				:key="index"
				class="relative uppercase inline-block w-full relative mb-5"
				:href="'https://1033lenox.com/announcements/email/' + item.url"
				target="_blank">
				<h3 class="leading-4 uppercase font-bold tracking-wide">
					{{ item.title }}
					<Icon name="i-heroicons-arrow-right" class="ml-2 mb-[-2px] opacity-75" />
				</h3>
				<h5 class="text-xs opacity-75 mt-[2px] leading-4">{{ item.subtitle }}</h5>
				<p class="uppercase text-xs mt-[2px] leading-4">
					<span class="opacity-50">Sent on:</span>
					{{ getFriendlyDate(item.date_sent) }}
				</p>
			</a>
		</div>
		<div class="w-full flex items-center justify-center mt-8">
			<nuxt-link to="/announcements/" class="insight__link">
				View All Announcements
				<Icon name="i-heroicons-arrow-right" />
			</nuxt-link>
		</div>
		<div v-if="error">Error</div>
	</div>
</template>
<style></style>
