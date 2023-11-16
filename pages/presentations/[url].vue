<template>
  <div class="relative w-full presentation">
    <swiper
      :style="{
        '--swiper-navigation-color': '#fff',
        '--swiper-pagination-color': '#fff',
      }"
      :speed="600"
      :parallax="true"
      :pagination="{
        clickable: true,
      }"
      :navigation="true"
      :modules="modules"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
      class="min-h-screen mySwiper"
    >
      <swiper-slide
        v-for="(slide, index) in presentation.slides"
        :key="index"
        class="min-h-screen flex items-center justify-center bg-zinc-300"
      >
        <div class="min-h-screen flex items-center justify-center">
          <img
            :src="
              'https://admin.1033lenox.com/assets/' +
              slide.directus_files_id.id +
              '?key=large'
            "
            :alt="presentation.title + ' Presentation'"
            class="w-full h-auto shadow-lg"
          />
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup>
const { params, path } = useRoute()
const { data: presentations, pending, error } = await useAsyncData('presentations', () => {
  return useDirectus(
    readItems('presentations', {
      filter: {
      url: {
        _eq: params.url,
      },
    },
      fields: ['id,title,description,url,slides.directus_files_id.id'],
    })
  )
})

const presentation = ref(presentations[0]);

import { Swiper, SwiperSlide } from 'swiper/vue'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { Navigation, Pagination, Parallax } from 'swiper'
const modules = [Parallax, Pagination, Navigation]
</script>
<style>
.presentation {
  .swiper-button-prev,
  .swiper-button-next {
    color: #eeeeee;
  }
}
</style>