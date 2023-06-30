<template>
    <div class="relative w-full min-h-screen flex items-center justify-start flex-col meetings">
        <div class="w-full max-w-7xl flex items-center justify-start flex-col flex-wrap">
            <h2 class="uppercase tracking-wide mt-12 py-6 w-full" style="max-width: 800px;">Board Meetings</h2>
            <div v-if="pending">Pending</div>
             <MeetingsCard v-if="meetings" v-for="(item, index) in meetings" :key="index" :meeting="item" />
            <div v-if="error">Error</div>
        </div>
    </div>
</template>

<script setup>
const { getItems } = useDirectusItems()

const {
  data: meetings,
  pending,
  error,
  refresh,
} = await useAsyncData('meetings', () =>
  getItems({
    collection: 'meetings',
    params: {
        fields: ['id,status,title,category,description,date,time,files.directus_files_id.id,files.directus_files_id.tags,files.directus_files_id.description,files.directus_files_id.title,url,presentations.*,people.people_id.unit.units_id.number,people.people_id.board_member.status,people.people_id.first_name,people.people_id.last_name,people.people_id.email,people.people_id.board_member.title,people.people_id.board_member.start,people.people_id.board_member.finish,people.people_id.board_member.person'],
        sort: '-date'
    }
  })
);

// const meetings = await getItems({
//     collection: 'meetings',
//     params: {
//         fields: ['id,status,title,category,description,date,time,files.directus_files_id.id,files.directus_files_id.tags,files.directus_files_id.description,files.directus_files_id.title,url,presentations.*,people.people_id.unit.units_id.number,people.people_id.board_member.status,people.people_id.first_name,people.people_id.last_name,people.people_id.email,people.people_id.board_member.title,people.people_id.board_member.start,people.people_id.board_member.finish,people.people_id.board_member.person'],
//         sort: '-date'
//     }
// })
// const members = await getItems({
//     collection: 'board_members',
//     params: {
//         fields: ['id,status,person.first_name,person.last_name,title,start,finish'],
//     }
// })
// onMounted(() => {
//     members.filter((member) => {
//         const finish = new Date(member.finish);
//         const meeting = new Date(props.date);
//         if (finish.getTime() > meeting.getTime()) {
//             boardMembers.value.push(person.people_id)
//         } else {
//             nonBoardMembers.value.push(person.people_id)
//         }
//     })
// })
</script>
<style ></style>
