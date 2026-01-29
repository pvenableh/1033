<script setup lang="ts">
import type { DirectusUser } from '~/types/directus'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { VisXYContainer, VisLine, VisAxis, VisBulletLegend } from '@unovis/vue'

const props = defineProps<{
  user: DirectusUser
}>()

const { linkedPerson, isBoardMember, isAdmin } = useRoles()

// Financial dashboard data (for board members / admins)
const {
  loading: financialLoading,
  varianceAnalysis,
  varianceSummary,
  cashFlowSummary,
  accountMetrics,
  financialHealthScore,
  fetchDashboardData,
  formatCurrency,
} = useFinancialDashboard()

// Fetch user units from API (includes vehicles, pets, people)
const { data: unitsData, pending: unitsPending } = useLazyFetch<{ units: any[] }>(
  '/api/directus/users/me/units',
  {
    server: false,
    default: () => ({ units: [] }),
  }
)

const userUnits = computed(() => unitsData.value?.units || [])
const units = computed(() => userUnits.value.map((u: any) => u.units_id).filter(Boolean))

// Filter tenants from fetched units
const tenants = computed(() => {
  const result: any[] = []
  for (const unit of units.value) {
    if (unit.people) {
      for (const person of unit.people) {
        if (person.people_id && person.people_id.category === 'Tenant') {
          result.push(person.people_id)
        }
      }
    }
  }
  return result
})

// Collect all people names for transaction matching
const unitPeopleNames = computed(() => {
  const names: string[] = []
  // Add the logged-in user's full name and last name
  const firstName = props.user.first_name || ''
  const lastName = props.user.last_name || ''
  if (firstName && lastName) {
    names.push(`${firstName} ${lastName}`.trim().toLowerCase())
  }
  if (lastName) {
    names.push(lastName.trim().toLowerCase())
  }
  // Add names from all people in the user's units
  for (const unit of units.value) {
    if (unit.people) {
      for (const person of unit.people) {
        const p = person.people_id
        if (p) {
          const pFirst = p.first_name || ''
          const pLast = p.last_name || ''
          if (pFirst && pLast) {
            names.push(`${pFirst} ${pLast}`.trim().toLowerCase())
          }
          if (pLast) {
            names.push(pLast.trim().toLowerCase())
          }
        }
      }
    }
  }
  return [...new Set(names)].filter(Boolean)
})

// Collect unit number search terms with contextual prefixes to avoid false positives
// e.g. unit "314" should match "Unit 314" but not "$3,140" or "1314"
const unitNumberTerms = computed(() => {
  const terms: string[] = []
  for (const unit of units.value) {
    if (unit.number) {
      const num = unit.number.toString()
      terms.push(`unit ${num}`)
      terms.push(`unit #${num}`)
      terms.push(`#${num}`)
      terms.push(`apt ${num}`)
      terms.push(`apt. ${num}`)
    }
  }
  return [...new Set(terms)]
})

// Quick stats
const totalUnits = computed(() => units.value.length)
const totalTenants = computed(() => tenants.value.length)
const totalVehicles = computed(() => {
  return units.value.reduce((acc: number, unit: any) => {
    return acc + (unit.vehicles?.length || 0)
  }, 0)
})
const totalPets = computed(() => {
  return units.value.reduce((acc: number, unit: any) => {
    return acc + (unit.pets?.length || 0)
  }, 0)
})

// Fetch recent transactions matching the user's name or unit residents
const transactionsCollection = useDirectusItems('transactions')
const recentTransactions = ref<any[]>([])
const transactionsLoading = ref(false)

async function fetchUserTransactions() {
  if (unitPeopleNames.value.length === 0 && unitNumberTerms.value.length === 0) return
  transactionsLoading.value = true
  try {
    // Build OR filters for vendor or description matching any person name
    const orFilters: any[] = []
    for (const name of unitPeopleNames.value) {
      orFilters.push({ vendor: { _icontains: name } })
      orFilters.push({ description: { _icontains: name } })
    }
    // Add unit number terms (prefixed to avoid partial numeric matches)
    for (const term of unitNumberTerms.value) {
      orFilters.push({ description: { _icontains: term } })
    }
    if (orFilters.length === 0) return
    const data = await transactionsCollection.list({
      filter: {
        _or: orFilters,
        status: { _eq: 'published' },
      },
      sort: ['-transaction_date'],
      fields: ['id', 'transaction_date', 'description', 'vendor', 'amount', 'transaction_type', 'category_id'],
      limit: 10,
    })
    recentTransactions.value = data || []
  } catch (err) {
    console.error('Error fetching user transactions:', err)
  } finally {
    transactionsLoading.value = false
  }
}

// Get board member info for current year
function getBoardMemberByYear(obj: any, targetYear: string) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = getBoardMemberByYear(obj[i], targetYear)
      if (result) {
        return result
      }
    }
    return null
  } else if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (key === 'board_member' && Array.isArray(obj[key]) && obj[key].length > 0) {
        const matchingMember = obj[key].find((member: any) => member.year === targetYear)
        return matchingMember || null
      } else {
        const result = getBoardMemberByYear(obj[key], targetYear)
        if (result) {
          return result
        }
      }
    }
    return null
  }
  return null
}

const currentYear = new Date().getFullYear().toString()
const boardMember = getBoardMemberByYear(props.user, currentYear)

// Quick actions for owner dashboard
const quickActions = [
  { label: 'Documents', to: '/documents', icon: 'heroicons:document-text' },
  { label: 'Meetings', to: '/meetings', icon: 'heroicons:calendar' },
  { label: 'Requests', to: '/requests', icon: 'heroicons:clipboard-document-list' },
  { label: 'Projects', to: '/projects', icon: 'heroicons:rectangle-stack' },
]

// Financial chart data for board members
const healthScoreColor = computed(() => {
  const score = financialHealthScore.value?.score || 0
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
})

const healthScoreBg = computed(() => {
  const score = financialHealthScore.value?.score || 0
  if (score >= 80) return 'bg-green-500/10'
  if (score >= 60) return 'bg-yellow-500/10'
  if (score >= 40) return 'bg-orange-500/10'
  return 'bg-red-500/10'
})

// Account balance data
const accountBalanceData = computed(() => {
  return accountMetrics.value.map((account: any) => ({
    name: account.account_name || account.name || `Account ${account.id}`,
    balance: account.currentBalance || 0,
    change: account.change || 0,
    changePercent: account.changePercent || 0,
  }))
})

// Variance chart data: top 6 categories by variance magnitude
const varianceChartData = computed(() => {
  return varianceAnalysis.value
    .slice(0, 6)
    .map((item: any) => ({
      category: item.category || item.categoryName || '',
      budget: Math.abs(item.budget || 0),
      actual: Math.abs(item.actual || 0),
      variance: item.variance || 0,
      percentVariance: item.percentVariance || 0,
    }))
})

function formatTransactionAmount(amount: any) {
  const num = parseFloat(amount) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

// Load financial data when board member status resolves
// Using watch instead of onMounted because isBoardMember depends on async user data
// that may not be available at mount time
watch(isBoardMember, (val) => {
  if (val) {
    fetchDashboardData()
  }
}, { immediate: true })

// Fetch transactions once unit data is loaded
watch([unitPeopleNames, unitNumberTerms], ([names, terms]) => {
  if (names.length > 0 || terms.length > 0) {
    fetchUserTransactions()
  }
}, { immediate: true })
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Welcome Header -->
    <DashboardWidgetsWelcomeHeader
      :first-name="user.first_name || ''"
      dashboard-type="owner"
    />

    <!-- Stats Grid -->
    <div v-if="unitsPending" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card v-for="i in 4" :key="i">
        <CardContent class="pt-6">
          <div class="animate-pulse space-y-2">
            <div class="h-4 bg-muted rounded w-20"></div>
            <div class="h-8 bg-muted rounded w-12"></div>
          </div>
        </CardContent>
      </Card>
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <DashboardWidgetsStatCard
        title="Units"
        :value="totalUnits"
        icon="heroicons:home"
        description="Properties owned"
      />
      <DashboardWidgetsStatCard
        title="Tenants"
        :value="totalTenants > 0 ? totalTenants : 'Owner-Occupied'"
        icon="heroicons:users"
        :description="totalTenants > 0 ? 'Active tenants' : 'No tenants'"
      />
      <DashboardWidgetsStatCard
        title="Vehicles"
        :value="totalVehicles"
        icon="heroicons:truck"
        description="Registered vehicles"
      />
      <DashboardWidgetsStatCard
        title="Pets"
        :value="totalPets"
        icon="heroicons:heart"
        description="Registered pets"
      />
    </div>

    <!-- Board Member Status (if applicable) -->
    <InsightsBoardMember
      v-if="boardMember"
      :board-member="boardMember"
    />

    <!-- Financial Overview (Board Members / Admins only) -->
    <template v-if="isBoardMember">
      <!-- Financial Health Score + Account Balances -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Health Score Card -->
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-base">Financial Health</CardTitle>
                <CardDescription>Overall score</CardDescription>
              </div>
              <Icon name="heroicons:heart" class="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="financialLoading" class="flex items-center justify-center py-8">
              <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
            <div v-else class="text-center">
              <div class="inline-flex items-center justify-center rounded-full w-24 h-24 mb-3" :class="healthScoreBg">
                <span class="text-3xl font-bold" :class="healthScoreColor">
                  {{ financialHealthScore?.score || 0 }}
                </span>
              </div>
              <p class="text-sm font-medium">
                Grade: <span class="font-bold" :class="healthScoreColor">{{ financialHealthScore?.grade || '-' }}</span>
              </p>
              <p class="text-xs text-muted-foreground mt-1 capitalize">
                {{ financialHealthScore?.status || 'Loading...' }}
              </p>
              <div v-if="financialHealthScore?.issues?.length" class="mt-3 space-y-1">
                <p
                  v-for="(issue, i) in financialHealthScore.issues.slice(0, 2)"
                  :key="i"
                  class="text-xs text-orange-600 dark:text-orange-400"
                >
                  {{ issue }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Account Balances Card -->
        <Card class="lg:col-span-2">
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-base">Account Balances</CardTitle>
                <CardDescription>Current balances across all accounts</CardDescription>
              </div>
              <Icon name="heroicons:banknotes" class="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="financialLoading" class="flex items-center justify-center py-8">
              <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
            <div v-else-if="accountBalanceData.length === 0" class="text-center py-8 text-muted-foreground text-sm">
              No account data available
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="account in accountBalanceData"
                :key="account.name"
                class="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p class="font-medium text-sm">{{ account.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    <span :class="account.change >= 0 ? 'text-green-600' : 'text-red-600'">
                      {{ account.change >= 0 ? '+' : '' }}{{ formatCurrency(account.change) }}
                    </span>
                    ({{ account.changePercent >= 0 ? '+' : '' }}{{ account.changePercent }}%)
                  </p>
                </div>
                <p class="text-lg font-bold">{{ formatCurrency(account.balance) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Budget Variance + Cash Flow Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Budget Variance Chart -->
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-base">Budget Variance</CardTitle>
                <CardDescription>Top categories by variance</CardDescription>
              </div>
              <Icon name="heroicons:chart-bar" class="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="financialLoading" class="flex items-center justify-center py-8">
              <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
            <div v-else-if="varianceChartData.length === 0" class="text-center py-8 text-muted-foreground text-sm">
              No variance data available
            </div>
            <div v-else>
              <VisBulletLegend
                :items="[
                  { name: 'Budget', color: 'rgb(99, 102, 241)' },
                  { name: 'Actual', color: 'rgb(234, 179, 8)' },
                ]"
                class="mb-4"
              />
              <VisXYContainer
                :data="varianceChartData"
                :height="220"
                :margin="{ left: 60, right: 20, top: 10, bottom: 30 }"
              >
                <VisLine
                  :x="(_d: any, i: number) => i"
                  :y="[(d: any) => d.budget]"
                  :color="['rgb(99, 102, 241)']"
                  curveType="monotone"
                />
                <VisLine
                  :x="(_d: any, i: number) => i"
                  :y="[(d: any) => d.actual]"
                  :color="['rgb(234, 179, 8)']"
                  curveType="monotone"
                />
                <VisAxis
                  type="x"
                  :tickFormat="(v: number) => varianceChartData[Math.round(v)]?.category?.substring(0, 8) || ''"
                  :tickValues="varianceChartData.map((_d: any, i: number) => i)"
                  :tickLine="false"
                  :domainLine="false"
                />
                <VisAxis
                  type="y"
                  :tickFormat="(v: number) => '$' + Math.round(v / 1000) + 'k'"
                  :gridLine="true"
                  :tickLine="false"
                  :domainLine="false"
                />
              </VisXYContainer>

              <!-- Variance Summary -->
              <div class="mt-4 pt-3 border-t flex items-center justify-between text-sm">
                <div>
                  <span class="text-muted-foreground">YTD Variance: </span>
                  <span
                    class="font-semibold"
                    :class="(varianceSummary?.totalVariance || 0) >= 0 ? 'text-red-600' : 'text-green-600'"
                  >
                    {{ formatCurrency(varianceSummary?.totalVariance || 0) }}
                  </span>
                </div>
                <span class="text-xs text-muted-foreground">
                  {{ varianceSummary?.overBudgetCount || 0 }} over budget
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Cash Flow Summary -->
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-base">Cash Flow</CardTitle>
                <CardDescription>Monthly averages and projections</CardDescription>
              </div>
              <Icon name="heroicons:arrow-trending-up" class="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="financialLoading" class="flex items-center justify-center py-8">
              <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
            <div v-else class="space-y-4">
              <!-- Current Balance -->
              <div class="p-3 rounded-lg bg-muted/50">
                <p class="text-xs text-muted-foreground uppercase tracking-wider">Current Balance</p>
                <p class="text-2xl font-bold mt-1">
                  {{ formatCurrency(cashFlowSummary?.currentBalance || 0) }}
                </p>
              </div>

              <!-- Income vs Expenses -->
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-lg bg-green-500/10">
                  <p class="text-xs text-green-600 dark:text-green-400 uppercase tracking-wider">Avg Monthly Income</p>
                  <p class="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
                    {{ formatCurrency(cashFlowSummary?.avgMonthlyIncome || 0) }}
                  </p>
                </div>
                <div class="p-3 rounded-lg bg-red-500/10">
                  <p class="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider">Avg Monthly Expenses</p>
                  <p class="text-lg font-bold text-red-700 dark:text-red-300 mt-1">
                    {{ formatCurrency(cashFlowSummary?.avgMonthlyExpenses || 0) }}
                  </p>
                </div>
              </div>

              <!-- Net Cash Flow -->
              <div class="p-3 rounded-lg" :class="(cashFlowSummary?.avgNetCashFlow || 0) >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'">
                <p class="text-xs uppercase tracking-wider" :class="(cashFlowSummary?.avgNetCashFlow || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'">
                  Avg Net Cash Flow / Month
                </p>
                <p class="text-lg font-bold mt-1" :class="(cashFlowSummary?.avgNetCashFlow || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'">
                  {{ (cashFlowSummary?.avgNetCashFlow || 0) >= 0 ? '+' : '' }}{{ formatCurrency(cashFlowSummary?.avgNetCashFlow || 0) }}
                </p>
              </div>

              <!-- 6-Month Projection -->
              <div class="pt-3 border-t flex items-center justify-between text-sm">
                <span class="text-muted-foreground">6-Month Projection:</span>
                <span class="font-semibold" :class="(cashFlowSummary?.projectedBalance6Mo || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(cashFlowSummary?.projectedBalance6Mo || 0) }}
                </span>
              </div>

              <!-- Warning -->
              <div
                v-if="cashFlowSummary?.monthsUntilNegative"
                class="p-3 rounded-lg bg-red-500/10 text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
              >
                <Icon name="heroicons:exclamation-triangle" class="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Account may go negative in {{ cashFlowSummary.monthsUntilNegative }} month{{ cashFlowSummary.monthsUntilNegative > 1 ? 's' : '' }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Financial Dashboard Link -->
      <div class="flex justify-center">
        <nuxt-link
          to="/financials/dashboard"
          class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          View Full Financial Dashboard
          <Icon name="heroicons:arrow-right" class="h-4 w-4" />
        </nuxt-link>
      </div>
    </template>

    <!-- My Units Detail -->
    <Card v-if="!unitsPending && units.length > 0">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-base">My Units</CardTitle>
            <CardDescription>Your property details</CardDescription>
          </div>
          <Icon name="heroicons:home-modern" class="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div
            v-for="unit in units"
            :key="unit.id"
            class="p-4 rounded-lg border bg-muted/30"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium">Unit {{ unit.number }}</h3>
              <span class="text-xs px-2 py-1 rounded bg-muted">
                {{ unit.occupant ? unit.occupant + '-Occupied' : 'Owner-Occupied' }}
              </span>
            </div>

            <!-- People -->
            <div v-if="unit.people && unit.people.length > 0" class="mb-3">
              <p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Residents</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="person in unit.people"
                  :key="person.id"
                  class="text-sm bg-muted px-2 py-1 rounded"
                >
                  {{ person.people_id?.first_name }} {{ person.people_id?.last_name }}
                </span>
              </div>
            </div>

            <!-- Vehicles -->
            <div v-if="unit.vehicles && unit.vehicles.length > 0" class="mb-3">
              <p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Vehicles</p>
              <div class="space-y-1">
                <div v-for="v in unit.vehicles" :key="v.id" class="text-sm flex items-center gap-2">
                  <Icon name="heroicons:truck" class="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{{ v.year }} {{ v.make }} {{ v.model }}</span>
                  <span v-if="v.color" class="text-muted-foreground">({{ v.color }})</span>
                  <span v-if="v.license_plate" class="text-xs text-muted-foreground ml-auto">{{ v.state }} {{ v.license_plate }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground mb-2">No vehicles registered.</p>

            <!-- Pets -->
            <div v-if="unit.pets && unit.pets.length > 0">
              <p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Pets</p>
              <div class="space-y-1">
                <div v-for="pet in unit.pets" :key="pet.id" class="text-sm flex items-center gap-2">
                  <Icon name="heroicons:heart" class="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{{ pet.name }}</span>
                  <span v-if="pet.breed" class="text-muted-foreground">({{ pet.breed }})</span>
                  <span class="text-xs text-muted-foreground">{{ pet.category }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">No pets registered.</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Recent Transactions (linked to user/unit names) -->
    <Card v-if="recentTransactions.length > 0 || transactionsLoading">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-base">Recent Transactions</CardTitle>
            <CardDescription>Transactions connected to your name or unit</CardDescription>
          </div>
          <Icon name="heroicons:banknotes" class="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="transactionsLoading" class="flex items-center justify-center py-8">
          <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="tx in recentTransactions"
            :key="tx.id"
            class="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium truncate">{{ tx.description }}</p>
              <div class="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{{ tx.transaction_date }}</span>
                <span v-if="tx.vendor" class="truncate">&middot; {{ tx.vendor }}</span>
              </div>
            </div>
            <span
              class="text-sm font-semibold ml-4 whitespace-nowrap"
              :class="tx.transaction_type === 'deposit' ? 'text-green-600' : 'text-foreground'"
            >
              {{ tx.transaction_type === 'deposit' ? '+' : '-' }}{{ formatTransactionAmount(tx.amount) }}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- My Tasks -->
    <DashboardWidgetsTasksCard />

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Board Meetings -->
      <InsightsMeetings />

      <!-- Announcements -->
      <InsightsAnnouncements />
    </div>

    <!-- Quick Actions -->
    <DashboardWidgetsQuickActionsCard :actions="quickActions" />

    <!-- Board of Directors -->
    <InsightsBoard />

    <!-- Manage All Units Link (admins only) -->
    <div v-if="isAdmin" class="flex justify-center">
      <nuxt-link
        to="/admin/units"
        class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Manage All Units
        <Icon name="heroicons:arrow-right" class="h-4 w-4" />
      </nuxt-link>
    </div>
  </div>
</template>
