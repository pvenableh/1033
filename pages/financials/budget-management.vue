<template>
	<div class="container mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 dark:text-white">
						BUDGET MANAGEMENT
					</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Create and manage operating budgets by fiscal year
					</p>
				</div>
				<div class="flex items-center gap-3">
					<USelectMenu
						v-model="selectedYear"
						:options="yearOptions"
						size="lg"
						class="w-32"
						placeholder="Select Year" />
					<UButton
						color="primary"
						variant="soft"
						icon="i-heroicons-plus"
						@click="showNewBudgetModal = true">
						New Budget
					</UButton>
				</div>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="loading" class="text-center py-12">
			<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400 mx-auto" />
			<p class="mt-2 text-gray-500 dark:text-gray-400">Loading budget data...</p>
		</div>

		<!-- No Budget State -->
		<div v-else-if="!fiscalYearBudget && !loading" class="text-center py-12">
			<UIcon name="i-heroicons-document-currency-dollar" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
			<h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Budget Found for {{ selectedYear }}</h3>
			<p class="text-gray-500 dark:text-gray-400 mb-6">Create a new budget to get started</p>
			<div class="flex items-center justify-center gap-3">
				<UButton color="primary" @click="createFromTemplate">
					<UIcon name="i-heroicons-document-plus" class="w-4 h-4 mr-2" />
					Create from Template
				</UButton>
				<UButton v-if="availableYears.length > 1" color="gray" variant="outline" @click="showCopyBudgetModal = true">
					<UIcon name="i-heroicons-document-duplicate" class="w-4 h-4 mr-2" />
					Copy from Another Year
				</UButton>
			</div>
		</div>

		<!-- Budget Content -->
		<template v-else>
			<!-- Budget Overview Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<UCard class="text-center">
					<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">Yearly Revenue</p>
					<p class="text-2xl font-bold text-green-700 dark:text-green-400">
						{{ formatCurrency(budgetTotals.yearlyRevenue) }}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						{{ formatCurrency(budgetTotals.monthlyRevenue) }}/month
					</p>
				</UCard>

				<UCard class="text-center">
					<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">Yearly Expenses</p>
					<p class="text-2xl font-bold text-red-700 dark:text-red-400">
						{{ formatCurrency(budgetTotals.yearlyExpenses) }}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						{{ formatCurrency(budgetTotals.monthlyExpenses) }}/month
					</p>
				</UCard>

				<UCard class="text-center">
					<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">Net Operating</p>
					<p class="text-2xl font-bold" :class="budgetTotals.yearlyNet >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
						{{ formatCurrency(budgetTotals.yearlyNet) }}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						{{ formatCurrency(budgetTotals.monthlyNet) }}/month
					</p>
				</UCard>

				<UCard class="text-center">
					<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">Assessment</p>
					<p class="text-2xl font-bold text-blue-700 dark:text-blue-400">
						{{ formatCurrency(budgetTotals.monthlyAssessment) }}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						{{ budgetTotals.unitCount }} units
					</p>
				</UCard>
			</div>

			<!-- Main Content Tabs -->
			<UTabs :items="tabs" class="w-full">
				<!-- Categories Tab -->
				<template #categories>
					<UCard class="mt-4">
						<template #header>
							<div class="flex items-center justify-between">
								<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
									BUDGET CATEGORIES - {{ selectedYear }}
								</h2>
								<UButton
									color="primary"
									variant="soft"
									size="sm"
									icon="i-heroicons-plus"
									@click="openCategoryModal()">
									Add Category
								</UButton>
							</div>
						</template>

						<div class="space-y-4">
							<div
								v-for="category in budgetCategories"
								:key="category.id"
								class="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div
											class="w-4 h-4 rounded-full"
											:style="{ backgroundColor: category.color || '#6B7280' }"></div>
										<div>
											<h4 class="font-semibold dark:text-white">{{ category.category_name }}</h4>
											<p class="text-sm text-gray-500 dark:text-gray-400">{{ category.description }}</p>
										</div>
									</div>
									<div class="flex items-center gap-4">
										<div class="text-right">
											<p class="font-semibold dark:text-white">{{ formatCurrency(category.yearly_budget) }}/year</p>
											<p class="text-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(category.monthly_budget) }}/month</p>
										</div>
										<UDropdown :items="getCategoryActions(category)">
											<UButton color="gray" variant="ghost" size="sm" icon="i-heroicons-ellipsis-vertical" />
										</UDropdown>
									</div>
								</div>

								<!-- Category Items -->
								<div v-if="itemsByCategory[category.id]?.items?.length" class="mt-4 pl-7 space-y-2">
									<div
										v-for="item in itemsByCategory[category.id].items"
										:key="item.id"
										class="flex items-center justify-between text-sm py-2 border-t dark:border-gray-700">
										<div>
											<span class="font-medium dark:text-gray-200">{{ item.description }}</span>
											<span v-if="item.item_code" class="text-gray-400 ml-2">({{ item.item_code }})</span>
										</div>
										<div class="flex items-center gap-3">
											<span class="dark:text-gray-300">{{ formatCurrency(item.yearly_budget) }}/year</span>
											<UButton
												color="gray"
												variant="ghost"
												size="xs"
												icon="i-heroicons-pencil"
												@click="openItemModal(item, category.id)" />
										</div>
									</div>
								</div>

								<!-- Add Item Button -->
								<div class="mt-3 pl-7">
									<UButton
										color="gray"
										variant="ghost"
										size="xs"
										icon="i-heroicons-plus"
										@click="openItemModal(null, category.id)">
										Add Item
									</UButton>
								</div>
							</div>

							<div v-if="budgetCategories.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
								<UIcon name="i-heroicons-folder-open" class="w-12 h-12 mx-auto mb-2" />
								<p>No budget categories defined</p>
								<p class="text-sm">Add categories to organize your budget items</p>
							</div>
						</div>
					</UCard>
				</template>

				<!-- Revenue Tab -->
				<template #revenue>
					<UCard class="mt-4">
						<template #header>
							<div class="flex items-center justify-between">
								<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
									REVENUE CONFIGURATION - {{ selectedYear }}
								</h2>
								<UButton
									color="primary"
									variant="soft"
									size="sm"
									icon="i-heroicons-pencil"
									@click="showRevenueModal = true">
									Edit Revenue
								</UButton>
							</div>
						</template>

						<div class="space-y-6">
							<!-- Assessment Income -->
							<div class="border dark:border-gray-700 rounded-lg p-4">
								<div class="flex justify-between items-start mb-4">
									<div>
										<h4 class="font-bold text-lg dark:text-white">Assessment Income</h4>
										<p class="text-sm text-gray-600 dark:text-gray-400">
											{{ budgetTotals.unitCount }} units × {{ formatCurrency(budgetTotals.monthlyAssessment) }}/month
										</p>
									</div>
									<div class="text-right">
										<p class="text-2xl font-bold text-green-700 dark:text-green-400">
											{{ formatCurrency(budgetTotals.unitCount * budgetTotals.monthlyAssessment * 12) }}
										</p>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											{{ formatCurrency(budgetTotals.unitCount * budgetTotals.monthlyAssessment) }}/month
										</p>
									</div>
								</div>
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
										<p class="text-gray-500 dark:text-gray-400">Per Unit Annual</p>
										<p class="font-semibold dark:text-white">{{ formatCurrency(budgetTotals.monthlyAssessment * 12) }}</p>
									</div>
									<div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
										<p class="text-gray-500 dark:text-gray-400">Total Units</p>
										<p class="font-semibold dark:text-white">{{ budgetTotals.unitCount }}</p>
									</div>
								</div>
							</div>

							<!-- Total Revenue -->
							<div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
								<div class="flex justify-between items-center">
									<span class="font-semibold text-green-800 dark:text-green-300">TOTAL PROJECTED REVENUE</span>
									<span class="text-2xl font-bold text-green-700 dark:text-green-400">
										{{ formatCurrency(budgetTotals.yearlyRevenue) }}
									</span>
								</div>
							</div>
						</div>
					</UCard>
				</template>

				<!-- Summary Tab -->
				<template #summary>
					<UCard class="mt-4">
						<template #header>
							<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
								BUDGET SUMMARY - {{ selectedYear }}
							</h2>
						</template>

						<div class="space-y-6">
							<!-- Summary Table -->
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b-2 border-gray-300 dark:border-gray-600">
											<th class="py-3 px-4 text-left uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
												Category
											</th>
											<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
												Monthly
											</th>
											<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
												Annual
											</th>
											<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
												% of Total
											</th>
										</tr>
									</thead>
									<tbody>
										<!-- Revenue Row -->
										<tr class="border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
											<td class="py-3 px-4 font-bold text-green-800 dark:text-green-300">TOTAL REVENUE</td>
											<td class="py-3 px-4 text-right font-bold text-green-700 dark:text-green-400">
												{{ formatCurrency(budgetTotals.monthlyRevenue) }}
											</td>
											<td class="py-3 px-4 text-right font-bold text-green-700 dark:text-green-400">
												{{ formatCurrency(budgetTotals.yearlyRevenue) }}
											</td>
											<td class="py-3 px-4 text-right font-bold dark:text-white">100%</td>
										</tr>

										<!-- Expense Categories -->
										<tr
											v-for="category in budgetCategories"
											:key="category.id"
											class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
											<td class="py-3 px-4 dark:text-gray-200">
												<div class="flex items-center gap-2">
													<div
														class="w-3 h-3 rounded-full"
														:style="{ backgroundColor: category.color || '#6B7280' }"></div>
													{{ category.category_name }}
												</div>
											</td>
											<td class="py-3 px-4 text-right dark:text-gray-200">
												{{ formatCurrency(category.monthly_budget) }}
											</td>
											<td class="py-3 px-4 text-right dark:text-gray-200">
												{{ formatCurrency(category.yearly_budget) }}
											</td>
											<td class="py-3 px-4 text-right dark:text-gray-300">
												{{ budgetTotals.yearlyRevenue > 0 ? ((category.yearly_budget / budgetTotals.yearlyRevenue) * 100).toFixed(1) : 0 }}%
											</td>
										</tr>

										<!-- Total Expenses Row -->
										<tr class="border-b-2 border-gray-400 dark:border-gray-500 bg-red-50 dark:bg-red-900/20">
											<td class="py-3 px-4 font-bold text-red-800 dark:text-red-300">TOTAL EXPENSES</td>
											<td class="py-3 px-4 text-right font-bold text-red-700 dark:text-red-400">
												{{ formatCurrency(budgetTotals.monthlyExpenses) }}
											</td>
											<td class="py-3 px-4 text-right font-bold text-red-700 dark:text-red-400">
												{{ formatCurrency(budgetTotals.yearlyExpenses) }}
											</td>
											<td class="py-3 px-4 text-right font-bold dark:text-white">
												{{ budgetTotals.yearlyRevenue > 0 ? ((budgetTotals.yearlyExpenses / budgetTotals.yearlyRevenue) * 100).toFixed(1) : 0 }}%
											</td>
										</tr>

										<!-- Net Operating Row -->
										<tr :class="budgetTotals.yearlyNet >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'">
											<td class="py-3 px-4 font-bold uppercase" :class="budgetTotals.yearlyNet >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-yellow-800 dark:text-yellow-300'">
												NET OPERATING
											</td>
											<td class="py-3 px-4 text-right font-bold" :class="budgetTotals.monthlyNet >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-yellow-700 dark:text-yellow-400'">
												{{ formatCurrency(budgetTotals.monthlyNet) }}
											</td>
											<td class="py-3 px-4 text-right font-bold" :class="budgetTotals.yearlyNet >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-yellow-700 dark:text-yellow-400'">
												{{ formatCurrency(budgetTotals.yearlyNet) }}
											</td>
											<td class="py-3 px-4 text-right font-bold dark:text-white">
												{{ budgetTotals.yearlyRevenue > 0 ? ((budgetTotals.yearlyNet / budgetTotals.yearlyRevenue) * 100).toFixed(2) : 0 }}%
											</td>
										</tr>
									</tbody>
								</table>
							</div>

							<!-- Budget Status -->
							<div class="p-4 rounded-lg" :class="budgetTotals.yearlyNet >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'">
								<div class="flex items-center gap-2">
									<UIcon
										:name="budgetTotals.yearlyNet >= 0 ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'"
										class="w-5 h-5"
										:class="budgetTotals.yearlyNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'" />
									<span class="font-semibold" :class="budgetTotals.yearlyNet >= 0 ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'">
										{{ budgetTotals.yearlyNet >= 0 ? 'BALANCED BUDGET' : 'DEFICIT BUDGET' }}
									</span>
								</div>
								<p class="text-sm mt-1" :class="budgetTotals.yearlyNet >= 0 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'">
									{{ budgetTotals.yearlyNet >= 0
										? `This budget projects a surplus of ${formatCurrency(budgetTotals.yearlyNet)} for the year.`
										: `This budget projects a deficit of ${formatCurrency(Math.abs(budgetTotals.yearlyNet))}. Consider adjusting revenue or expenses.` }}
								</p>
							</div>
						</div>
					</UCard>
				</template>

				<!-- Actions Tab -->
				<template #actions>
					<UCard class="mt-4">
						<template #header>
							<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
								BUDGET ACTIONS
							</h2>
						</template>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<!-- Copy Budget -->
							<div class="border dark:border-gray-700 rounded-lg p-6">
								<div class="flex items-center gap-3 mb-4">
									<UIcon name="i-heroicons-document-duplicate" class="w-8 h-8 text-blue-500" />
									<div>
										<h4 class="font-semibold dark:text-white">Copy to New Year</h4>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Duplicate this budget for a different fiscal year
										</p>
									</div>
								</div>
								<UButton color="blue" variant="soft" @click="showCopyBudgetModal = true">
									Copy Budget
								</UButton>
							</div>

							<!-- Export Budget -->
							<div class="border dark:border-gray-700 rounded-lg p-6">
								<div class="flex items-center gap-3 mb-4">
									<UIcon name="i-heroicons-arrow-down-tray" class="w-8 h-8 text-green-500" />
									<div>
										<h4 class="font-semibold dark:text-white">Export Budget</h4>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Download budget data as CSV or PDF
										</p>
									</div>
								</div>
								<div class="flex gap-2">
									<UButton color="green" variant="soft" @click="exportCSV">
										Export CSV
									</UButton>
									<UButton color="green" variant="outline" @click="exportPDF">
										Export PDF
									</UButton>
								</div>
							</div>

							<!-- Approve Budget -->
							<div class="border dark:border-gray-700 rounded-lg p-6">
								<div class="flex items-center gap-3 mb-4">
									<UIcon name="i-heroicons-check-badge" class="w-8 h-8 text-purple-500" />
									<div>
										<h4 class="font-semibold dark:text-white">Approve Budget</h4>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Mark this budget as officially approved
										</p>
									</div>
								</div>
								<UButton
									v-if="!fiscalYearBudget?.approved_date"
									color="purple"
									variant="soft"
									@click="approveBudget">
									Approve Budget
								</UButton>
								<div v-else class="text-sm text-green-600 dark:text-green-400">
									<UIcon name="i-heroicons-check-circle" class="w-4 h-4 inline mr-1" />
									Approved on {{ formatDate(fiscalYearBudget.approved_date) }}
								</div>
							</div>

							<!-- Delete Budget -->
							<div class="border border-red-200 dark:border-red-900 rounded-lg p-6">
								<div class="flex items-center gap-3 mb-4">
									<UIcon name="i-heroicons-trash" class="w-8 h-8 text-red-500" />
									<div>
										<h4 class="font-semibold dark:text-white">Delete Budget</h4>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Permanently remove this budget (cannot be undone)
										</p>
									</div>
								</div>
								<UButton color="red" variant="soft" @click="confirmDeleteBudget">
									Delete Budget
								</UButton>
							</div>
						</div>
					</UCard>
				</template>
			</UTabs>
		</template>

		<!-- Category Modal -->
		<UModal v-model="showCategoryModal">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold dark:text-white">
						{{ editingCategory ? 'Edit Category' : 'Add Category' }}
					</h3>
				</template>

				<div class="space-y-4">
					<UFormGroup label="Category Name" required>
						<UInput v-model="categoryForm.category_name" placeholder="e.g., Insurance" />
					</UFormGroup>

					<UFormGroup label="Description">
						<UTextarea v-model="categoryForm.description" placeholder="Brief description of this category" rows="2" />
					</UFormGroup>

					<div class="grid grid-cols-2 gap-4">
						<UFormGroup label="Monthly Budget">
							<UInput v-model="categoryForm.monthly_budget" type="number" step="0.01" placeholder="0.00" />
						</UFormGroup>
						<UFormGroup label="Yearly Budget">
							<UInput v-model="categoryForm.yearly_budget" type="number" step="0.01" placeholder="0.00" />
						</UFormGroup>
					</div>

					<UFormGroup label="Color">
						<div class="flex items-center gap-2">
							<input
								v-model="categoryForm.color"
								type="color"
								class="w-10 h-10 rounded cursor-pointer" />
							<UInput v-model="categoryForm.color" placeholder="#6B7280" class="flex-1" />
						</div>
					</UFormGroup>
				</div>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton color="gray" variant="ghost" @click="showCategoryModal = false">Cancel</UButton>
						<UButton color="primary" :loading="saving" @click="saveCategory">
							{{ editingCategory ? 'Update' : 'Create' }}
						</UButton>
					</div>
				</template>
			</UCard>
		</UModal>

		<!-- Item Modal -->
		<UModal v-model="showItemModal">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold dark:text-white">
						{{ editingItem ? 'Edit Budget Item' : 'Add Budget Item' }}
					</h3>
				</template>

				<div class="space-y-4">
					<UFormGroup label="Item Code">
						<UInput v-model="itemForm.item_code" placeholder="e.g., INS-001" />
					</UFormGroup>

					<UFormGroup label="Description" required>
						<UInput v-model="itemForm.description" placeholder="e.g., Building Insurance Premium" />
					</UFormGroup>

					<div class="grid grid-cols-2 gap-4">
						<UFormGroup label="Monthly Budget">
							<UInput v-model="itemForm.monthly_budget" type="number" step="0.01" placeholder="0.00" />
						</UFormGroup>
						<UFormGroup label="Yearly Budget">
							<UInput v-model="itemForm.yearly_budget" type="number" step="0.01" placeholder="0.00" />
						</UFormGroup>
					</div>

					<UFormGroup label="Vendor Keywords">
						<UInput v-model="itemForm.vendor_patterns_text" placeholder="Keywords separated by commas" />
						<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
							Used for automatic transaction categorization
						</p>
					</UFormGroup>
				</div>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton color="gray" variant="ghost" @click="showItemModal = false">Cancel</UButton>
						<UButton color="primary" :loading="saving" @click="saveItem">
							{{ editingItem ? 'Update' : 'Create' }}
						</UButton>
					</div>
				</template>
			</UCard>
		</UModal>

		<!-- Copy Budget Modal -->
		<UModal v-model="showCopyBudgetModal">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold dark:text-white">Copy Budget to New Year</h3>
				</template>

				<div class="space-y-4">
					<UFormGroup label="Source Year">
						<USelectMenu v-model="copyForm.sourceYear" :options="availableYearsOptions" />
					</UFormGroup>

					<UFormGroup label="Target Year">
						<UInput v-model="copyForm.targetYear" type="number" min="2020" max="2030" />
					</UFormGroup>

					<UAlert
						icon="i-heroicons-information-circle"
						color="blue"
						variant="soft"
						title="What will be copied">
						<template #description>
							<ul class="list-disc list-inside text-sm">
								<li>Budget configuration and settings</li>
								<li>All budget categories with amounts</li>
								<li>All budget items with vendor patterns</li>
							</ul>
						</template>
					</UAlert>
				</div>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton color="gray" variant="ghost" @click="showCopyBudgetModal = false">Cancel</UButton>
						<UButton color="primary" :loading="saving" @click="copyBudget">
							Copy Budget
						</UButton>
					</div>
				</template>
			</UCard>
		</UModal>

		<!-- Revenue Configuration Modal -->
		<UModal v-model="showRevenueModal">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold dark:text-white">Revenue Configuration</h3>
				</template>

				<div class="space-y-4">
					<UFormGroup label="Number of Units">
						<UInput v-model="revenueForm.unit_count" type="number" min="1" />
					</UFormGroup>

					<UFormGroup label="Monthly Assessment per Unit">
						<UInput v-model="revenueForm.monthly_assessment" type="number" step="0.01" placeholder="513.00" />
					</UFormGroup>

					<UFormGroup label="Total Annual Revenue (including other income)">
						<UInput v-model="revenueForm.total_revenue" type="number" step="0.01" />
					</UFormGroup>

					<div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
						<p class="dark:text-gray-200">
							<strong>Calculated Assessment Revenue:</strong>
							{{ formatCurrency(revenueForm.unit_count * revenueForm.monthly_assessment * 12) }}/year
						</p>
					</div>
				</div>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton color="gray" variant="ghost" @click="showRevenueModal = false">Cancel</UButton>
						<UButton color="primary" :loading="saving" @click="saveRevenue">
							Save
						</UButton>
					</div>
				</template>
			</UCard>
		</UModal>

		<!-- New Budget Modal -->
		<UModal v-model="showNewBudgetModal">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold dark:text-white">Create New Budget</h3>
				</template>

				<div class="space-y-4">
					<UFormGroup label="Fiscal Year" required>
						<UInput v-model="newBudgetForm.fiscal_year" type="number" min="2020" max="2030" />
					</UFormGroup>

					<UFormGroup label="Budget Name">
						<UInput v-model="newBudgetForm.name" placeholder="e.g., 2026 Operating Budget" />
					</UFormGroup>

					<UFormGroup label="Initialize From">
						<URadioGroup v-model="newBudgetForm.initializeFrom" :options="initializeOptions" />
					</UFormGroup>

					<UFormGroup v-if="newBudgetForm.initializeFrom === 'copy'" label="Copy from Year">
						<USelectMenu v-model="newBudgetForm.copyFromYear" :options="availableYearsOptions" />
					</UFormGroup>
				</div>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton color="gray" variant="ghost" @click="showNewBudgetModal = false">Cancel</UButton>
						<UButton color="primary" :loading="saving" @click="createNewBudget">
							Create Budget
						</UButton>
					</div>
				</template>
			</UCard>
		</UModal>
	</div>
</template>

<script setup>
const {
	selectedYear,
	loading,
	saving,
	availableYears,
	fiscalYearBudget,
	budgetCategories,
	budgetItems,
	itemsByCategory,
	budgetTotals,
	yearOptions,
	fetchBudgetData,
	createFiscalYearBudget,
	updateFiscalYearBudget,
	createBudgetCategory,
	updateBudgetCategory,
	deleteBudgetCategory,
	createBudgetItem,
	updateBudgetItem,
	deleteBudgetItem,
	copyBudgetToYear,
	createBudgetFromTemplate,
	formatCurrency,
} = useBudgetManagement();

// Local state
const showCategoryModal = ref(false);
const showItemModal = ref(false);
const showCopyBudgetModal = ref(false);
const showRevenueModal = ref(false);
const showNewBudgetModal = ref(false);
const editingCategory = ref(null);
const editingItem = ref(null);
const editingItemCategoryId = ref(null);

// Form state
const categoryForm = ref({
	category_name: '',
	description: '',
	monthly_budget: 0,
	yearly_budget: 0,
	color: '#6B7280',
});

const itemForm = ref({
	item_code: '',
	description: '',
	monthly_budget: 0,
	yearly_budget: 0,
	vendor_patterns_text: '',
});

const copyForm = ref({
	sourceYear: null,
	targetYear: new Date().getFullYear() + 1,
});

const revenueForm = ref({
	unit_count: 28,
	monthly_assessment: 513,
	total_revenue: 0,
});

const newBudgetForm = ref({
	fiscal_year: new Date().getFullYear() + 1,
	name: '',
	initializeFrom: 'template',
	copyFromYear: null,
});

// Tabs configuration
const tabs = [
	{ slot: 'categories', label: 'Categories', icon: 'i-heroicons-folder' },
	{ slot: 'revenue', label: 'Revenue', icon: 'i-heroicons-currency-dollar' },
	{ slot: 'summary', label: 'Summary', icon: 'i-heroicons-document-chart-bar' },
	{ slot: 'actions', label: 'Actions', icon: 'i-heroicons-cog-6-tooth' },
];

const initializeOptions = [
	{ label: 'Start from template (default categories)', value: 'template' },
	{ label: 'Copy from existing year', value: 'copy' },
	{ label: 'Start empty', value: 'empty' },
];

// Computed
const availableYearsOptions = computed(() =>
	availableYears.value.map((year) => ({
		label: year.toString(),
		value: year,
	}))
);

// Methods
const formatDate = (dateStr) => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
};

const openCategoryModal = (category = null) => {
	if (category) {
		editingCategory.value = category;
		categoryForm.value = {
			category_name: category.category_name,
			description: category.description || '',
			monthly_budget: category.monthly_budget || 0,
			yearly_budget: category.yearly_budget || 0,
			color: category.color || '#6B7280',
		};
	} else {
		editingCategory.value = null;
		categoryForm.value = {
			category_name: '',
			description: '',
			monthly_budget: 0,
			yearly_budget: 0,
			color: '#6B7280',
		};
	}
	showCategoryModal.value = true;
};

const openItemModal = (item = null, categoryId = null) => {
	if (item) {
		editingItem.value = item;
		editingItemCategoryId.value = categoryId;
		itemForm.value = {
			item_code: item.item_code || '',
			description: item.description || '',
			monthly_budget: item.monthly_budget || 0,
			yearly_budget: item.yearly_budget || 0,
			vendor_patterns_text: (item.vendor_patterns || []).join(', '),
		};
	} else {
		editingItem.value = null;
		editingItemCategoryId.value = categoryId;
		itemForm.value = {
			item_code: '',
			description: '',
			monthly_budget: 0,
			yearly_budget: 0,
			vendor_patterns_text: '',
		};
	}
	showItemModal.value = true;
};

const saveCategory = async () => {
	try {
		if (editingCategory.value) {
			await updateBudgetCategory(editingCategory.value.id, categoryForm.value);
		} else {
			await createBudgetCategory(categoryForm.value);
		}
		showCategoryModal.value = false;
	} catch (e) {
		console.error('Error saving category:', e);
	}
};

const saveItem = async () => {
	try {
		const itemData = {
			...itemForm.value,
			category_id: editingItemCategoryId.value,
			vendor_patterns: itemForm.value.vendor_patterns_text
				.split(',')
				.map((p) => p.trim())
				.filter((p) => p),
		};

		if (editingItem.value) {
			await updateBudgetItem(editingItem.value.id, itemData);
		} else {
			await createBudgetItem(itemData);
		}
		showItemModal.value = false;
	} catch (e) {
		console.error('Error saving item:', e);
	}
};

const getCategoryActions = (category) => {
	return [
		[
			{
				label: 'Edit',
				icon: 'i-heroicons-pencil',
				click: () => openCategoryModal(category),
			},
			{
				label: 'Add Item',
				icon: 'i-heroicons-plus',
				click: () => openItemModal(null, category.id),
			},
		],
		[
			{
				label: 'Delete',
				icon: 'i-heroicons-trash',
				color: 'red',
				click: () => confirmDeleteCategory(category),
			},
		],
	];
};

const confirmDeleteCategory = async (category) => {
	if (confirm(`Delete category "${category.category_name}"? This will also delete all items in this category.`)) {
		await deleteBudgetCategory(category.id);
	}
};

const copyBudget = async () => {
	try {
		await copyBudgetToYear(copyForm.value.sourceYear, copyForm.value.targetYear);
		showCopyBudgetModal.value = false;
	} catch (e) {
		console.error('Error copying budget:', e);
	}
};

const createFromTemplate = async () => {
	try {
		await createBudgetFromTemplate(selectedYear.value);
	} catch (e) {
		console.error('Error creating budget from template:', e);
	}
};

const createNewBudget = async () => {
	try {
		if (newBudgetForm.value.initializeFrom === 'copy' && newBudgetForm.value.copyFromYear) {
			await copyBudgetToYear(newBudgetForm.value.copyFromYear, newBudgetForm.value.fiscal_year);
		} else if (newBudgetForm.value.initializeFrom === 'template') {
			await createBudgetFromTemplate(newBudgetForm.value.fiscal_year);
		} else {
			await createFiscalYearBudget({
				fiscal_year: newBudgetForm.value.fiscal_year,
				name: newBudgetForm.value.name || `${newBudgetForm.value.fiscal_year} Operating Budget`,
			});
		}
		showNewBudgetModal.value = false;
		selectedYear.value = newBudgetForm.value.fiscal_year;
	} catch (e) {
		console.error('Error creating new budget:', e);
	}
};

const saveRevenue = async () => {
	try {
		if (fiscalYearBudget.value) {
			await updateFiscalYearBudget(fiscalYearBudget.value.id, {
				unit_count: revenueForm.value.unit_count,
				monthly_assessment: revenueForm.value.monthly_assessment,
				total_revenue: revenueForm.value.total_revenue,
			});
		}
		showRevenueModal.value = false;
	} catch (e) {
		console.error('Error saving revenue:', e);
	}
};

const approveBudget = async () => {
	if (!confirm('Approve this budget? This will mark it as officially approved.')) return;

	try {
		if (fiscalYearBudget.value) {
			await updateFiscalYearBudget(fiscalYearBudget.value.id, {
				approved_date: new Date().toISOString(),
				is_active: true,
			});
		}
	} catch (e) {
		console.error('Error approving budget:', e);
	}
};

const confirmDeleteBudget = async () => {
	if (!confirm('Are you sure you want to delete this entire budget? This cannot be undone.')) return;
	// Implementation would delete the fiscal year budget and all related data
	console.log('Delete budget not yet implemented');
};

const exportCSV = () => {
	// Generate CSV export
	const headers = ['Category', 'Item', 'Monthly', 'Yearly'];
	const rows = [];

	budgetCategories.value.forEach((category) => {
		rows.push([category.category_name, '', category.monthly_budget, category.yearly_budget]);
		const items = itemsByCategory.value[category.id]?.items || [];
		items.forEach((item) => {
			rows.push(['', item.description, item.monthly_budget, item.yearly_budget]);
		});
	});

	const csvContent =
		'data:text/csv;charset=utf-8,' +
		[headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

	const link = document.createElement('a');
	link.setAttribute('href', encodeURI(csvContent));
	link.setAttribute('download', `budget-${selectedYear.value}.csv`);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

const exportPDF = () => {
	// PDF export would require a library like jsPDF
	console.log('PDF export not yet implemented');
};

// Initialize
onMounted(async () => {
	await fetchBudgetData();

	// Initialize copy form with current year
	if (availableYears.value.length > 0) {
		copyForm.value.sourceYear = availableYears.value[0];
	}

	// Initialize revenue form from fiscal year budget
	if (fiscalYearBudget.value) {
		revenueForm.value = {
			unit_count: fiscalYearBudget.value.unit_count || 28,
			monthly_assessment: fiscalYearBudget.value.monthly_assessment || 513,
			total_revenue: fiscalYearBudget.value.total_revenue || 0,
		};
	}
});

// Watch for fiscal year budget changes
watch(fiscalYearBudget, (newVal) => {
	if (newVal) {
		revenueForm.value = {
			unit_count: newVal.unit_count || 28,
			monthly_assessment: newVal.monthly_assessment || 513,
			total_revenue: newVal.total_revenue || 0,
		};
	}
});
</script>
