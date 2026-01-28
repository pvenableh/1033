// composables/useTransactionMatching.js
// Automated transaction-to-budget item matching using vendor patterns and keywords

export const useTransactionMatching = () => {
	const budgetItemsCollection = useDirectusItems('budget_items');
	const budgetCategoriesCollection = useDirectusItems('budget_categories');
	const transactionsCollection = useDirectusItems('transactions');
	const vendorsCollection = useDirectusItems('vendors');

	// State
	const budgetItems = ref([]);
	const budgetCategories = ref([]);
	const vendors = ref([]);
	const loading = ref(false);
	const error = ref(null);

	// Fetch budget items with their patterns
	const fetchBudgetItems = async (fiscalYear) => {
		try {
			const data = await budgetItemsCollection.list({
				filter: { fiscal_year: { year: { _eq: fiscalYear } } },
				fields: ['*', 'category_id.*'],
			});
			budgetItems.value = data || [];
		} catch (e) {
			console.error('Error fetching budget items:', e);
			budgetItems.value = [];
		}
	};

	// Fetch budget categories
	const fetchBudgetCategories = async (fiscalYear) => {
		try {
			const data = await budgetCategoriesCollection.list({
				filter: { fiscal_year: { year: { _eq: fiscalYear } } },
				fields: ['*'],
			});
			budgetCategories.value = data || [];
		} catch (e) {
			console.error('Error fetching budget categories:', e);
			budgetCategories.value = [];
		}
	};

	// Fetch vendors with their matching keywords
	const fetchVendors = async () => {
		try {
			const data = await vendorsCollection.list({
				fields: ['*'],
			});
			vendors.value = data || [];
		} catch (e) {
			console.error('Error fetching vendors:', e);
			vendors.value = [];
		}
	};

	// Initialize matching data
	const initializeMatching = async (fiscalYear) => {
		loading.value = true;
		error.value = null;

		try {
			await Promise.all([
				fetchBudgetItems(fiscalYear),
				fetchBudgetCategories(fiscalYear),
				fetchVendors(),
			]);
		} catch (e) {
			error.value = e.message || 'Error initializing matching data';
		} finally {
			loading.value = false;
		}
	};

	// Match a single transaction to a budget item
	const matchTransactionToBudgetItem = (transaction) => {
		const description = (transaction.description || '').toLowerCase().trim();
		const vendor = (transaction.vendor || '').toLowerCase().trim();
		const amount = Math.abs(parseFloat(transaction.amount) || 0);

		let bestMatch = null;
		let bestScore = 0;

		for (const item of budgetItems.value) {
			let score = 0;

			// Check vendor patterns (highest priority)
			const vendorPatterns = item.vendor_patterns || [];
			for (const pattern of vendorPatterns) {
				const patternLower = pattern.toLowerCase().trim();
				if (vendor.includes(patternLower) || description.includes(patternLower)) {
					score += 100; // High score for vendor match
					break;
				}
			}

			// Check keywords (medium priority)
			const keywords = item.keywords || [];
			for (const keyword of keywords) {
				const keywordLower = keyword.toLowerCase().trim();
				if (description.includes(keywordLower)) {
					score += 50; // Medium score for keyword match
				}
			}

			// Check item description similarity
			const itemDesc = (item.description || '').toLowerCase();
			if (description.includes(itemDesc) || itemDesc.includes(description.split(' ')[0])) {
				score += 25;
			}

			// Amount range check (if within budget range, slight bonus)
			const monthlyBudget = parseFloat(item.monthly_budget) || 0;
			if (monthlyBudget > 0 && amount > 0) {
				const variance = Math.abs(amount - monthlyBudget) / monthlyBudget;
				if (variance < 0.2) {
					score += 10; // Within 20% of expected amount
				}
			}

			if (score > bestScore) {
				bestScore = score;
				bestMatch = {
					budget_item_id: item.id,
					category_id: typeof item.category_id === 'object' ? item.category_id?.id : item.category_id,
					confidence: Math.min(score, 100),
					matched_by: score >= 100 ? 'vendor_pattern' : score >= 50 ? 'keyword' : 'similarity',
				};
			}
		}

		// Only return match if confidence is above threshold
		return bestScore >= 25 ? bestMatch : null;
	};

	// Match a transaction to a budget category (fallback when no item match)
	const matchTransactionToCategory = (transaction) => {
		const description = (transaction.description || '').toLowerCase().trim();
		const vendor = (transaction.vendor || '').toLowerCase().trim();

		// Common category keywords
		const categoryPatterns = {
			Insurance: ['insurance', 'premium', 'coverage', 'policy'],
			Professional: ['management', 'legal', 'attorney', 'cpa', 'accountant', 'audit', 'boir'],
			Utilities: ['electric', 'water', 'gas', 'internet', 'cable', 'fpl', 'att', 'comcast', 'utility'],
			Maintenance: ['repair', 'maintenance', 'cleaning', 'janitorial', 'landscaping', 'pool', 'elevator', 'hvac'],
			Regulatory: ['permit', 'license', 'inspection', 'certificate', 'compliance', 'fire marshal'],
			Banking: ['bank', 'fee', 'charge', 'wire', 'ach'],
		};

		for (const category of budgetCategories.value) {
			const categoryName = category.category_name;
			const patterns = categoryPatterns[categoryName] || [];

			for (const pattern of patterns) {
				if (description.includes(pattern) || vendor.includes(pattern)) {
					return {
						category_id: category.id,
						confidence: 75,
						matched_by: 'category_keyword',
					};
				}
			}
		}

		return null;
	};

	// Match vendor from transaction description
	const matchVendor = (transaction) => {
		const description = (transaction.description || '').toLowerCase().trim();

		for (const vendor of vendors.value) {
			const vendorTitle = (vendor.title || '').toLowerCase();
			const matchingKeywords = vendor.matching_keywords || [];

			// Check vendor title
			if (vendorTitle && description.includes(vendorTitle)) {
				return {
					vendor_id: vendor.id,
					vendor_name: vendor.title,
					matched_by: 'vendor_title',
				};
			}

			// Check matching keywords
			for (const keyword of matchingKeywords) {
				if (description.includes(keyword.toLowerCase())) {
					return {
						vendor_id: vendor.id,
						vendor_name: vendor.title,
						matched_by: 'vendor_keyword',
					};
				}
			}
		}

		return null;
	};

	// Auto-categorize a transaction
	const autoCategorizeTransaction = (transaction) => {
		// Try to match to a specific budget item first
		const itemMatch = matchTransactionToBudgetItem(transaction);

		if (itemMatch) {
			return {
				...itemMatch,
				vendor_match: matchVendor(transaction),
			};
		}

		// Fallback to category match
		const categoryMatch = matchTransactionToCategory(transaction);

		if (categoryMatch) {
			return {
				...categoryMatch,
				budget_item_id: null,
				vendor_match: matchVendor(transaction),
			};
		}

		// No match found
		return {
			budget_item_id: null,
			category_id: null,
			confidence: 0,
			matched_by: 'none',
			vendor_match: matchVendor(transaction),
		};
	};

	// Batch auto-categorize transactions
	const batchAutoCategorize = (transactions) => {
		return transactions.map((transaction) => ({
			...transaction,
			auto_match: autoCategorizeTransaction(transaction),
		}));
	};

	// Apply auto-categorization to a transaction in the database
	const applyAutoCategorization = async (transactionId, match) => {
		try {
			const updates = {
				auto_categorized: true,
			};

			if (match.category_id) {
				updates.category_id = match.category_id;
			}

			if (match.budget_item_id) {
				updates.budget_item_id = match.budget_item_id;
			}

			if (match.vendor_match?.vendor_id) {
				updates.vendor_id = match.vendor_match.vendor_id;
				updates.vendor = match.vendor_match.vendor_name;
			}

			await transactionsCollection.update(transactionId, updates);
			return { success: true };
		} catch (e) {
			console.error('Error applying auto-categorization:', e);
			return { success: false, error: e.message };
		}
	};

	// Batch apply auto-categorization
	const batchApplyAutoCategorization = async (transactions, minConfidence = 50) => {
		const results = {
			success: 0,
			skipped: 0,
			failed: 0,
			errors: [],
		};

		for (const transaction of transactions) {
			const match = transaction.auto_match || autoCategorizeTransaction(transaction);

			if (match.confidence >= minConfidence) {
				const result = await applyAutoCategorization(transaction.id, match);
				if (result.success) {
					results.success++;
				} else {
					results.failed++;
					results.errors.push({ id: transaction.id, error: result.error });
				}
			} else {
				results.skipped++;
			}
		}

		return results;
	};

	// Get uncategorized transactions
	const getUncategorizedTransactions = async (fiscalYear, accountId = null) => {
		try {
			const filter = {
				fiscal_year: { year: { _eq: fiscalYear } },
				_or: [
					{ category_id: { _null: true } },
					{ budget_item_id: { _null: true } },
				],
			};

			if (accountId) {
				filter.account_id = { _eq: accountId };
			}

			const data = await transactionsCollection.list({
				filter,
				sort: ['-transaction_date'],
				fields: ['*'],
				limit: -1,
			});

			return data || [];
		} catch (e) {
			console.error('Error fetching uncategorized transactions:', e);
			return [];
		}
	};

	// Get matching statistics
	const getMatchingStats = computed(() => {
		const items = budgetItems.value;
		const categories = budgetCategories.value;

		const itemsWithPatterns = items.filter(
			(i) => (i.vendor_patterns?.length > 0) || (i.keywords?.length > 0)
		).length;

		return {
			totalBudgetItems: items.length,
			itemsWithPatterns,
			itemsWithoutPatterns: items.length - itemsWithPatterns,
			totalCategories: categories.length,
			totalVendors: vendors.value.length,
			vendorsWithKeywords: vendors.value.filter((v) => v.matching_keywords?.length > 0).length,
		};
	});

	return {
		// State
		budgetItems: readonly(budgetItems),
		budgetCategories: readonly(budgetCategories),
		vendors: readonly(vendors),
		loading,
		error,

		// Initialize
		initializeMatching,

		// Matching functions
		matchTransactionToBudgetItem,
		matchTransactionToCategory,
		matchVendor,
		autoCategorizeTransaction,
		batchAutoCategorize,

		// Apply functions
		applyAutoCategorization,
		batchApplyAutoCategorization,

		// Utilities
		getUncategorizedTransactions,
		getMatchingStats,
	};
};
