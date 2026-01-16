<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

const newslettersCollection = useDirectusItems('newsletters', { requireAuth: false })

const newsletters = await newslettersCollection.list({
  fields: ['*'],
})
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Latest Newsletter</CardTitle>
          <CardDescription>Community updates and news</CardDescription>
        </div>
        <Icon name="heroicons:newspaper" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <a
        v-if="newsletters && newsletters.length > 0"
        :href="'https://1033lenox.com/newsletters/' + newsletters[0].link"
        target="_blank"
        class="relative block rounded-lg overflow-hidden bg-cover bg-center bg-no-repeat min-h-[200px]"
        style="background-image: url('https://admin.1033lenox.com/assets/bda84bff-e6e1-4bfb-ac82-f44a999d7073?key=medium');"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div class="absolute bottom-0 left-0 right-0 p-4">
          <h3 class="text-white font-bold text-xl drop-shadow-lg">
            {{ newsletters[0].title }}
          </h3>
          <span class="inline-flex items-center gap-1 text-white text-sm mt-2">
            Read Newsletter
            <Icon name="heroicons:arrow-right" class="h-4 w-4" />
          </span>
        </div>
      </a>
      <div v-else class="py-8 text-center text-muted-foreground">
        <Icon name="heroicons:newspaper" class="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p class="text-sm">No newsletters available</p>
      </div>
    </CardContent>
  </Card>
</template>
