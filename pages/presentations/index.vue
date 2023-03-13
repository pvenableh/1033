<template>
  <div
    class="relative w-full min-h-screen flex items-center justify-center flex-col px-4 md:px-12 presentations"
  >
    <div class="w-full flex items-center justify-center flex-row flex-wrap">
      <nuxt-link
        v-for="(item, index) in presentations"
        :key="index"
        :href="'/presentations/' + item.url"
      >
        {{ item.title }}
      </nuxt-link>
    </div>
  </div>
</template>

<script setup>
const { getItems } = useDirectusItems()
const presentations = await getItems({
  collection: 'presentations',
  params: {
    fields: ['title,description,url,slides.directus_files_id.id'],
  },
})
</script>
<style >
</style>
