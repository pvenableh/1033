<template>
  <div class="max-w-3xl px-6 py-12 mx-auto space-y-8">
    <NuxtLink
      class="flex items-center font-bold text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
      to="/"
    >
      <span class="mr-2 text-xl">←</span>
      Back to Home Page
    </NuxtLink>

    <div class="relative pt-48 pb-10 overflow-hidden shadow-xl rounded-2xl">
    
      <div class="absolute inset-0 bg-primary-500 mix-blend-multiply" />
      <div
        class="absolute inset-0 bg-gradient-to-t from-primary-600 via-primary-600 opacity-80"
      />
      <div class="relative px-8">
        <div class="relative text-lg font-medium text-white md:flex-grow mb-6">
          <h1 class="text-6xl font-thin tracking-wider uppercase"><span class="opacity-50">Unit: </span>{{ unit.number }}</h1>
        </div>
        <div class="w-full flex flex-col ">
          <div v-for="(person, index) in unit.people" class="w-full flex flex-col my-4">
            <h3 class="font-thin tracking-wider uppercase text-white"> {{ person.people_id.first_name }} {{ person.people_id.last_name }}</h3>
            <h5 class="text-white">{{ person.people_id.email }}</h5>
            <h5 class="text-white">{{ person.people_id.phone }}</h5>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { getItems } = useDirectusItems()
const { fileUrl } = useFiles()

const { params, path } = useRoute()


const unitReq = await getItems({
  collection: 'units',
  params: {
    filter: {
      url: {
        _eq: params.unit,
      },
    },
    fields: [
      '*, people.people_id.*',
    ],
    limit: 1,
  },
})

const unit = ref(unitReq[0])
useHead({
  title: unit.value.number,
})
</script>
