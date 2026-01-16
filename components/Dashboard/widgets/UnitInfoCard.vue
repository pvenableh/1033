<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

interface Unit {
  units_id?: {
    number?: string
    occupant?: string
    parking_spot?: string
    vehicles?: any[]
    pets?: any[]
  }
}

defineProps<{
  units: Unit[]
}>()
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Your Unit</CardTitle>
          <CardDescription>Unit information and details</CardDescription>
        </div>
        <Icon name="heroicons:home" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="units.length > 0" class="space-y-4">
        <div
          v-for="(unit, index) in units"
          :key="index"
          class="p-4 rounded-lg border bg-muted/30"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-bold">Unit {{ unit.units_id?.number || 'N/A' }}</h3>
            <Badge variant="secondary">
              {{ unit.units_id?.occupant || 'N/A' }}-occupied
            </Badge>
          </div>
          <div v-if="unit.units_id?.parking_spot" class="mt-2">
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Parking Spot</p>
            <p class="font-medium">{{ unit.units_id.parking_spot }}</p>
          </div>
        </div>
      </div>

      <div v-else class="py-8 text-center">
        <Icon name="heroicons:home" class="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
        <p class="text-sm text-muted-foreground">No unit information available.</p>
      </div>
    </CardContent>
  </Card>
</template>
