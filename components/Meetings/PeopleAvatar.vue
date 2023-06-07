<template>
    <div class="w-full inline-block people-calculator">
        <p v-if="people.length">Total Attendance: {{ people.length }} </p>
        <UAvatarGroup v-if="people.length" size="xs" :max="20">
            <UAvatar v-for="(person, index) in people"
            chip-color='primary' :key="index" :src="'https://ui-avatars.com/api/?name=' + person.people_id.first_name + '-' + person.people_id.last_name + '&background=random'"
                :alt="person.people_id.first_name + ' ' + person.people_id.last_name" />
       
        </UAvatarGroup>
        <p v-if="boardMembers.length"><span>{{ boardMembers.length
        }}</span> Board Members</p>
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
    }
})
const boardMembers = ref([])
onMounted(() => {
    props.people.filter((person) => {
        if (person.people_id.board_member.length) {
            person.people_id.board_member.filter((member) => {
                const finish = new Date(member.finish);
                const meeting = new Date(props.date);


                if (finish.getTime() > meeting.getTime()) {
                    boardMembers.value.push(person.people_id)
                }
            })
        }
    })
})

function findBoardMember(email) {
    boardMembers.value.some((person) => person.email === email);
    console.log(boardMembers.value.some((person) => person.email === email))
}


const vendors = computed(() => {
    return props.people.filter((person) => {
        if (person.people_id.category === 'Vendor') {
            return person.people_id
        } else {
            return false
        }
    })
})

</script>
<style>
.people-calculator {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.5rem;
}
</style>
