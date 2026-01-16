<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import type { DirectusUser } from '~/types/directus'

const props = defineProps<{
  user: DirectusUser
}>()

function filterTenants(obj: any): any[] {
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => filterTenants(item))
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.people_id && obj.people_id.category === 'Tenant') {
      return [obj.people_id]
    } else {
      return Object.values(obj).flatMap((value) => filterTenants(value))
    }
  } else {
    return []
  }
}

const extUser = props.user as any
const tenants = filterTenants(extUser?.units || [])
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Units Summary</CardTitle>
          <CardDescription>Your property details</CardDescription>
        </div>
        <Icon name="heroicons:home-modern" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="extUser?.units?.length > 0" class="space-y-4">
        <div
          v-for="(unit, index) in extUser.units"
          :key="index"
          class="p-4 rounded-lg border bg-muted/30"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium">
              Unit {{ unit.units_id?.number }}
            </h3>
            <span class="text-xs px-2 py-1 rounded bg-muted">
              {{ unit.units_id?.occupant }}-occupied
            </span>
          </div>

          <InsightsTenant v-for="(tenant, index2) in tenants" :key="index2" :tenant="tenant" />

          <div v-if="unit.units_id?.vehicles" class="mt-3">
            <p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Vehicles</p>
            <div v-if="unit.units_id.vehicles.length > 0" class="space-y-2">
              <InsightsCars v-for="(car, index3) in unit.units_id.vehicles" :key="index3" :car="car" />
            </div>
            <p v-else class="text-sm text-muted-foreground">No vehicles registered.</p>
          </div>

          <div v-if="unit.units_id?.pets" class="mt-3">
            <p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Pets</p>
            <div v-if="unit.units_id.pets.length > 0" class="space-y-2">
              <InsightsPets v-for="(pet, index2) in unit.units_id.pets" :key="index2" :pet="pet" />
            </div>
            <p v-else class="text-sm text-muted-foreground">No pets registered.</p>
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center text-muted-foreground">
        <Icon name="heroicons:home-modern" class="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p class="text-sm">No units found</p>
      </div>
    </CardContent>
  </Card>
</template>
