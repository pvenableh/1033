<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

interface HelpItem {
  title: string
  description: string
  link?: string
  linkText?: string
}

defineProps<{
  items?: HelpItem[]
}>()

const defaultItems: HelpItem[] = [
  {
    title: "Building Management",
    description: "Contact for building-related issues.",
  },
  {
    title: "Your Landlord",
    description: "Contact for lease and unit issues.",
  },
  {
    title: "Submit a Request",
    description: "Have an issue? Let us know.",
    link: "/requests",
    linkText: "Submit Request",
  },
]
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Need Help?</CardTitle>
          <CardDescription>Contact information and support</CardDescription>
        </div>
        <Icon name="heroicons:question-mark-circle" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div
        class="grid gap-4"
        :class="{
          'grid-cols-1 md:grid-cols-2': (items || defaultItems).length === 2,
          'grid-cols-1 md:grid-cols-3': (items || defaultItems).length >= 3,
          'grid-cols-1': (items || defaultItems).length === 1,
        }"
      >
        <div
          v-for="(item, index) in items || defaultItems"
          :key="index"
          class="p-4 rounded-lg border bg-muted/30"
        >
          <h3 class="font-medium text-sm mb-1">{{ item.title }}</h3>
          <p class="text-xs text-muted-foreground mb-2">{{ item.description }}</p>
          <nuxt-link
            v-if="item.link"
            :to="item.link"
            class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {{ item.linkText || 'Learn more' }}
            <Icon name="heroicons:arrow-right" class="h-3 w-3" />
          </nuxt-link>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
