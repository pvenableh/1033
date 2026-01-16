<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

interface Pet {
  name?: string
  species?: string
  breed?: string
}

interface Unit {
  units_id?: {
    pets?: Pet[]
  }
}

const props = defineProps<{
  units: Unit[]
}>()

const allPets = computed(() => {
  return props.units.flatMap(unit => unit.units_id?.pets || [])
})
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Your Pets</CardTitle>
          <CardDescription>Registered pets</CardDescription>
        </div>
        <Icon name="heroicons:heart" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="allPets.length > 0" class="space-y-3">
        <div
          v-for="(pet, index) in allPets"
          :key="index"
          class="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
        >
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Icon name="heroicons:heart" class="h-5 w-5 text-muted-foreground" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ pet.name }}</p>
            <p class="text-xs text-muted-foreground">
              {{ pet.species || 'Pet' }}
              <span v-if="pet.breed"> &bull; {{ pet.breed }}</span>
            </p>
          </div>
        </div>
      </div>

      <div v-else class="py-8 text-center">
        <Icon name="heroicons:heart" class="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
        <p class="text-sm text-muted-foreground">No pets registered.</p>
        <nuxt-link
          to="/account"
          class="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
        >
          Register Pet
          <Icon name="heroicons:arrow-right" class="h-3 w-3" />
        </nuxt-link>
      </div>
    </CardContent>
  </Card>
</template>
