<script setup>
definePageMeta({
	layout: 'auth',
	middleware: ['auth'],
});

const announcementsCollection = useDirectusItems('announcements');

const announcements = await announcementsCollection.list({
	fields: ['*'],
	filter: {
		status: {
			_eq: 'sent',
		},
		date_sent: {
			_nnull: true,
		},
		private: {
			_eq: false,
		},
	},
	sort: '-date_sent',
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
	<div class="relative w-full min-h-screen flex items-center justify-start flex-col scroll-smooth">
		<h1 class="page__content-title">Announcements</h1>
		<div class="w-full flex flex-row items-start justify-center relative">
			<div class="pr-4 pl-4 lg:pl-10 w-full max-w-xl announcements">
				<div v-if="announcements" class="my-4">
					<a
						v-for="(item, index) in filteredAnnouncements"
						:key="index"
						class="relative uppercase inline-block w-full relative mb-12 announcement__card"
						:href="'https://1033lenox.com/announcements/email/' + item.url"
						target="_blank">
						<h3 class="leading-4 uppercase">
							{{ item.title }}
							<UIcon name="i-heroicons-arrow-right" class="ml-2 mb-[-2px] opacity-75" />
						</h3>
						<h5 class="text-xs opacity-75 mt-[2px] leading-4">{{ item.subtitle }}</h5>
						<p class="uppercase text-xs mt-[2px] leading-4">
							<span class="opacity-50">Sent on:</span>
							{{ getFriendlyDate(item.date_sent) }}
						</p>
					</a>
				</div>
			</div>
		</div>
	</div>
</template>

<style>
.announcement {
	&__card {
		h3 {
			@apply relative;
		}
		h3::before {
			content: '';
			background: var(--blue);
			width: 10px;
			position: absolute;
			left: -14px;
			top: 3px;
			height: 13px;
		}
	}
}
</style>
