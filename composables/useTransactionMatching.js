// composables/useTransactionMatching.js
// Automated transaction-to-budget item matching using vendor patterns and keywords

// Helper: Normalize text for matching — splits camelCase, normalizes separators
// e.g. "WASHLaundrySystems" → "wash laundry systems"
function normalizeForMatching(text) {
	return text
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/[-_/&]/g, ' ')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

// Helper: Token-based fuzzy matching for vendor name variants
function fuzzyTokenMatch(text1, text2, minOverlap = 1) {
	const norm1 = normalizeForMatching(text1);
	const norm2 = normalizeForMatching(text2);
	if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

	const tokens1 = norm1.split(' ').filter((t) => t.length > 2);
	const tokens2 = norm2.split(' ').filter((t) => t.length > 2);
	if (tokens1.length === 0 || tokens2.length === 0) return false;

	let overlapCount = 0;
	for (const t1 of tokens1) {
		for (const t2 of tokens2) {
			if (t1 === t2 || (t1.length >= 4 && t2.length >= 4 && (t1.includes(t2) || t2.includes(t1)))) {
				overlapCount++;
				break;
			}
		}
	}
	return overlapCount >= minOverlap;
}

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
		const vendorExpanded = normalizeForMatching(transaction.vendor || '');
		const descriptionExpanded = normalizeForMatching(transaction.description || '');
		const amount = Math.abs(parseFloat(transaction.amount) || 0);
		const isIncomeType = ['deposit', 'transfer_in', 'interest'].includes(transaction.transaction_type);

		let bestMatch = null;
		let bestScore = 0;

		for (const item of budgetItems.value) {
			let score = 0;

			// Check vendor patterns (highest priority) with fuzzy matching
			const vendorPatterns = item.vendor_patterns || [];
			for (const pattern of vendorPatterns) {
				const patternLower = pattern.toLowerCase().trim();
				if (vendor.includes(patternLower) || description.includes(patternLower)) {
					score += 100;
					break;
				}
				// Fuzzy match for camelCase, concatenated words, etc.
				const patternNorm = normalizeForMatching(pattern);
				if (vendorExpanded.includes(patternNorm) || descriptionExpanded.includes(patternNorm) ||
					fuzzyTokenMatch(vendor, pattern)) {
					score += 80;
					break;
				}
			}

			// Check keywords (medium priority)
			const keywords = item.keywords || [];
			for (const keyword of keywords) {
				const keywordLower = keyword.toLowerCase().trim();
				if (description.includes(keywordLower) || vendor.includes(keywordLower)) {
					score += 50;
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
					score += 10;
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

		if (bestScore < 25) return null;

		// For income-type transactions, override category to Revenue if available
		if (isIncomeType && bestMatch) {
			const revenueCategory = budgetCategories.value.find((c) => {
				const name = (c.category_name || '').toLowerCase();
				const desc = (c.description || '').toLowerCase();
				return name.includes('revenue') || name.includes('income')
					|| name.includes('assessment') || name.includes('dues')
					|| desc.includes('revenue') || desc.includes('income');
			});
			if (revenueCategory) {
				bestMatch.category_id = revenueCategory.id;
				bestMatch.matched_by = 'budget_item_deposit_override';
			}
		}

		return bestMatch;
	};

	// Match a transaction to a budget category (fallback when no item match)
	const matchTransactionToCategory = (transaction) => {
		const description = (transaction.description || '').toLowerCase().trim();
		const vendor = (transaction.vendor || '').toLowerCase().trim();
		const descriptionNorm = description.replace(/-/g, ' ');
		const vendorNorm = vendor.replace(/-/g, ' ');
		const searchText = `${descriptionNorm} ${vendorNorm}`;
		const searchTextExpanded = `${normalizeForMatching(transaction.description || '')} ${normalizeForMatching(transaction.vendor || '')}`;

		// Category keywords — keys must match actual DB category_name values
		const categoryPatterns = {
			Insurance: [
				'insurance', 'premium', 'coverage', 'policy', 'insur',
				'citizens', 'fednat', 'heritage', 'flood insurance',
			],
			Administrative: [
				'management', 'legal', 'attorney', 'cpa', 'accountant', 'audit',
				'boir', 'consulting', 'vte', 'law office', 'law firm',
				'accounting', 'bookkeeping', 'tax prep', 'admin',
				'bank fee', 'service charge', 'wire fee', 'ach fee',
				'monthly maintenance fee', 'account fee', 'overdraft',
				'office', 'supply', 'supplies', 'printing', 'postage',
				'fedex', 'ups', 'shipping', 'miscellaneous', 'misc',
				'phone line', 'telephone', 'bank', 'fee', 'charge', 'wire', 'ach',
			],
			'Contract Services': [
				'waste', 'trash', 'garbage', 'betterwaste', 'waste management',
				'laundry', 'wash multifamily', 'landscaping', 'lawn', 'garden',
				'elevator', '1-touch', '1 touch', 'pool', 'pest', 'exterminator',
				'cleaning', 'janitorial', 'pressure wash', 'security', 'camera',
				'gate', 'access control', 'fire equip', 'fire alarm',
				'maverick', 'gutierrez', 'contract', 'service agreement',
			],
			Utilities: [
				'electric', 'water', 'gas', 'internet', 'cable', 'fpl',
				'att', 'comcast', 'utility', 'sewer', 'teco', 'people gas',
				'breezeline', 'power', 'florida power', 'miami beach water',
			],
			Maintenance: [
				'repair', 'maintenance', 'hvac', 'plumbing', 'a/c',
				'air condition', 'roofing', 'painting', 'electrical repair',
				'tree trimming', 'handyman', 'contractor', 'garage door',
			],
			Regulatory: [
				'permit', 'license', 'inspection', 'certificate', 'compliance',
				'fire marshal', 'code enforcement', 'sunbiz', 'dbpr',
				'department of', 'validation permit', 'annual inspection',
			],
		};

		let bestScore = 0;
		let bestMatch = null;

		for (const category of budgetCategories.value) {
			const categoryName = category.category_name;
			const patterns = categoryPatterns[categoryName] || [];
			let score = 0;

			for (const pattern of patterns) {
				if (searchText.includes(pattern) || searchTextExpanded.includes(pattern)) {
					score += 50;
					if (score >= 100) break;
				}
			}

			if (score > bestScore) {
				bestScore = score;
				bestMatch = {
					category_id: category.id,
					confidence: Math.min(score, 100),
					matched_by: 'category_keyword',
				};
			}
		}

		return bestMatch;
	};

	// Match vendor from transaction description (with fuzzy matching)
	const matchVendor = (transaction) => {
		const description = (transaction.description || '').toLowerCase().trim();
		const vendorField = (transaction.vendor || '').toLowerCase().trim();
		const descExpanded = normalizeForMatching(transaction.description || '');
		const vendorExpanded = normalizeForMatching(transaction.vendor || '');
		const searchText = `${description} ${vendorField}`;
		const searchExpanded = `${descExpanded} ${vendorExpanded}`;

		for (const vendor of vendors.value) {
			const vendorTitle = (vendor.title || '').toLowerCase();
			const matchingKeywords = vendor.matching_keywords || [];

			// Exact substring match on title
			if (vendorTitle && (description.includes(vendorTitle) || vendorField.includes(vendorTitle))) {
				return {
					vendor_id: vendor.id,
					vendor_name: vendor.title,
					matched_by: 'vendor_title',
				};
			}

			// Fuzzy token match on title
			if (vendorTitle && vendorField && fuzzyTokenMatch(vendorField, vendorTitle)) {
				return {
					vendor_id: vendor.id,
					vendor_name: vendor.title,
					matched_by: 'vendor_title_fuzzy',
				};
			}

			// Check matching keywords (with expanded/normalized matching)
			for (const keyword of matchingKeywords) {
				if (!keyword) continue;
				const kwLower = keyword.toLowerCase();
				if (searchText.includes(kwLower) || searchExpanded.includes(normalizeForMatching(keyword))) {
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

	// Detect Zelle reimbursements to board members / owners helping with property work.
	// Payments to residents at units 201-214 and 301-314 are maintenance reimbursements.
	const isBoardMemberReimbursement = (transaction) => {
		const description = (transaction.description || '').toLowerCase();
		if (!description.includes('zelle')) return false;
		// Match unit numbers like "312 diana", "201 john", etc.
		const unitMatch = description.match(/\b(2(?:0[1-9]|1[0-4])|3(?:0[1-9]|1[0-4]))\b/);
		return !!unitMatch;
	};

	// Auto-categorize a transaction
	const autoCategorizeTransaction = (transaction) => {
		const isIncomeType = ['deposit', 'transfer_in', 'interest'].includes(transaction.transaction_type);

		// Check for board member / owner reimbursements first (highest priority)
		// Only for withdrawal-type transactions (outgoing payments)
		if (!isIncomeType && isBoardMemberReimbursement(transaction)) {
			const maintenanceCategory = budgetCategories.value.find(
				(c) => c.category_name === 'Maintenance' || c.category_name === 'Contract Services'
			);
			if (maintenanceCategory) {
				return {
					budget_item_id: null,
					category_id: maintenanceCategory.id,
					confidence: 90,
					matched_by: 'board_member_reimbursement',
					vendor_match: matchVendor(transaction),
				};
			}
		}

		// Try to match to a specific budget item first
		const itemMatch = matchTransactionToBudgetItem(transaction);

		if (itemMatch) {
			return {
				...itemMatch,
				vendor_match: matchVendor(transaction),
			};
		}

		// For income-type transactions, try Revenue/Income category before expense keywords
		if (isIncomeType) {
			const revenueCategory = budgetCategories.value.find((c) => {
				const name = (c.category_name || '').toLowerCase();
				const desc = (c.description || '').toLowerCase();
				return name.includes('revenue') || name.includes('income')
					|| name.includes('assessment') || name.includes('dues')
					|| desc.includes('revenue') || desc.includes('income');
			});
			if (revenueCategory) {
				const description = (transaction.description || '').toLowerCase();
				const highConfidenceKeywords = [
					'zelle', 'venmo', 'assessment', 'dues', 'hoa',
					'remote deposit', 'check deposit', 'online transfer',
					'ach deposit', 'direct deposit', 'ach credit',
					'payment from', 'deposit', 'credit', 'quickpay',
				];
				const isHighConfidence = highConfidenceKeywords.some((kw) => description.includes(kw));
				return {
					budget_item_id: null,
					category_id: revenueCategory.id,
					confidence: isHighConfidence ? 75 : 50,
					matched_by: isHighConfidence ? 'deposit_heuristic' : 'deposit_type_fallback',
					vendor_match: matchVendor(transaction),
				};
			}
		}

		// Fallback to category match (for expense transactions)
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
