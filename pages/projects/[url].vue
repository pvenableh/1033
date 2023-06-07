<template>
  <div
    class="w-full flex items-start justify-center flex-col lg:flex-row relative project"
  >
    <div
      class="w-full flex flex-col items-start justify-center lg:sticky project__info"
    >
      {{ project }}
      <!-- <h4 class="w-auto" :class="'bg-' + getFirstWord(project.service.name)">
        {{ project.service.name }}
      </h4>
      <h1 class="uppercase tracking-widest cursor-pointer" @click="editProject">
        <span class="opacity-50">Project: </span>{{ project.title }}
      </h1>
      <p class="my-4">{{ project.description }}</p>
      <h3 class="uppercase tracking-widest">
        <span class="opacity-50">Created By: </span>
        {{ project.user.first_name }}
        {{ project.user.last_name }}
      </h3>

      <h5 class="uppercase tracking-widest">
        <span class="opacity-50">CLIENT: </span>{{ project.company.name }}
      </h5>
      <div
        class="w-full flex items-center justify-center flex-row my-4 project__info-dates"
      >
        <p class="w-1/2 uppercase" v-if="project.date_started">
          <span class="opacity-50">Date Started: </span>
         
        </p>
        <p
          v-if="project.date_completed"
          class="w-1/2 uppercase"
          :class="{ late: overdueAlert }"
        >
          <span class="opacity-50">Date completed: </span>
          
        </p>
        <p v-else class="w-1/2 uppercase" :class="{ late: overdueAlert }">
          <span class="opacity-50">Deadline: </span>
          <span v-if="dueToday">Today</span
          ><span v-else class="overdue"></span>
        </p>
      </div>
      <div
        class="w-full flex items-center justify-center flex-col project__info-events"
      >
        <p class="w-full uppercase" v-if="project.events.length">
          This project has {{ project.events.length }} event<span
            v-if="project.events.length > 1"
            >s</span
          >.
        </p>
        <p class="w-full uppercase" v-if="waitingEvents.length">
          There <span v-if="waitingEvents.length > 1">are</span
          ><span v-else>is</span>
          <span class="font-bold"
            >{{ waitingEvents.length }} event<span
              v-if="waitingEvents.length > 1"
              >s</span
            ></span
          >
          waiting for approval.
        </p>
      </div> -->

      <div class="w-full flex items-center justify-between flex-row my-4">
        <!-- <FormButton @click="editProject" label="Edit Project" width="160" /> -->
        <FormButton @click="showEventForm" label="Add Event" width="160" />
      </div>
    </div>
    <div
      class="w-full flex items-center justify-center flex-col md:mt-12 project-events"
    >
      <div
        class="w-full max-w-xl flex items-center justify-center flex-row mb-12 project-events__controls"
      ></div>
      <transition-group
        name="list"
        mode="out-in"
        tag="div"
        class="w-full flex flex-col align-middle justify-center items-center projects__completed"
      >
        <!-- <EventsEventCard
          v-for="projectEvent in filteredEvents"
          :projectEvent="projectEvent"
          :key="projectEvent.id"
        /> -->
      </transition-group>
    </div>
  </div>
</template>

<script setup>
const { params, path } = useRoute()
const { getItems } = useDirectusItems()
const projectReq = await getItems({
  collection: 'projects',
  params: {
    filter: {
      url: {
        _eq: params.url,
      },
    },
    fields: [
      'id,title,category,description,url,vendors.vendors_projects_id.vendors_id.*,events.*,documents.*',
    ],
  },
})

const project = ref(projectReq[0])
</script>
<style>
.roof {
}
</style>