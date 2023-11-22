<script setup>
const { user } = useDirectusAuth();

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

const attendance = computed(() => {
	let count = 0;

	meetings.value.forEach((meeting) => {
		meeting.people.forEach((person) => {
			if (person.people_id.email === user.value.email) {
				count++;
			}
		});
	});

	return count;
});

function formatDate(date) {
	if (date) {
		const options = { year: 'numeric', month: 'long', day: 'numeric' };
		const [year, month, day] = date.split('-');
		return new Date(year, month - 1, day).toLocaleDateString('en-US', options);
	}
}

function formatTime(time) {
	if (time) {
		const [hour, minute] = time.split(':');
		const newTime = new Date();
		newTime.setHours(hour);
		newTime.setMinutes(minute);
		return newTime.toLocaleTimeString('en-US', {
			hour12: true,
			hour: 'numeric',
			minute: 'numeric',
		});
	}
}

function minutes(files) {
	if (files.length) {
		return files
			.filter((file) => {
				if (file.directus_files_id.tags.length) {
					return file.directus_files_id.tags.includes('Minutes');
				} else {
					return false;
				}
			})
			.map((file) => {
				return file.directus_files_id.id;
			})
			.join(', ');
	} else {
		return false;
	}
}
</script>
<template>
	<div class="insight meetings">
		<h1 class="relative insight__label">
			Board Meetings:
			<UBadge size="xs" color="sky" :ui="{ rounded: 'rounded-full' }" class="absolute top-[-10px] scale-90">
				{{ pastMeetings.length }}
			</UBadge>
		</h1>

		<div v-if="pending">Loading</div>
		<div v-if="futureMeetings.length">
			<div class="w-full my-4 next-meeting">
				<h2 class="uppercase tracking-wide">
					Next Meeting is:
					<span class="font-bold">
						{{ formatDate(futureMeetings[0].date) }}
						<span v-if="futureMeetings[0].time">@ {{ formatTime(futureMeetings[0].time) }}</span>
					</span>
				</h2>
				<h4 class="insight__subtitle mb-0">
					<span class="opacity-50">Location:</span>
					<span v-if="futureMeetings[0].location">{{ futureMeetings[0].location }}</span>
					<span v-else>Community Room</span>
				</h4>
			</div>
		</div>
		<div v-if="pastMeetings" class="w-full" :class="{ 'mt-4': !futureMeetings.length }">
			<p class="font-handwritten">
				You have attended
				<span class="font-bold">{{ attendance }}</span>
				out of
				<span class="font-bold">{{ pastMeetings.length }}</span>
				meetings.
			</p>
			<h1 class="insight__label mt-6 mb-4">Recent Meetings:</h1>
			<div v-for="(item, index) in pastMeetings.slice(0, 5)" :key="index" class="relative uppercase mb-8">
				<h4 class="uppercase font-bold tracking-wide">
					{{ formatDate(item.date) }}
					<span v-if="item.time">@ {{ formatTime(item.time) }}</span>
				</h4>
				<a
					class="absolute right-0 top-0 insight__button"
					v-if="minutes(item.files)"
					:href="'https://admin.1033lenox.com/assets/' + minutes(item.files)"
					target="_blank"
				>
					Minutes
				</a>
				<MeetingsPeopleCalculator v-if="item.people.length" :people="item.people" :date="item.date" class="mt-0" />
			</div>
		</div>
		<div class="w-full flex items-center justify-center mt-8">
			<nuxt-link to="/meetings/" class="insight__link">
				View All Meetings
				<UIcon name="i-heroicons-arrow-right" />
			</nuxt-link>
		</div>
		<div v-if="error">Error</div>
	</div>
</template>
<style>
.next-meeting {
	background: #159957;
	/* fallback for old browsers */
	background: -webkit-linear-gradient(to right, #159957, #155799);
	/* Chrome 10-25, Safari 5.1-6 */
	background: linear-gradient(to right, #159957, #155799);
	@apply text-white p-4 font-bold;

	h2 {
		/* @apply bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-900; */
	}

	.insight__subtitle {
		margin-bottom: 0em;
	}
}
</style>
