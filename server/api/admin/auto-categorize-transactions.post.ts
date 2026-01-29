/**
 * POST /api/admin/auto-categorize-transactions
 *
 * Finds uncategorized transactions and attempts to match them to budget categories
 * and budget items using vendor patterns, keywords, description matching, and
 * HOA-specific keyword dictionaries.
 *
 * Accepts optional filters:
 *   - fiscal_year: number (e.g. 2025) — required
 *   - account_id: string — optional, limit to specific account
 *   - import_batch_id: string — optional, limit to specific import batch
 *   - min_confidence: number — minimum confidence score to apply (default 25)
 *
 * Requires admin/board member access.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
	updateItem,
} from '~/server/utils/directus';

interface CategorizationResult {
	success: boolean;
	total_uncategorized: number;
	categorized: number;
	skipped: number;
	failed: number;
	results: Array<{
		transaction_id: number;
		description: string;
		matched_category?: string;
		matched_budget_item?: string;
		matched_vendor?: string;
		confidence: number;
		matched_by: string;
	}>;
	errors: string[];
}

export default defineEventHandler(async (event): Promise<CategorizationResult> => {
	const session = await getUserSession(event);

	if (!session?.user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			message: 'Authentication required',
		});
	}

	if (!hasAdminAccess(session)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Forbidden',
			message: 'Admin access required',
		});
	}

	const body = await readBody(event);
	const fiscalYear = body?.fiscal_year;
	const accountId = body?.account_id || null;
	const importBatchId = body?.import_batch_id || null;
	const minConfidence = body?.min_confidence ?? 25;

	if (!fiscalYear) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'fiscal_year is required',
		});
	}

	const client = useDirectusAdmin();

	try {
		// 1. Fetch budget items with category info for this fiscal year OR with no fiscal year
		const budgetItems = await client.request(
			readItems('budget_items', {
				filter: {
					_or: [
						{ fiscal_year: { year: { _eq: fiscalYear } } },
						{ fiscal_year: { _null: true } },
					],
				},
				fields: ['*', 'category_id.id', 'category_id.category_name'],
				limit: -1,
			})
		);

		// 2. Fetch budget categories for this fiscal year OR with no fiscal year (global categories)
		const budgetCategories = await client.request(
			readItems('budget_categories', {
				filter: {
					_or: [
						{ fiscal_year: { year: { _eq: fiscalYear } } },
						{ fiscal_year: { _null: true } },
					],
				},
				fields: ['*'],
				limit: -1,
			})
		);

		// 3. Fetch vendors
		const vendors = await client.request(
			readItems('vendors', {
				fields: ['*'],
				limit: -1,
			})
		);

		// 4. Fetch uncategorized transactions
		const txFilter: any = {
			fiscal_year: { year: { _eq: fiscalYear } },
			category_id: { _null: true },
		};

		if (accountId) {
			txFilter.account_id = { _eq: accountId };
		}

		if (importBatchId) {
			txFilter.import_batch_id = { _eq: importBatchId };
		}

		const transactions = await client.request(
			readItems('transactions', {
				filter: txFilter,
				fields: ['id', 'description', 'vendor', 'amount', 'transaction_type'],
				sort: ['-transaction_date'],
				limit: -1,
			})
		);

		// 5. Build the category lookup by resolving DB category names
		//    to our keyword dictionary using fuzzy name matching
		const categoryKeywordMap = buildCategoryKeywordMap(budgetCategories);

		// 6. Run matching algorithm
		const result: CategorizationResult = {
			success: true,
			total_uncategorized: transactions.length,
			categorized: 0,
			skipped: 0,
			failed: 0,
			results: [],
			errors: [],
		};

		for (const tx of transactions) {
			try {
				const match = matchTransaction(tx, budgetItems, budgetCategories, vendors, categoryKeywordMap);

				if (match.confidence >= minConfidence) {
					const updates: Record<string, any> = {
						auto_categorized: true,
					};

					if (match.category_id) {
						updates.category_id = match.category_id;
					}
					if (match.budget_item_id) {
						updates.budget_item_id = match.budget_item_id;
					}
					if (match.vendor_id) {
						updates.vendor_id = match.vendor_id;
						if (match.vendor_name) {
							updates.vendor = match.vendor_name;
						}
					}

					await client.request(
						updateItem('transactions', tx.id, updates)
					);

					result.categorized++;
					result.results.push({
						transaction_id: tx.id,
						description: tx.description,
						matched_category: match.category_name || undefined,
						matched_budget_item: match.budget_item_desc || undefined,
						matched_vendor: match.vendor_name || undefined,
						confidence: match.confidence,
						matched_by: match.matched_by,
					});
				} else {
					result.skipped++;
					result.results.push({
						transaction_id: tx.id,
						description: tx.description,
						confidence: match.confidence,
						matched_by: match.matched_by || 'none',
					});
				}
			} catch (err: any) {
				result.failed++;
				result.errors.push(`Transaction ${tx.id}: ${err.message}`);
			}
		}

		return result;
	} catch (err: any) {
		console.error('Auto-categorize error:', err);
		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: `Auto-categorization failed: ${err.message}`,
		});
	}
});

// ============================================================
// HOA-specific keyword dictionary
// Each group lists keywords that map to a logical category.
// The group name is fuzzy-matched to actual DB category names.
// ============================================================
const CATEGORY_KEYWORDS: Record<string, string[]> = {
	Insurance: [
		'insurance', 'premium', 'coverage', 'policy', 'insur',
		'first insurance', 'flood insurance', 'building insurance',
		'citizens', 'fednat', 'heritage',
	],
	Professional: [
		'management', 'legal', 'attorney', 'cpa', 'accountant', 'audit',
		'boir', 'consulting', 'vte', 'law office', 'law firm',
		'accounting', 'bookkeeping', 'tax prep',
	],
	Utilities: [
		'electric', 'water', 'gas', 'internet', 'cable', 'fpl',
		'att', 'comcast', 'utility', 'sewer', 'teco', 'people gas',
		'breezeline', 'power', 'florida power', 'miami-dade water',
		'miami beach water',
	],
	Maintenance: [
		'repair', 'maintenance', 'cleaning', 'janitorial', 'landscaping',
		'pool', 'elevator', 'hvac', 'plumbing', 'pest', 'exterminator',
		'waste', 'trash', 'garbage', 'lawn', 'garden', 'a/c',
		'air condition', 'fire equip', 'fire alarm', 'security',
		'camera', 'gate', 'access control', 'maverick', 'gutierrez',
		'laundry', 'pressure wash', 'roofing',
		'painting', 'electrical repair',
	],
	Regulatory: [
		'permit', 'license', 'inspection', 'certificate', 'compliance',
		'fire marshal', 'code enforcement', 'sunbiz', 'dbpr',
		'miami beach', 'miami-dade', 'city of', 'county',
		'department of', 'validation permit', 'annual inspection',
	],
	Banking: [
		'bank fee', 'service charge', 'wire fee', 'ach fee',
		'monthly maintenance fee', 'account fee', 'overdraft',
		'nsf', 'returned item', 'chase fee',
	],
	Other: [
		'office', 'supply', 'supplies', 'printing', 'postage',
		'fedex', 'ups', 'shipping', 'miscellaneous', 'misc',
		'phone line', 'telephone', '1-touch',
	],
};

// Additional vendor-to-category map for common HOA vendors (applies to withdrawals)
const VENDOR_CATEGORY_MAP: Record<string, string> = {
	'fpl': 'Utilities',
	'florida power': 'Utilities',
	'teco': 'Utilities',
	'people gas': 'Utilities',
	'breezeline': 'Utilities',
	'comcast': 'Utilities',
	'att': 'Utilities',
	'miami beach water': 'Utilities',
	'miami-dade water': 'Utilities',
	'betterwaste': 'Utilities',
	'waste management': 'Maintenance',
	'wash multifamily': 'Maintenance',
	'maverick': 'Maintenance',
	'gutierrez': 'Maintenance',
	'a plus fire': 'Maintenance',
	'vte consulting': 'Professional',
	'vte': 'Professional',
	'chase': 'Banking',
	'sunbiz': 'Regulatory',
	'dbpr': 'Regulatory',
	'first insurance': 'Insurance',
	'citizens': 'Insurance',
	'1 touch elevator': 'Maintenance',
	'1-touch': 'Maintenance',
	'buildium': 'Professional',
	'diana wyatt': 'Professional',
	'harry tempkins': 'Maintenance',
	'general deposit ub': 'Utilities',
	'mdcbuildings': 'Maintenance',
};

// Vendors that map to Revenue when they appear as deposits (e.g., laundry income, tenant payments)
const VENDOR_DEPOSIT_REVENUE: string[] = [
	'wash multifamily',
	'buildium',
];

// ============================================================
// Build a map from DB category IDs to keyword lists
// ============================================================
function buildCategoryKeywordMap(
	budgetCategories: any[]
): Map<number, { name: string; keywords: string[] }> {
	const map = new Map<number, { name: string; keywords: string[] }>();

	for (const category of budgetCategories) {
		const catName = (category.category_name || '').trim();
		const catNameLower = catName.toLowerCase();

		// Find the best matching keyword group
		let bestGroup: string | null = null;
		let bestScore = 0;

		for (const [groupName, _keywords] of Object.entries(CATEGORY_KEYWORDS)) {
			const groupLower = groupName.toLowerCase();

			// Exact match
			if (catNameLower === groupLower) {
				bestGroup = groupName;
				bestScore = 100;
				break;
			}

			// DB name contains group name or vice versa
			if (catNameLower.includes(groupLower) || groupLower.includes(catNameLower)) {
				const score = 80;
				if (score > bestScore) {
					bestGroup = groupName;
					bestScore = score;
				}
			}

			// Word overlap
			const catWords = catNameLower.split(/\s+/);
			const groupWords = groupLower.split(/\s+/);
			const overlap = catWords.filter((w: string) =>
				groupWords.some((gw: string) => w.includes(gw) || gw.includes(w))
			);
			if (overlap.length > 0) {
				const score = 60 + overlap.length * 10;
				if (score > bestScore) {
					bestGroup = groupName;
					bestScore = score;
				}
			}
		}

		if (bestGroup && bestScore >= 60) {
			map.set(category.id, {
				name: catName,
				keywords: CATEGORY_KEYWORDS[bestGroup],
			});
		} else {
			// If no match found, use the category name itself and 'Other' keywords as fallback
			const keywords = [catNameLower, ...(CATEGORY_KEYWORDS['Other'] || [])];
			map.set(category.id, { name: catName, keywords });
		}
	}

	return map;
}

// ============================================================
// Matching logic
// ============================================================
interface MatchResult {
	category_id: number | null;
	category_name: string | null;
	budget_item_id: number | null;
	budget_item_desc: string | null;
	vendor_id: number | null;
	vendor_name: string | null;
	confidence: number;
	matched_by: string;
}

function matchTransaction(
	transaction: any,
	budgetItems: any[],
	budgetCategories: any[],
	vendors: any[],
	categoryKeywordMap: Map<number, { name: string; keywords: string[] }>
): MatchResult {
	const result: MatchResult = {
		category_id: null,
		category_name: null,
		budget_item_id: null,
		budget_item_desc: null,
		vendor_id: null,
		vendor_name: null,
		confidence: 0,
		matched_by: 'none',
	};

	const description = (transaction.description || '').toLowerCase().trim();
	const vendorField = (transaction.vendor || '').toLowerCase().trim();
	const searchText = `${description} ${vendorField}`;
	const amount = Math.abs(parseFloat(transaction.amount) || 0);

	// --- Pass 1: Match to a specific budget item ---
	let bestItemScore = 0;
	let bestItem: any = null;

	for (const item of budgetItems) {
		let score = 0;

		// Check vendor patterns (highest priority)
		const vendorPatterns: string[] = item.vendor_patterns || [];
		for (const pattern of vendorPatterns) {
			const p = pattern.toLowerCase().trim();
			if (p && (vendorField.includes(p) || description.includes(p))) {
				score += 100;
				break;
			}
		}

		// Check keywords
		const keywords: string[] = item.keywords || [];
		for (const keyword of keywords) {
			const kw = keyword.toLowerCase().trim();
			if (kw && (description.includes(kw) || vendorField.includes(kw))) {
				score += 50;
			}
		}

		// Check item description similarity
		const itemDesc = (item.description || '').toLowerCase();
		if (itemDesc) {
			// Multi-word match: check if any significant words from the item desc appear in the tx
			const itemWords = itemDesc.split(/\s+/).filter((w: string) => w.length > 3);
			const matchedWords = itemWords.filter((w: string) => searchText.includes(w));
			if (matchedWords.length >= 2) {
				score += 40;
			} else if (matchedWords.length === 1) {
				score += 20;
			}
		}

		// Check item code
		const itemCode = (item.item_code || '').toLowerCase();
		if (itemCode && itemCode.length > 3 && searchText.includes(itemCode)) {
			score += 30;
		}

		// Amount range check
		const monthlyBudget = parseFloat(item.monthly_budget) || 0;
		if (monthlyBudget > 0 && amount > 0) {
			const variance = Math.abs(amount - monthlyBudget) / monthlyBudget;
			if (variance < 0.1) {
				score += 15;
			} else if (variance < 0.2) {
				score += 10;
			}
		}

		if (score > bestItemScore) {
			bestItemScore = score;
			bestItem = item;
		}
	}

	if (bestItemScore >= 25 && bestItem) {
		const catId = typeof bestItem.category_id === 'object'
			? bestItem.category_id?.id
			: bestItem.category_id;
		const catName = typeof bestItem.category_id === 'object'
			? bestItem.category_id?.category_name
			: null;

		result.budget_item_id = bestItem.id;
		result.budget_item_desc = bestItem.description;
		result.category_id = catId || null;
		result.category_name = catName || null;
		result.confidence = Math.min(bestItemScore, 100);
		result.matched_by = bestItemScore >= 100 ? 'vendor_pattern' : bestItemScore >= 50 ? 'keyword' : 'similarity';
	}

	// --- Pass 2: Keyword-based category matching ---
	// This uses the expanded keyword dictionary, matched against actual DB categories
	if (!result.category_id) {
		let bestCatScore = 0;
		let bestCatId: number | null = null;
		let bestCatName: string | null = null;

		for (const [catId, catInfo] of categoryKeywordMap) {
			let score = 0;
			let matchCount = 0;

			for (const keyword of catInfo.keywords) {
				if (searchText.includes(keyword)) {
					score += 50;
					matchCount++;
					if (matchCount >= 2) break; // cap at 2 keyword matches per category
				}
			}

			if (score > bestCatScore) {
				bestCatScore = score;
				bestCatId = catId;
				bestCatName = catInfo.name;
			}
		}

		if (bestCatScore >= 50 && bestCatId) {
			result.category_id = bestCatId;
			result.category_name = bestCatName;
			result.confidence = Math.min(bestCatScore, 100);
			result.matched_by = 'category_keyword';
		}
	}

	// --- Pass 3: Vendor name → category mapping ---
	// Use known HOA vendor-to-category associations
	// Some vendors map to Revenue when they appear as deposits (e.g., laundry income from Wash Multifamily)
	if (!result.category_id) {
		for (const [vendorKey, groupName] of Object.entries(VENDOR_CATEGORY_MAP)) {
			if (searchText.includes(vendorKey)) {
				// Check if this vendor should be Revenue when it's a deposit
				const isDeposit = transaction.transaction_type === 'deposit';
				const isDepositRevenueVendor = VENDOR_DEPOSIT_REVENUE.some((v) => vendorKey.includes(v) || v.includes(vendorKey));

				if (isDeposit && isDepositRevenueVendor) {
					// Map to Revenue instead of the default vendor category
					const revenueCategory = budgetCategories.find((cat: any) => {
						const name = (cat.category_name || '').toLowerCase();
						return name.includes('revenue') || name.includes('income') || name.includes('assessment');
					});
					if (revenueCategory) {
						result.category_id = revenueCategory.id;
						result.category_name = revenueCategory.category_name;
						result.confidence = 75;
						result.matched_by = 'vendor_deposit_revenue';
						break;
					}
				}

				// Standard vendor-to-category lookup for non-deposit or non-revenue vendors
				for (const [catId, catInfo] of categoryKeywordMap) {
					const catGroupLower = catInfo.name.toLowerCase();
					if (
						catGroupLower === groupName.toLowerCase() ||
						catGroupLower.includes(groupName.toLowerCase()) ||
						groupName.toLowerCase().includes(catGroupLower)
					) {
						result.category_id = catId;
						result.category_name = catInfo.name;
						result.confidence = 70;
						result.matched_by = 'vendor_lookup';
						break;
					}
				}
				if (result.category_id) break;
			}
		}
	}

	// --- Pass 4: Transaction type heuristics ---
	// In an HOA context, nearly all deposits are assessment/dues revenue.
	// Only match deposit-type transactions (NOT transfers) to the Revenue/Income category.
	if (!result.category_id && transaction.transaction_type === 'deposit') {
		// Find the revenue/income category
		const revenueCategory = budgetCategories.find((cat: any) => {
			const name = (cat.category_name || '').toLowerCase();
			return name.includes('revenue') || name.includes('income') || name.includes('assessment');
		});

		if (revenueCategory) {
			// High-confidence deposit keywords (owner payments)
			const highConfidenceKeywords = [
				'zelle', 'venmo', 'assessment', 'dues', 'hoa',
				'maintenance fee', 'condo fee', 'remote deposit',
				'remote online deposit', 'mobile deposit', 'check deposit',
				'online transfer', 'ach deposit', 'direct deposit',
			];

			const isHighConfidence = highConfidenceKeywords.some((kw) => searchText.includes(kw));

			if (isHighConfidence) {
				result.category_id = revenueCategory.id;
				result.category_name = revenueCategory.category_name;
				result.confidence = 75;
				result.matched_by = 'deposit_heuristic';
			} else {
				// All other deposits still likely revenue in HOA context
				result.category_id = revenueCategory.id;
				result.category_name = revenueCategory.category_name;
				result.confidence = 50;
				result.matched_by = 'deposit_type_fallback';
			}
		}
	}

	// Fees
	if (!result.category_id && transaction.transaction_type === 'fee') {
		for (const cat of budgetCategories) {
			const name = (cat.category_name || '').toLowerCase();
			if (name.includes('bank') || name.includes('fee') || name.includes('other')) {
				result.category_id = cat.id;
				result.category_name = cat.category_name;
				result.confidence = 65;
				result.matched_by = 'fee_type';
				break;
			}
		}
	}

	// --- Pass 5: Vendor record matching (adds vendor info to any match) ---
	for (const vendor of vendors) {
		const vendorTitle = (vendor.title || '').toLowerCase();
		const matchingKeywords: string[] = vendor.matching_keywords || [];

		if (vendorTitle && (description.includes(vendorTitle) || vendorField.includes(vendorTitle))) {
			result.vendor_id = vendor.id;
			result.vendor_name = vendor.title;
			break;
		}

		let matched = false;
		for (const keyword of matchingKeywords) {
			if (keyword && searchText.includes(keyword.toLowerCase())) {
				result.vendor_id = vendor.id;
				result.vendor_name = vendor.title;
				matched = true;
				break;
			}
		}
		if (matched) break;
	}

	return result;
}
