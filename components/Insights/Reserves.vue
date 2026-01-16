<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

const reservesCollection = useDirectusItems('reserves', { requireAuth: false })

const data = await reservesCollection.list({
  fields: ['*'],
  sort: 'date',
})

const labels = data.map((reserve: any) => new Date(reserve.date).toLocaleString('default', { month: 'short' }))

const amounts = data.map((reserve: any) =>
  reserve.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
)

const currentAmount = amounts[amounts.length - 1]

const percentage = computed(() => {
  const amount = ((parseFloat(currentAmount.replace(/,/g, '')) - parseFloat(amounts[0].replace(/,/g, ''))) / parseFloat(currentAmount.replace(/,/g, ''))) * 100
  return Math.round(amount * 100) / 100
})

const percentageChange = computed(() => {
  if (percentage.value > 0) {
    return 'Increase Since ' + new Date(data[0].date).toLocaleString('default', { month: 'long', year: 'numeric' })
  } else {
    return 'Decrease Since ' + new Date(data[0].date).toLocaleString('default', { month: 'long', year: 'numeric' })
  }
})
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Reserves</CardTitle>
          <CardDescription>Financial reserves balance</CardDescription>
        </div>
        <Icon name="heroicons:banknotes" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div class="mb-4">
        <p class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
          ${{ currentAmount }}
        </p>
        <p class="text-sm text-muted-foreground mt-1">
          <span class="font-bold" :class="percentage > 0 ? 'text-green-600' : 'text-red-600'">
            {{ percentage > 0 ? '+' : '' }}{{ percentage }}%
          </span>
          {{ percentageChange }}
        </p>
      </div>

      <ChartsLine class="h-[200px] w-full" title="Reserves" :data="amounts" :labels="labels" />

      <div class="mt-4 flex justify-center">
        <nuxt-link
          to="/financials/"
          class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View All Financials
          <Icon name="heroicons:arrow-right" class="h-3 w-3" />
        </nuxt-link>
      </div>
    </CardContent>
  </Card>
</template>
