# Financial System Guide

This document covers the HOA financial management system, including budget management, reconciliation, compliance monitoring, reserve studies, assessment tracking, audit logging, and the financial dashboard.

## Table of Contents

- [Overview](#overview)
- [Directus Collections](#directus-collections)
- [Composables](#composables)
  - [useBudgetManagement](#usebudgetmanagement)
  - [useReconciliationNotes](#usereconciliationnotes)
  - [useTransactionMatching](#usetransactionmatching)
  - [useFinancialDashboard](#usefinancialdashboard)
  - [useReserveStudy](#usereservestudy)
  - [useAssessmentLedger](#useassessmentledger)
  - [useComplianceAlerts](#usecompliancealerts)
  - [useAuditLog](#useauditlog)
- [Fiscal Year Management](#fiscal-year-management)
- [Account Structure](#account-structure)
- [Workflows](#workflows)
  - [Setting Up a New Fiscal Year](#setting-up-a-new-fiscal-year)
  - [Monthly Reconciliation](#monthly-reconciliation)
  - [Budget Amendments](#budget-amendments)
  - [Assessment Tracking](#assessment-tracking)
  - [Compliance Monitoring](#compliance-monitoring)

---

## Overview

The financial system manages three segregated bank accounts in compliance with Florida HOA statutes (Chapter 720). All financial data is organized by fiscal year, with each fiscal year stored as a record in the `fiscal_years` Directus collection. Financial collections reference fiscal years via Many-to-One (M2O) relationships.

Key capabilities:

- **Budget Management** -- Create, copy, and amend annual operating budgets with category and line-item detail
- **Reconciliation** -- Monthly bank statement reconciliation with notes, reports, and permission-based access
- **Transaction Matching** -- Automated categorization of transactions using vendor patterns and keywords
- **Financial Dashboard** -- Variance analysis, cash flow forecasting, multi-year budget comparison, and a financial health score
- **Reserve Studies** -- Track building components, replacement schedules, and 30-year funding projections
- **Assessment Ledger** -- Unit-level assessment tracking with aging reports and delinquency management
- **Compliance Alerts** -- Fund segregation monitoring, large transaction alerts, and board action tracking
- **Audit Logging** -- Full audit trail for all financial operations

---

## Directus Collections

| Collection | Description |
|---|---|
| `fiscal_years` | Fiscal year records (`id`, `year`, `start_date`) |
| `fiscal_year_budgets` | Annual budget configuration (revenue, expenses, assessment amount) |
| `budget_categories` | Expense categories (Insurance, Utilities, Maintenance, etc.) |
| `budget_items` | Line items within categories with vendor patterns and keywords |
| `budget_admendments` | Mid-year budget amendments with approval workflow |
| `transactions` | Bank transactions with reconciliation status |
| `monthly_statements` | Monthly bank statement balances |
| `monthly_reconciliation_reports` | Reconciliation reports by account and month |
| `reconciliation_notes` | Notes attached to individual transactions |
| `cash_flow_projections` | Cash flow forecast data |
| `accounts` | Bank accounts (Operating, Reserve, Special Assessment) |
| `reserve_studies` | Annual reserve study snapshots |
| `reserve_components` | Building components with replacement schedules |
| `assessment_ledger` | Per-unit monthly assessment charges and payments |
| `units` | Building units with owner information |
| `compliance_alerts` | Fund segregation and compliance alerts |
| `audit_logs` | Audit trail entries |
| `vendors` | Vendor records with matching keywords |
| `user_permissions` | Financial module permissions per user |

---

## Composables

### useBudgetManagement

**File:** `composables/useBudgetManagement.js`

Manages the full lifecycle of annual operating budgets -- creating budgets from templates, copying from prior years, managing categories and line items, and handling mid-year amendments.

#### Basic Usage

```javascript
const {
  selectedYear,
  loading,
  budgetCategories,
  budgetItems,
  budgetTotals,
  itemsByCategory,
  fetchBudgetData,
  createBudgetCategory,
  createBudgetItem,
  createBudgetAmendment,
  approveBudgetAmendment,
  copyBudgetToYear,
  createBudgetFromTemplate,
  formatCurrency,
} = useBudgetManagement()

// Load budget data for the current year
await fetchBudgetData()

// Switch to a different year (automatically reloads data)
selectedYear.value = 2026

// Access computed totals
console.log(budgetTotals.value.yearlyExpenses)
console.log(budgetTotals.value.monthlyAssessment)
```

#### Creating a Budget

```javascript
// From the default template (creates standard categories)
await createBudgetFromTemplate(2026)

// By copying last year's budget
await copyBudgetToYear(2025, 2026)
```

#### Budget Amendments

```javascript
// Create an amendment (e.g., insurance rate increase mid-year)
await createBudgetAmendment({
  budget_item_id: itemId,
  effective_date: '2025-07-01',
  amended_annual_amount: 48000,
  amended_monthly_amount: 4000,
  reason: 'Insurance premium increase effective July 1',
  amendment_type: 'rate_change',
})

// Approve an amendment (updates the budget item amounts)
await approveBudgetAmendment(amendmentId, userId)

// Get the effective budget amount at a specific date
const effective = getEffectiveBudgetAmount(budgetItemId, new Date('2025-08-15'))
// { monthly: 4000, yearly: 48000, amendedOn: '2025-07-01', reason: '...' }
```

---

### useReconciliationNotes

**File:** `composables/useReconciliationNotes.js`

Handles monthly bank reconciliation with permission-based access control. Users must have the appropriate `user_permissions` record to create, update, or delete notes and reconcile transactions.

#### Basic Usage

```javascript
const {
  canReadFinancials,
  canCreateNotes,
  canReconcile,
  transactionNotes,
  reconciliationReports,
  initialize,
  fetchTransactionNotes,
  createNote,
  resolveNote,
  updateTransactionReconciliation,
  bulkReconcileTransactions,
  createReconciliationReport,
  generateMonthlyReport,
} = useReconciliationNotes()

// Initialize (fetches user permissions)
await initialize()

// Check permissions before showing UI
if (canReadFinancials.value) {
  // show financial data
}
```

#### Transaction Notes

```javascript
// Fetch notes for a transaction
await fetchTransactionNotes(transactionId)

// Create a note
await createNote(transactionId, {
  note: 'Payment matches invoice #1234',
  note_type: 'reconciliation', // general | reconciliation | discrepency | approval | inquiry
})

// Resolve a note
await resolveNote(noteId)
```

#### Reconciliation

```javascript
// Reconcile a single transaction
await updateTransactionReconciliation(transactionId, 'reconciled')

// Bulk reconcile
await bulkReconcileTransactions([id1, id2, id3], 'reconciled')

// Generate and save a monthly report
const reportData = await generateMonthlyReport(2025, accountId, '03', transactions, statement)
await createReconciliationReport(reportData)

// Fetch reports
await fetchReconciliationReports(2025, accountId)
```

---

### useTransactionMatching

**File:** `composables/useTransactionMatching.js`

Automatically categorizes bank transactions by matching them against budget item vendor patterns, keywords, and category patterns. Uses a scoring system to find the best match.

#### Matching Priority

1. **Vendor patterns** (score: 100) -- Exact vendor name matches from `budget_items.vendor_patterns`
2. **Keywords** (score: 50) -- Keyword matches from `budget_items.keywords`
3. **Description similarity** (score: 25) -- Partial description matches
4. **Amount range** (score: 10) -- Transaction amount within 20% of monthly budget

Minimum confidence threshold: 25 (out of 100)

#### Basic Usage

```javascript
const {
  initializeMatching,
  autoCategorizeTransaction,
  batchAutoCategorize,
  batchApplyAutoCategorization,
  getUncategorizedTransactions,
  getMatchingStats,
} = useTransactionMatching()

// Load matching data
await initializeMatching(2025)

// Auto-categorize a single transaction
const match = autoCategorizeTransaction(transaction)
// { budget_item_id, category_id, confidence, matched_by, vendor_match }

// Batch categorize
const categorized = batchAutoCategorize(transactions)

// Apply to database (only matches above 50% confidence)
const results = await batchApplyAutoCategorization(categorized, 50)
// { success: 12, skipped: 3, failed: 0, errors: [] }

// Find uncategorized transactions
const uncategorized = await getUncategorizedTransactions(2025, accountId)
```

---

### useFinancialDashboard

**File:** `composables/useFinancialDashboard.js`

Provides high-level financial analytics including variance analysis, cash flow forecasting, multi-year budget comparison, and a composite financial health score.

#### Basic Usage

```javascript
const {
  selectedYear,
  selectedAccount,
  loading,
  fetchDashboardData,
  varianceAnalysis,
  varianceSummary,
  cashFlowSummary,
  generateCashFlowProjections,
  multiYearComparison,
  budgetTrendAnalysis,
  accountMetrics,
  financialHealthScore,
  formatCurrency,
} = useFinancialDashboard()

// Load all dashboard data
await fetchDashboardData()

// Change filters (auto-reloads)
selectedYear.value = 2025
selectedAccount.value = 1 // Operating account
```

#### Variance Analysis

```javascript
// Per-category variance (sorted by largest variance)
const analysis = varianceAnalysis.value
// [{ category, actual, budget, variance, percentVariance, status: 'over'|'under'|'on_target' }]

// Summary
const summary = varianceSummary.value
// { totalBudget, totalActual, totalVariance, percentVariance, overBudgetCount, status }
```

#### Cash Flow Forecasting

```javascript
// 12-month projection based on historical averages
const projections = generateCashFlowProjections(accountId, 12)
// [{ year, month, beginningBalance, projectedIncome, projectedExpenses, endingBalance, isProjected }]

// 6-month summary
const summary = cashFlowSummary.value
// { currentBalance, projectedBalance6Mo, avgMonthlyIncome, avgMonthlyExpenses, monthsUntilNegative, trend }
```

#### Multi-Year Budget Comparison

```javascript
// Compares current year with prior two years
const comparison = multiYearComparison.value
// { years: [2023, 2024, 2025], categories: [...], totals: { yoyChange, yoyPercent } }

// Trend analysis
const trend = budgetTrendAnalysis.value
// { increasing: [...], decreasing: [...], stable: [...], overallTrend, totalChange }
```

#### Financial Health Score

```javascript
const health = financialHealthScore.value
// { score: 85, grade: 'B', status: 'healthy', issues: ['Budget overage warning'] }
```

The score starts at 100 and deducts points for:
- Budget variance > 10% (-5 to -30 points)
- Negative cash flow or projected negative balance (-15 to -30 points)
- Low reserve fund balance (-10 to -20 points)
- Large year-over-year budget increases (-10 points)

---

### useReserveStudy

**File:** `composables/useReserveStudy.js`

Tracks building reserve studies, component inventories, and generates 30-year funding projections per Florida HOA requirements.

#### Basic Usage

```javascript
const {
  currentStudy,
  components,
  reserveAccountBalance,
  fetchCurrentStudy,
  fetchReserveBalance,
  createStudy,
  createComponent,
  updateComponent,
  calculateFundingProjections,
  getUpcomingReplacements,
  criticalComponents,
  percentFunded,
  fundingStatus,
  totalReplacementCosts,
  componentsByCategory,
  formatCurrency,
} = useReserveStudy()

// Load reserve study for fiscal year
await fetchCurrentStudy(2025)
await fetchReserveBalance(2025)
```

#### Components

```javascript
// Add a component
await createComponent({
  name: 'Roof Replacement',
  category: 'building', // building | mechanical | electrical | plumbing | exterior | common_area | safety | other
  useful_life_years: 25,
  remaining_life_years: 10,
  placed_in_service_year: 2010,
  replacement_year: 2035,
  replacement_cost: 250000,
  condition: 'fair', // excellent | good | fair | poor | critical
})

// Get components needing attention
const critical = criticalComponents.value // poor/critical condition or due within 2 years
const upcoming = getUpcomingReplacements(5) // due within 5 years
```

#### Funding Projections

```javascript
// 30-year projection
const projections = calculateFundingProjections(30)
// [{ year, beginningBalance, contributions, expenditures, endingBalance, replacementsDue, isDeficit }]

// Funding status
console.log(percentFunded.value) // 65
console.log(fundingStatus.value) // { status: 'adequate', label: 'Adequately Funded', color: 'yellow' }
```

Funding status thresholds:
- **>= 70%** -- Well Funded (green)
- **>= 50%** -- Adequately Funded (yellow)
- **>= 30%** -- Underfunded (orange)
- **< 30%** -- Critically Underfunded (red)

---

### useAssessmentLedger

**File:** `composables/useAssessmentLedger.js`

Tracks monthly assessment charges and payments for each unit, with aging reports and delinquency management.

#### Basic Usage

```javascript
const {
  ledgerEntries,
  units,
  loading,
  fetchUnits,
  fetchLedgerEntries,
  createLedgerEntry,
  recordPayment,
  generateMonthlyAssessments,
  updateAllStatuses,
  delinquentAccounts,
  agingReport,
  unitsWithBalances,
  totalOutstandingBalance,
  formatCurrency,
} = useAssessmentLedger()

// Load data
await fetchUnits()
await fetchLedgerEntries(2025)
```

#### Generating Assessments

```javascript
// Generate monthly assessments for all units
await generateMonthlyAssessments(2025, '03', 850.00, '2025-03-01')
// Creates a ledger entry for each unit that doesn't already have one for that month
```

#### Recording Payments

```javascript
await recordPayment(entryId, {
  amount_paid: 850.00,
  payment_date: '2025-03-10',
  transaction_id: transactionId,
  notes: 'Online payment',
})
```

#### Delinquency Tracking

```javascript
// Update all statuses based on current date
await updateAllStatuses(2025)

// Aging report
const aging = agingReport.value
// { current: { count, amount }, '1-30': {...}, '31-60': {...}, '61-90': {...}, '90+': {...} }

// Total outstanding
console.log(formatCurrency(totalOutstandingBalance.value))

// Units with balances
const units = unitsWithBalances.value
// [{ ...unit, totalDue, totalPaid, balance, delinquentMonths, isDelinquent }]
```

Payment status progression:
- **Current** -- Paid or not yet due
- **Late** (1-30 days) -- Past grace period, late fee applied
- **Delinquent** (31-90 days) -- Formal delinquency notice
- **Lien** (91-180 days) -- Lien filed against unit
- **Collections** (180+ days) -- Sent to collections

Late fees: 10% of outstanding balance or $25 flat fee, whichever is greater. Applied after a 15-day grace period.

---

### useComplianceAlerts

**File:** `composables/useComplianceAlerts.js`

Monitors transactions for Florida HOA compliance issues, particularly fund segregation between Operating (Account 5129), Reserve (Account 7011), and Special Assessment (Account 5872) accounts.

#### Basic Usage

```javascript
const {
  alerts,
  loading,
  fetchAlerts,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  analyzeTransaction,
  scanTransactionsForIssues,
  checkTransferCompliance,
  unresolvedAlerts,
  criticalAlerts,
  boardActionRequired,
  alertCounts,
} = useComplianceAlerts()

// Fetch existing alerts
await fetchAlerts({ unresolved: true })
```

#### Scanning Transactions

```javascript
// Scan all transactions for a fiscal year
const newAlerts = await scanTransactionsForIssues(2025)

// Analyze a single transaction
const issues = analyzeTransaction(transaction)
// [{ alert_type, severity, title, description, requires_board_action }]
```

#### Transfer Compliance Check

```javascript
// Check before executing a transfer
const result = checkTransferCompliance(fromAccountId, toAccountId, amount, description)
// { isBlocked: false, requiresApproval: true, issues: [...] }

// Blocked transfers (Florida Chapter 720.303(6)):
// - Special Assessment -> Operating: BLOCKED (fund commingling)
// - Reserve -> Operating: Requires board resolution
```

#### Alert Management

```javascript
// Acknowledge an alert
await acknowledgeAlert(alertId)

// Resolve with notes
await resolveAlert(alertId, 'Verified against invoice #5678', 'Board Resolution 2025-03')
```

Alert types:
- `fund_mixing` -- Potential commingling of restricted funds (critical)
- `reserve_withdrawal` -- Withdrawal from reserve account (warning)
- `budget_overage` -- Category over budget (warning)
- `delinquency` -- Unit delinquent on assessments (warning)
- `approval_required` -- Transaction over $10,000 (warning)

---

### useAuditLog

**File:** `composables/useAuditLog.js`

Provides a full audit trail for all financial operations. Audit logging is non-blocking -- if logging fails, the main operation continues.

#### Basic Usage

```javascript
const {
  logs,
  loading,
  fetchLogs,
  logCreate,
  logUpdate,
  logDelete,
  logReconcile,
  logApprove,
  logLogin,
  logLogout,
  getItemHistory,
  getRecentActivity,
  formattedLogs,
  activitySummary,
} = useAuditLog()
```

#### Logging Actions

```javascript
// Log a create action
await logCreate('budget_categories', newCategory.id, newCategory, 'Created new budget category')

// Log an update with old and new values
await logUpdate('budget_items', itemId, oldValues, newValues, 'Updated monthly budget')

// Log a delete
await logDelete('transactions', transactionId, oldTransaction, 'Removed duplicate transaction')

// Log reconciliation
await logReconcile(transactionId, 'Reconciled against March statement')

// Log approval
await logApprove('budget_admendments', amendmentId, 'Board approved insurance rate change')
```

#### Querying Logs

```javascript
// Get history for a specific item
const history = await getItemHistory('transactions', transactionId)

// Get recent activity
const recent = await getRecentActivity(20)

// Fetch with filters
await fetchLogs({
  collection: 'budget_categories',
  action: 'update',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  limit: 50,
})

// Formatted logs with human-readable labels
const formatted = formattedLogs.value
// [{ action: 'Updated', collection: 'Budget Category', user: 'John Doe', timestamp, changes }]
```

#### Data Format

Audit log values are stored in Directus as `Array<{ value: string }>`. The composable handles serialization and deserialization automatically:

```javascript
// Stored as: [{ value: 'monthly_budget: 1500' }, { value: 'yearly_budget: 18000' }]
// Displayed as: { monthly_budget: 1500, yearly_budget: 18000 }
```

---

## Fiscal Year Management

All financial collections use a Many-to-One (M2O) relationship to the `fiscal_years` collection. This means:

1. **Fiscal year records must exist** in Directus before financial data can be created for that year
2. **Filtering by year** uses deep filtering: `{ fiscal_year: { year: { _eq: 2025 } } }`
3. **Creating records** requires resolving the fiscal year ID first

Each composable that creates records includes a `resolveFiscalYearId` helper that looks up (and caches) the `fiscal_years` record ID for a given year number.

### Setting Up a Fiscal Year in Directus

Create a record in the `fiscal_years` collection with:
- `year`: The year number (e.g., `2025`)
- `start_date`: The fiscal year start date (e.g., `2025-01-01`)
- `status`: Set to `published`

---

## Account Structure

The system manages three segregated bank accounts:

| ID | Account | Purpose |
|----|---------|---------|
| 1 | Operating (5129) | Day-to-day expenses, assessments, vendor payments |
| 2 | Reserve (7011) | Long-term capital reserves for building components |
| 3 | Special Assessment (5872) | 40-Year Recertification special assessment funds |

Florida law requires these funds to remain segregated. The compliance alerts system monitors transactions to detect potential fund commingling.

---

## Workflows

### Setting Up a New Fiscal Year

1. Create a `fiscal_years` record in Directus with the year and start date
2. Use `useBudgetManagement`:
   ```javascript
   // Option A: Copy last year's budget
   await copyBudgetToYear(2025, 2026)

   // Option B: Start from template
   await createBudgetFromTemplate(2026)
   ```
3. Adjust category and item budgets as needed
4. Set the fiscal year budget as active

### Monthly Reconciliation

1. Import bank transactions for the month
2. Run auto-categorization:
   ```javascript
   const { initializeMatching, batchApplyAutoCategorization } = useTransactionMatching()
   await initializeMatching(2025)
   const uncategorized = await getUncategorizedTransactions(2025, accountId)
   const categorized = batchAutoCategorize(uncategorized)
   await batchApplyAutoCategorization(categorized)
   ```
3. Review and reconcile transactions:
   ```javascript
   const { bulkReconcileTransactions } = useReconciliationNotes()
   await bulkReconcileTransactions(verifiedTransactionIds)
   ```
4. Generate the monthly reconciliation report:
   ```javascript
   const reportData = await generateMonthlyReport(2025, accountId, '03', transactions, statement)
   await createReconciliationReport(reportData)
   ```
5. Add notes for any discrepancies

### Budget Amendments

1. Create the amendment:
   ```javascript
   await createBudgetAmendment({
     budget_item_id: itemId,
     effective_date: '2025-07-01',
     amended_annual_amount: 48000,
     reason: 'Insurance premium increase',
   })
   ```
2. Board reviews and approves:
   ```javascript
   await approveBudgetAmendment(amendmentId, approverUserId)
   ```
3. Budget item amounts are automatically updated
4. Category totals are recalculated

### Assessment Tracking

1. Generate monthly assessments for all units:
   ```javascript
   await generateMonthlyAssessments(2025, '03', 850.00, '2025-03-01')
   ```
2. Record payments as they come in:
   ```javascript
   await recordPayment(entryId, { amount_paid: 850.00, transaction_id: txId })
   ```
3. Periodically update statuses and late fees:
   ```javascript
   await updateAllStatuses(2025)
   ```
4. Review the aging report for delinquent accounts

### Compliance Monitoring

1. Scan transactions periodically:
   ```javascript
   await scanTransactionsForIssues(2025)
   ```
2. Review alerts:
   ```javascript
   await fetchAlerts({ unresolved: true })
   const critical = criticalAlerts.value
   const boardItems = boardActionRequired.value
   ```
3. Acknowledge and resolve alerts with documentation
4. Check transfers before execution:
   ```javascript
   const result = checkTransferCompliance(fromId, toId, amount, description)
   if (result.isBlocked) {
     // Prevent transfer
   }
   ```
