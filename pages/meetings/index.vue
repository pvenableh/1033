<template>
	<div class="relative w-full min-h-screen flex items-center justify-start flex-col meetings">
		<div class="w-full max-w-7xl flex items-center justify-start flex-col flex-wrap">
			<h2 class="page__content-title">Board Meetings</h2>
			<div v-if="pending">Loading</div>
			<div v-if="pastMeetings">
				<MeetingsCard v-for="(item, index) in pastMeetings" :key="index" :meeting="item" />
			</div>
			<div v-if="error">Error</div>
		</div>
	</div>
</template>

<script setup>
definePageMeta({
	layout: 'auth',
	middleware: ['auth'],
});

const {
	data: meetings,
	pending,
	error,
} = await useAsyncData('meetings', () => {
	return useDirectus(
		readItems('meetings', {
			fields: [
				'id,status,title,category,description,date,time,files.directus_files_id.id,files.directus_files_id.tags,files.directus_files_id.description,files.directus_files_id.title,url,presentations.*,people.people_id.unit.units_id.number,people.people_id.board_member.status,people.people_id.first_name,people.people_id.last_name,people.people_id.email,people.people_id.board_member.title,people.people_id.board_member.start,people.people_id.board_member.finish,people.people_id.board_member.person',
			],
			sort: '-date',
		}),
	);
});

const pastMeetings = computed(() => {
	if (meetings) {
		return meetings.value.filter((meeting) => {
			return new Date(meeting.date) < new Date();
		});
	} else {
		return [];
	}
});

const futureMeetings = computed(() => {
	if (meetings) {
		return meetings.value.filter((meeting) => {
			return new Date(meeting.date) >= new Date();
		});
	} else {
		return [];
	}
});
</script>
<style></style>
