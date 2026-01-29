<script setup lang="ts">
import type { DirectusUser } from '~/types/directus'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { VisXYContainer, VisLine, VisAxis, VisBulletLegend } from '@unovis/vue'

const props = defineProps<{
  user: DirectusUser
}>()

const { linkedPerson, isBoardMember } = useRoles()

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

// Filter tenants from user units
function filterTenants(obj: any): any[] {
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => filterTenants(item))
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.people_id && obj.people_id.category === 'Tenant') {
      return [obj.people_id]
    } else {
      return Object.values(obj).flatMap((value) => filterTenants(value))
    }
  }
  return []
}

const extUser = props.user as any
const tenants = computed(() => filterTenants(extUser?.units || []))
const userUnits = computed(() => extUser?.units || [])

// Quick stats
const totalUnits = computed(() => userUnits.value.length)
const totalTenants = computed(() => tenants.value.length)
const totalVehicles = computed(() => {
  return userUnits.value.reduce((acc: number, unit: any) => {
    return acc + (unit.units_id?.vehicles?.length || 0)
  }, 0)
})
const totalPets = computed(() => {
  return userUnits.value.reduce((acc: number, unit: any) => {
    return acc + (unit.units_id?.pets?.length || 0)
  }, 0)
})

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

// Load financial data on mount for board members
onMounted(() => {
  if (isBoardMember.value) {
    fetchDashboardData()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <DashboardWidgetsWelcomeHeader
      :first-name="user.first_name || ''"
      dashboard-type="owner"
    />

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <DashboardWidgetsStatCard
        title="Units"
        :value="totalUnits"
        icon="heroicons:home"
        description="Properties owned"
      />
      <DashboardWidgetsStatCard
        title="Tenants"
        :value="totalTenants"
        icon="heroicons:users"
        description="Active tenants"
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

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Units Summary -->
      <InsightsPerson :user="user" />

      <!-- Board Meetings -->
      <InsightsMeetings />

      <!-- Announcements -->
      <InsightsAnnouncements />

      <!-- Newsletter -->
      <InsightsNewsletter />
    </div>

    <!-- Quick Actions -->
    <DashboardWidgetsQuickActionsCard :actions="quickActions" />

    <!-- Board of Directors -->
    <InsightsBoard />

    <!-- Full Units Summary -->
    <InsightsUnits />

    <!-- Manage Units Link -->
    <div class="flex justify-center">
      <nuxt-link
        to="/units"
        class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Manage All Units
        <Icon name="heroicons:arrow-right" class="h-4 w-4" />
      </nuxt-link>
    </div>
  </div>
</template>
