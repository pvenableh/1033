<template>
    <div class="flex flex-col lg:flex-row lg:flex-wrap meeting-card">
        <div class="w-full mb-4 meeting-card__title">
            <h2 class="tracking-wide">{{ formattedDate }} @ {{ formattedTime }}</h2>
            <h4 class="tracking-wide"><span class="opacity-50">{{ meeting.category }} Location: </span> Community Room</h4>
        </div>
        <MeetingsPeopleCalculator v-if="meeting.people.length" :people="meeting.people" :date="meeting.date"  />

        <div class="w-full flex items-start mt-4 justify-start">
            <a class="mr-4 button" :href="'https://admin.1033lenox.com/assets/' + agenda" v-if="agenda"
                target="_blank">Agenda</a>
            <a class="button" :href="'https://admin.1033lenox.com/assets/' + minutes" v-if="minutes"
                target="_blank">Minutes</a>
        </div>
    </div>
</template>
<script setup>

const props = defineProps({
    meeting: {
        type: Object,
        default: {},
    },
})


const minutes = computed(() => {
    if (props.meeting.files.length) {
        return props.meeting.files.filter((file) => {
            return file.directus_files_id.tags.includes('Minutes')
        }).map((file) => {
            return file.directus_files_id.id
        }).join(', ')
    } else {
        return false
    }
})

const agenda = computed(() => {
    if (props.meeting.files.length) {
        return props.meeting.files.filter((file) => {
            return file.directus_files_id.tags.includes('Agenda')
        }).map((file) => {
            return file.directus_files_id.id
        }).join(', ')
    } else {
        return false
    }
})

const formattedDate = computed(() => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const [year, month, day] = props.meeting.date.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('en-US', options);
});
const formattedTime = computed(() => {
    const [hour, minute] = props.meeting.time.split(':')
    const newTime = new Date();
    newTime.setHours(hour);
    newTime.setMinutes(minute);
    return newTime.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: 'numeric'
    });
})
</script>
<style>
.meeting-card {

    width: 100%;
    max-width: 800px;
    @apply uppercase p-6 mb-8 ;
    h4 {
        font-size: 10px;
    }
    a {

        background: var(--lightGrey);
        @apply text-xs px-6 py-2 tracking-wide;
    }
    &__title {
        border-bottom: thin solid rgba(0,0,0,0.25);
        @apply pb-4;
    }
}
</style>
