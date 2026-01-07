<template>
	<div class="w-full flex flex-col md:flex-row people-calculator">
		<p v-if="people.length" class="w-full md:w-1/2 tracking-wide">
			<span class="opacity-50">Attendance:</span>
			{{ people.length }} Including
			<span v-if="boardMembers.length">{{ boardMembers.length }} Board Members</span>
		</p>

		<div class="w-full mt-2 md:mt-0 md:w-1/2 flex items-end md:justify-end flex-row">
			<Tooltip
				v-for="(person, index) in boardMembers"
				:key="index"
				:text="person.first_name + ' ' + person.last_name + ': ' + person.board_member[0].title">
				<UAvatar
					size="xs"
					chip-color="primary"
					:src="
						'https://ui-avatars.com/api/?name=' +
						person.first_name +
						'-' +
						person.last_name +
						'&background=eeeeee&color=66666'
					"
					class="shadow -ml-1 transition-all hover:scale-125 hover:z-30"
					:alt="person.first_name + ' ' + person.last_name" />
			</UTooltip>

			<Tooltip
				v-for="(person, index) in nonBoardMembers"
				:key="index"
				:text="person.first_name + ' ' + person.last_name">
				<UAvatar
					size="xs"
					:src="
						'https://ui-avatars.com/api/?name=' +
						person.first_name +
						'-' +
						person.last_name +
						'&background=eeeeee&color=66666'
					"
					class="shadow -ml-1 transition-all hover:scale-125 hover:z-30"
					:alt="person.first_name + ' ' + person.last_name" />
			</UTooltip>
		</div>
	</div>
</template>
<script setup>
const props = defineProps({
	people: {
		type: Array,
		default: [],
	},
	date: {
		type: String,
		default: '',
	},
});
const nonBoardMembers = ref([]);
const boardMembers = ref([]);
onMounted(() => {
	props.people.filter((person) => {
		if (person.people_id.board_member.length) {
			person.people_id.board_member.filter((member) => {
				const finish = new Date(member.finish);
				const meeting = new Date(props.date);
				if (finish.getTime() > meeting.getTime()) {
					boardMembers.value.push(person.people_id);
				} else {
					nonBoardMembers.value.push(person.people_id);
				}
			});
		} else {
			nonBoardMembers.value.push(person.people_id);
		}
	});
});

const vendors = computed(() => {
	return props.people.filter((person) => {
		if (person.people_id.category === 'Vendor') {
			return person.people_id;
		} else {
			return false;
		}
	});
});
</script>
<style>
.people-calculator {
	font-size: 0.8rem;
	color: #666;
	font-size: 10px;
}
</style>
