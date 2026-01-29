<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

function setBackgroundColor(occupant: string) {
  if (occupant === 'Owner') {
    return 'bg-blue-400'
  } else if (occupant === 'Tenant') {
    return 'bg-cyan-400'
  } else {
    return 'bg-yellow-400'
  }
}

const unitsCollection = useDirectusItems('units')
const units = ref<any[]>([])
const pending = ref(true)
const error = ref<Error | null>(null)

onMounted(async () => {
  try {
    const data = await unitsCollection.list({
      fields: ['id', 'number', 'occupant', 'status'],
      filter: { status: { _eq: 'published' } },
      sort: ['number'],
      limit: -1,
    })
    units.value = data || []
  } catch (err: any) {
    console.error('Error loading units:', err)
    error.value = err
  } finally {
    pending.value = false
  }
})

const occupantTotals = computed(() => {
  if (!units.value.length) return {}
  return units.value.reduce((totals: Record<string, number>, property: any) => {
    const occupant = property.occupant
    if (occupant === 'Owner' || occupant === 'Tenant') {
      if (!totals[occupant]) {
        totals[occupant] = 0
      }
      totals[occupant]++
    }
    return totals
  }, {})
})

const labels = computed(() => Object.keys(occupantTotals.value))
const values = computed(() => Object.values(occupantTotals.value) as number[])
const ownershipPercentage = computed(() => {
  if (!units.value.length || values.value.length === 0) return 0
  return percentage(values.value[0], units.value.length)
})

const colors = ['#00BFFF', '#00FFED', '#e8fc00']

const legendValues = computed(() => labels.value.map((label) => ({
  label,
  color: label === 'Owner' ? colors[0] : colors[1],
})))

const subtitle = computed(() => ownershipPercentage.value + '% of units are owner-occupied.')
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">All Units</CardTitle>
          <CardDescription>Building occupancy overview</CardDescription>
        </div>
        <Icon name="heroicons:building-office-2" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="pending" class="py-8 text-center text-muted-foreground">
        <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading...
      </div>
      <div v-else-if="units.length > 0" class="flex flex-col lg:flex-row items-start justify-center gap-8">
        <div class="flex-none">
          <ChartsLegend :legendValues="legendValues" :subtitle="subtitle" />
          <ClientOnly fallback-tag="span" fallback="Loading chart...">
            <ChartsDoughnut class="w-full max-w-[250px] mx-auto" title="Units" :data="values" :labels="labels" :colors="colors" />
          </ClientOnly>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 grow w-full">
          <div
            v-for="(unit, index) in units"
            :key="index"
            class="p-2 rounded border bg-muted/30"
          >
            <p class="text-sm font-medium border-b pb-1 mb-1">
              Unit {{ unit.number }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span
                class="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-black"
                :class="setBackgroundColor(unit.occupant)"
              >
                {{ unit.occupant }}
              </span>
            </p>
          </div>
        </div>
      </div>
      <div v-if="error" class="py-8 text-center text-destructive">
        Error loading units
      </div>
    </CardContent>
  </Card>
</template>
