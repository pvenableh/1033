<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
})

useSeoMeta({
  title: 'Financial System Directions',
})

const { isBoardMember, isOwner } = useRoles()
const canAccess = computed(() => isBoardMember.value || isOwner.value)

const activeSection = ref<string | null>(null)

const toggle = (section: string) => {
  activeSection.value = activeSection.value === section ? null : section
}
</script>

<template>
  <div class="admin-page t-bg min-h-full">
    <div class="container mx-auto px-6 py-8 max-w-4xl">
      <!-- Header -->
      <div class="mb-10">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-2.5 bg-primary/10 rounded-lg">
            <Icon name="i-heroicons-book-open" class="size-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl font-bold dark:text-white">Financial System Directions</h1>
            <p class="text-sm text-muted-foreground">
              Simple step-by-step guides for managing the financial system
            </p>
          </div>
        </div>
      </div>

      <div v-if="!canAccess" class="text-center py-12">
        <Icon name="i-heroicons-shield-exclamation" class="size-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2 dark:text-white">Access Denied</h2>
        <p class="text-muted-foreground">
          You need board member or owner access to view financial directions.
        </p>
      </div>

      <div v-else class="space-y-6">
        <!-- Quick Links -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            @click="toggle('reconciliation')"
            class="group p-5 rounded-xl border t-border text-left transition-all hover:shadow-md"
            :class="activeSection === 'reconciliation' ? 'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-md' : 't-bg-subtle hover:border-green-300'">
            <div class="flex items-center gap-3 mb-2">
              <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/40 group-hover:scale-110 transition-transform">
                <Icon name="i-heroicons-document-check" class="size-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 class="font-semibold dark:text-white">Reconciliation</h3>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Match bank statements to recorded transactions each month
            </p>
          </button>

          <button
            @click="toggle('transactions')"
            class="group p-5 rounded-xl border t-border text-left transition-all hover:shadow-md"
            :class="activeSection === 'transactions' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md' : 't-bg-subtle hover:border-blue-300'">
            <div class="flex items-center gap-3 mb-2">
              <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 group-hover:scale-110 transition-transform">
                <Icon name="i-heroicons-list-bullet" class="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 class="font-semibold dark:text-white">Transaction Tracking</h3>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Review, categorize, and approve individual transactions
            </p>
          </button>

          <button
            @click="toggle('transfers')"
            class="group p-5 rounded-xl border t-border text-left transition-all hover:shadow-md"
            :class="activeSection === 'transfers' ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-md' : 't-bg-subtle hover:border-purple-300'">
            <div class="flex items-center gap-3 mb-2">
              <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 group-hover:scale-110 transition-transform">
                <Icon name="i-heroicons-arrows-right-left" class="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 class="font-semibold dark:text-white">Transfer Updating</h3>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Link and manage transfers between accounts
            </p>
          </button>
        </div>

        <!-- ============================== -->
        <!-- RECONCILIATION SECTION         -->
        <!-- ============================== -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2">
          <div v-if="activeSection === 'reconciliation'" class="space-y-4">
            <div class="rounded-xl border t-border overflow-hidden">
              <div class="bg-green-50 dark:bg-green-950/30 px-6 py-4 border-b border-green-200 dark:border-green-800">
                <h2 class="text-lg font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Icon name="i-heroicons-document-check" class="size-5" />
                  How to Reconcile an Account
                </h2>
                <p class="text-sm text-green-700 dark:text-green-300 mt-1">
                  Reconciliation verifies that your recorded transactions match your bank statement.
                </p>
              </div>

              <div class="p-6 space-y-5 t-bg-subtle">
                <!-- Step 1 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Go to Reconciliation</h4>
                    <p class="text-sm text-muted-foreground">
                      Navigate to
                      <NuxtLink to="/financials/reconciliation" class="text-green-600 dark:text-green-400 underline underline-offset-2 hover:no-underline">
                        Financials &rarr; Reconciliation
                      </NuxtLink>
                      from the sidebar.
                    </p>
                  </div>
                </div>

                <!-- Step 2 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Select Account, Month & Year</h4>
                    <p class="text-sm text-muted-foreground">
                      Use the filters at the top to pick the bank account, month, and year you want to reconcile.
                    </p>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Review the Monthly Tab</h4>
                    <p class="text-sm text-muted-foreground">
                      The <strong>Monthly</strong> tab shows the beginning balance, deposits, withdrawals, transfers, and an ending balance. Compare the
                      <em>Calculated Ending</em> to the <em>Bank Statement Ending</em>. If they match, the month is ready to close.
                    </p>
                  </div>
                </div>

                <!-- Step 4 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Mark Transactions as Reconciled</h4>
                    <p class="text-sm text-muted-foreground">
                      Switch to the <strong>Transactions</strong> tab. Select individual transactions (or use the checkbox to select all),
                      then click <strong>Mark Selected Reconciled</strong>. You can also flag or dispute any transaction that looks incorrect.
                    </p>
                  </div>
                </div>

                <!-- Step 5 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Certify & Close the Month</h4>
                    <p class="text-sm text-muted-foreground">
                      Once everything looks correct, click <strong>Reconcile Month</strong> (or <strong>Certify & Close Month</strong>) on the Monthly tab.
                      This generates a reconciliation report and marks all remaining pending transactions as reconciled.
                    </p>
                  </div>
                </div>

                <!-- Tip -->
                <div class="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div class="flex gap-2">
                    <Icon name="i-heroicons-light-bulb" class="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div class="text-sm text-green-800 dark:text-green-200">
                      <strong>Tip:</strong> Use the <strong>Claude Assistant</strong> tab to automatically analyze transactions for uncategorized items,
                      missing notes, and potential issues before you close the month.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- ============================== -->
        <!-- TRANSACTION TRACKING SECTION   -->
        <!-- ============================== -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2">
          <div v-if="activeSection === 'transactions'" class="space-y-4">
            <div class="rounded-xl border t-border overflow-hidden">
              <div class="bg-blue-50 dark:bg-blue-950/30 px-6 py-4 border-b border-blue-200 dark:border-blue-800">
                <h2 class="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Icon name="i-heroicons-list-bullet" class="size-5" />
                  How to Track Transactions
                </h2>
                <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Every deposit, withdrawal, fee, and transfer is tracked as a transaction.
                </p>
              </div>

              <div class="p-6 space-y-5 t-bg-subtle">
                <!-- Step 1 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Open the Dashboard</h4>
                    <p class="text-sm text-muted-foreground">
                      Go to
                      <NuxtLink to="/financials" class="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline">
                        Financials &rarr; Dashboard
                      </NuxtLink>.
                      Select the account tab (Operating, Reserve, or Special Assessment) to view its transactions.
                    </p>
                  </div>
                </div>

                <!-- Step 2 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Review Individual Transactions</h4>
                    <p class="text-sm text-muted-foreground">
                      Click any transaction row to open its detail view. You can see the full description, amount, date,
                      assigned budget category, vendor, and any attached files or receipts.
                    </p>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Categorize & Assign Budget Items</h4>
                    <p class="text-sm text-muted-foreground">
                      In the transaction detail, assign a budget category if one is missing. This links the transaction to the
                      correct budget line item for accurate budget-vs-actual reporting.
                    </p>
                  </div>
                </div>

                <!-- Step 4 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Add Notes & Attach Receipts</h4>
                    <p class="text-sm text-muted-foreground">
                      Use the notes panel (chat icon on each transaction row) to add context, explanations, or flag items
                      for follow-up. Attach receipt images or supporting documents directly to the transaction.
                    </p>
                  </div>
                </div>

                <!-- Step 5 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Approve or Flag for Review</h4>
                    <p class="text-sm text-muted-foreground">
                      On the Reconciliation &rarr; Transactions tab, use the review filter to find pending items. Select transactions
                      and click <strong>Approve Selected</strong> or <strong>Flag Selected</strong> to update their review status in bulk.
                    </p>
                  </div>
                </div>

                <!-- Tip -->
                <div class="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div class="flex gap-2">
                    <Icon name="i-heroicons-light-bulb" class="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div class="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Tip:</strong> Use the <strong>Needs Receipt</strong> filter to quickly find withdrawals over $100 that are missing receipt attachments.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- ============================== -->
        <!-- TRANSFER UPDATING SECTION      -->
        <!-- ============================== -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2">
          <div v-if="activeSection === 'transfers'" class="space-y-4">
            <div class="rounded-xl border t-border overflow-hidden">
              <div class="bg-purple-50 dark:bg-purple-950/30 px-6 py-4 border-b border-purple-200 dark:border-purple-800">
                <h2 class="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Icon name="i-heroicons-arrows-right-left" class="size-5" />
                  How to Update Transfers
                </h2>
                <p class="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Transfers move money between accounts (e.g., Operating to Reserve). Each transfer creates two transactions that should be linked.
                </p>
              </div>

              <div class="p-6 space-y-5 t-bg-subtle">
                <!-- Step 1 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Check the Transfer Audit Alert</h4>
                    <p class="text-sm text-muted-foreground">
                      On the
                      <NuxtLink to="/financials/reconciliation" class="text-purple-600 dark:text-purple-400 underline underline-offset-2 hover:no-underline">
                        Reconciliation
                      </NuxtLink>
                      page, a red alert banner appears at the top if there are unmatched transfers, broken links, or amount mismatches.
                    </p>
                  </div>
                </div>

                <!-- Step 2 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Run Auto-Link Transfers</h4>
                    <p class="text-sm text-muted-foreground">
                      Click the <strong>Auto-Link Transfers</strong> button on the alert banner. The system matches transfer-out
                      transactions to their corresponding transfer-in by comparing amounts, dates, and account pairs. It also
                      assigns the correct transfer category automatically.
                    </p>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Review Auto-Link Results</h4>
                    <p class="text-sm text-muted-foreground">
                      After auto-linking, a green summary shows how many pairs were linked, how many were categorized,
                      and how many were skipped. Review the list of linked pairs to confirm they look correct.
                    </p>
                  </div>
                </div>

                <!-- Step 4 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Fix Remaining Issues Manually</h4>
                    <p class="text-sm text-muted-foreground">
                      If any transfers couldn't be auto-linked (mismatched amounts, different dates, etc.), open the transaction
                      detail to manually update the transfer link, category, or amount. Add a note explaining any discrepancies.
                    </p>
                  </div>
                </div>

                <!-- Step 5 -->
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-medium dark:text-white mb-1">Verify on the Monthly Tab</h4>
                    <p class="text-sm text-muted-foreground">
                      Go back to the <strong>Monthly</strong> tab to confirm the Transfer Activity section shows the correct
                      totals for Transfers In and Transfers Out. The net transfer amount should reflect the actual movement of funds
                      between accounts.
                    </p>
                  </div>
                </div>

                <!-- Tip -->
                <div class="mt-4 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div class="flex gap-2">
                    <Icon name="i-heroicons-light-bulb" class="size-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div class="text-sm text-purple-800 dark:text-purple-200">
                      <strong>Tip:</strong> Transfers between accounts are zero-sum &mdash; a transfer out from Operating should have a matching transfer in to Reserve (or vice versa).
                      If the net transfer amount looks wrong, there's likely an unlinked or miscategorized transaction.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Quick Reference Card (always visible) -->
        <div class="rounded-xl border t-border t-bg-subtle p-6">
          <h3 class="font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon name="i-heroicons-map" class="size-5 text-muted-foreground" />
            Quick Reference
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <NuxtLink
              to="/financials"
              class="flex items-center gap-3 p-3 rounded-lg border t-border hover:border-primary/50 transition-colors">
              <Icon name="i-heroicons-chart-bar" class="size-5 text-blue-500" />
              <div>
                <div class="font-medium dark:text-white">Dashboard</div>
                <div class="text-xs text-muted-foreground">View all accounts & transactions</div>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/financials/reconciliation"
              class="flex items-center gap-3 p-3 rounded-lg border t-border hover:border-primary/50 transition-colors">
              <Icon name="i-heroicons-document-check" class="size-5 text-green-500" />
              <div>
                <div class="font-medium dark:text-white">Reconciliation</div>
                <div class="text-xs text-muted-foreground">Monthly reconciliation & reports</div>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/financials/budget-management"
              class="flex items-center gap-3 p-3 rounded-lg border t-border hover:border-primary/50 transition-colors">
              <Icon name="i-heroicons-calculator" class="size-5 text-orange-500" />
              <div>
                <div class="font-medium dark:text-white">Budget Management</div>
                <div class="text-xs text-muted-foreground">Categories, items & amendments</div>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/financials/import-center"
              class="flex items-center gap-3 p-3 rounded-lg border t-border hover:border-primary/50 transition-colors">
              <Icon name="i-heroicons-arrow-up-tray" class="size-5 text-indigo-500" />
              <div>
                <div class="font-medium dark:text-white">Import Center</div>
                <div class="text-xs text-muted-foreground">Import bank statements & budgets</div>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/financials/budget"
              class="flex items-center gap-3 p-3 rounded-lg border t-border hover:border-primary/50 transition-colors">
              <Icon name="i-heroicons-chart-pie" class="size-5 text-cyan-500" />
              <div>
                <div class="font-medium dark:text-white">Budget Overview</div>
                <div class="text-xs text-muted-foreground">Budget vs actual spending</div>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/financials/yearly-reconciliation"
              class="flex items-center gap-3 p-3 rounded-lg border t-border hover:border-primary/50 transition-colors">
              <Icon name="i-heroicons-calendar-days" class="size-5 text-amber-500" />
              <div>
                <div class="font-medium dark:text-white">Year-End</div>
                <div class="text-xs text-muted-foreground">Annual reconciliation reports</div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
