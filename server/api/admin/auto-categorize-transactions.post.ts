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
 *   - recategorize: boolean — re-run on ALL transactions (not just uncategorized).
 *     Overwrites existing auto-categorized assignments with updated rules.
 *     Manually categorized transactions (auto_categorized !== true) are skipped.
 *
 * Requires admin/board member access.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
	updateItems,
} from '~/server/utils/directus';

// Extend Vercel timeout (Hobby plan max: 60s)
defineRouteMeta({
	maxDuration: 60,
});
export const config = {
	maxDuration: 60,
};

interface CategorizationResult {
	success: boolean;
	total_uncategorized: number;
	total_processed?: number;
	recategorized?: number;
	categorized: number;
	skipped: number;
	failed: number;
	fund_mixing_flagged?: number;
	results: Array<{
		transaction_id: number;
		description: string;
		matched_category?: string;
		previous_category?: string;
		matched_budget_item?: string;
		matched_vendor?: string;
		confidence: number;
		matched_by: string;
		fund_mixing?: boolean;
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
	const recategorize = body?.recategorize === true;

	if (!fiscalYear) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'fiscal_year is required',
		});
	}

	const client = useDirectusAdmin();

	try {
		// Build transaction filter before parallel fetch
		const txFilter: any = {
			fiscal_year: { year: { _eq: fiscalYear } },
		};

		if (recategorize) {
			// Include uncategorized + previously auto-categorized (skip manual)
			txFilter._or = [
				{ category_id: { _null: true } },
				{ auto_categorized: { _eq: true } },
			];
		} else {
			txFilter.category_id = { _null: true };
		}

		if (accountId) {
			txFilter.account_id = { _eq: accountId };
		}

		if (importBatchId) {
			txFilter.import_batch_id = { _eq: importBatchId };
		}

		// Fetch all data in parallel — these queries are independent
		const [budgetItems, budgetCategories, vendors, transactions] = await Promise.all([
			// 1. Budget items with category info
			client.request(
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
			),
			// 2. Budget categories
			client.request(
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
			),
			// 3. Vendors
			client.request(
				readItems('vendors', {
					fields: ['*'],
					limit: -1,
				})
			),
			// 4. Transactions to process
			client.request(
				readItems('transactions', {
					filter: txFilter,
					fields: ['id', 'description', 'vendor', 'amount', 'transaction_type', 'account_id', 'category_id', 'auto_categorized'],
					sort: ['-transaction_date'],
					limit: -1,
				})
			),
		]);

		// 5. Build the category lookup by resolving DB category names
		//    to our keyword dictionary using fuzzy name matching
		const categoryKeywordMap = buildCategoryKeywordMap(budgetCategories);

		// 6. Run matching algorithm (collect results first, then batch-write)
		// Build a quick lookup from category ID → name for recategorize reporting
		const catNameById = new Map<number, string>();
		for (const cat of budgetCategories) {
			catNameById.set(cat.id, cat.category_name);
		}

		const result: CategorizationResult = {
			success: true,
			total_uncategorized: transactions.length,
			categorized: 0,
			recategorized: 0,
			skipped: 0,
			failed: 0,
			fund_mixing_flagged: 0,
			results: [],
			errors: [],
		};

		if (recategorize) {
			result.total_processed = transactions.length;
		}

		// Phase 1: Match all transactions (CPU only, no DB writes)
		const pendingUpdates: Array<{ id: number; updates: Record<string, any> }> = [];

		for (const tx of transactions) {
			try {
				const match = matchTransaction(tx, budgetItems, budgetCategories, vendors, categoryKeywordMap);

				// Resolve the previous category name for recategorize reporting
				const prevCatId = typeof tx.category_id === 'object' ? tx.category_id?.id : tx.category_id;
				const previousCategory = prevCatId ? catNameById.get(prevCatId) : undefined;

				// In recategorize mode, skip if the new match is the same category
				// (no point updating to the same value)
				const isSameCategory = recategorize && prevCatId && match.category_id === prevCatId;

				if (match.confidence >= minConfidence && !isSameCategory) {
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

					// Flag fund-mixing: vendor should have been paid from 5872
					if (match.fund_mixing) {
						updates.is_violation = true;
						updates.violation_type = 'fund_mixing';
						updates.review_status = 'flagged';
						result.fund_mixing_flagged!++;
					}

					pendingUpdates.push({ id: tx.id, updates });

					if (prevCatId && match.category_id !== prevCatId) {
						result.recategorized!++;
					}
					result.categorized++;
					result.results.push({
						transaction_id: tx.id,
						description: tx.description,
						matched_category: match.category_name || undefined,
						previous_category: previousCategory || undefined,
						matched_budget_item: match.budget_item_desc || undefined,
						matched_vendor: match.vendor_name || undefined,
						confidence: match.confidence,
						matched_by: match.matched_by,
						fund_mixing: match.fund_mixing || undefined,
					});
				} else {
					// Even uncategorized transactions can be flagged for fund-mixing
					if (match.fund_mixing) {
						pendingUpdates.push({
							id: tx.id,
							updates: {
								is_violation: true,
								violation_type: 'fund_mixing',
								review_status: 'flagged',
							},
						});
						result.fund_mixing_flagged!++;
					}
					result.skipped++;
					result.results.push({
						transaction_id: tx.id,
						description: tx.description,
						confidence: match.confidence,
						matched_by: match.matched_by || 'none',
						fund_mixing: match.fund_mixing || undefined,
					});
				}
			} catch (err: any) {
				result.failed++;
				result.errors.push(`Transaction ${tx.id}: ${err.message}`);
			}
		}

		// Phase 2: Bulk-write using grouped updates for efficiency.
		// Group transactions that share identical update payloads so we can
		// use a single updateItems() call per group instead of per-transaction.
		const updateGroups = new Map<string, { ids: number[]; updates: Record<string, any> }>();

		for (const { id, updates } of pendingUpdates) {
			const key = JSON.stringify(updates);
			if (!updateGroups.has(key)) {
				updateGroups.set(key, { ids: [], updates });
			}
			updateGroups.get(key)!.ids.push(id);
		}

		// Execute bulk updates — run groups concurrently in small batches
		const groupEntries = Array.from(updateGroups.values());
		const CONCURRENT_GROUPS = 5;

		for (let i = 0; i < groupEntries.length; i += CONCURRENT_GROUPS) {
			const chunk = groupEntries.slice(i, i + CONCURRENT_GROUPS);
			const settled = await Promise.allSettled(
				chunk.map(({ ids, updates }) =>
					client.request(updateItems('transactions', ids, updates))
				)
			);

			for (let j = 0; j < settled.length; j++) {
				if (settled[j].status === 'rejected') {
					const failCount = chunk[j].ids.length;
					result.categorized -= failCount;
					result.failed += failCount;
					result.errors.push(`Bulk update failed (${failCount} items): ${(settled[j] as PromiseRejectedResult).reason?.message}`);
				}
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
	// Maps to DB "Administrative" category
	Administrative: [
		'management', 'legal', 'attorney', 'cpa', 'accountant', 'audit',
		'boir', 'consulting', 'vte', 'law office', 'law firm',
		'accounting', 'bookkeeping', 'tax prep', 'admin',
		'bank fee', 'service charge', 'wire fee', 'ach fee',
		'monthly maintenance fee', 'account fee', 'overdraft',
		'nsf', 'returned item', 'chase fee',
		'office', 'supply', 'supplies', 'printing', 'postage',
		'fedex', 'ups', 'shipping', 'miscellaneous', 'misc',
		'phone line', 'telephone',
	],
	// Maps to DB "Contract Services" category
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
		'breezeline', 'power', 'florida power', 'miami-dade water',
		'miami beach water',
	],
	Maintenance: [
		'repair', 'maintenance', 'hvac', 'plumbing', 'a/c',
		'air condition', 'roofing', 'painting', 'electrical repair',
		'tree trimming', 'handyman', 'contractor',
		'garage door',
	],
	Regulatory: [
		'permit', 'license', 'inspection', 'certificate', 'compliance',
		'fire marshal', 'code enforcement', 'sunbiz', 'dbpr',
		'miami beach', 'miami-dade', 'city of', 'county',
		'department of', 'validation permit', 'annual inspection',
	],
	// Maps to DB "Revenue" / "Income" category (for deposits)
	Revenue: [
		'assessment', 'dues', 'hoa', 'maintenance fee', 'condo fee',
		'owner payment', 'unit payment', 'monthly assessment',
		'special assessment', 'rental income', 'laundry income',
		'interest income', 'late fee income',
	],
	// Maps to DB "40-Year Project" category (special assessment capital project)
	'40-Year Project': [
		'40 year', '40yr', '40-year', 'recertification',
		'general contractor', 'ryder',
		'del toro', 'acg engineering',
	],
};

// Additional vendor-to-category map for common HOA vendors
// Values should match actual DB category names (Insurance, Utilities, Contract Services,
// Administrative, Regulatory, Maintenance) or fuzzy-matchable group names
const VENDOR_CATEGORY_MAP: Record<string, string> = {
	'fpl': 'Utilities',
	'fpl direct': 'Utilities',
	'florida power': 'Utilities',
	'teco': 'Utilities',
	'people gas': 'Utilities',
	'breezeline': 'Utilities',
	'breezeline fl': 'Utilities',
	'comcast': 'Utilities',
	'att': 'Utilities',
	'miami beach water': 'Utilities',
	'miami-dade water': 'Utilities',
	'betterwaste': 'Contract Services',
	'better waste': 'Contract Services',
	'waste management': 'Contract Services',
	'wash multifamily': 'Contract Services',
	'washlaundrysystems': 'Contract Services',
	'wash laundry': 'Contract Services',
	'maverick': 'Contract Services',
	'maverick united': 'Contract Services',
	'maverick elevator': 'Contract Services',
	'gutierrez': 'Contract Services',
	'a plus fire': 'Contract Services',
	'1 touch elevator': 'Contract Services',
	'1-touch': 'Contract Services',
	'vte consulting': 'Administrative',
	'vte': 'Administrative',
	'chase': 'Administrative',
	'sunbiz': 'Regulatory',
	'dbpr': 'Regulatory',
	'first insurance': 'Insurance',
	'citizens': 'Insurance',
	'flood insurance': 'Insurance',
	'buildium': 'Administrative',
	'diana wyatt': 'Maintenance',
	'harry tompkins': 'Administrative',
	'harry tempki': 'Administrative',
	'acg engineering': '40-Year Project',
	'general deposit ub': 'Utilities',
	'mdcbuildings': 'Maintenance',
	'mdc buildings': 'Maintenance',
	'del toro rain gutters': '40-Year Project',
	'del toro': '40-Year Project',
	'yurian castro': 'Maintenance',
	'services jbl': 'Maintenance',
	'jbl corp': 'Maintenance',
	'nenad rakita': 'Maintenance',
	'alejandro 207': 'Maintenance',
	'207 alejandro': 'Maintenance',
	'305 bernie': 'Maintenance',
	'camila hoffman': 'Maintenance',
	'jani-king': 'Contract Services',
	'jani king': 'Contract Services',
	'amax tax pro': 'Administrative',
	'amax tax': 'Administrative',
	'florida garage door': 'Maintenance',
	'ryder': '40-Year Project',
};

// Fallback categories: if the primary target from VENDOR_CATEGORY_MAP isn't found
// in the DB, try the fallback category instead (e.g., when a budget hasn't been
// set up for a specific project yet)
const CATEGORY_FALLBACKS: Record<string, string> = {
	'40-Year Project': 'Maintenance',
};

// Account IDs — must match the accounts table (same as useComplianceAlerts)
const ACCOUNT_IDS = {
	OPERATING: 1, // Account 5129
	RESERVE: 2, // Account 7011
	SPECIAL_ASSESSMENT: 3, // Account 5872
} as const;

// Vendors whose payments should ONLY come from the Special Assessment account (5872).
// If these vendors appear in the Operating account, flag as fund_mixing.
const SPECIAL_ASSESSMENT_VENDORS: string[] = [
	'ryder',
	'del toro',
	'acg engineering',
];

// Dual-purpose vendors: category depends on which account the payment comes from.
// When paid from the Special Assessment account (5872) → '40-Year Project',
// otherwise use their default mapping from VENDOR_CATEGORY_MAP.
const SPECIAL_ASSESSMENT_VENDOR_OVERRIDES: Record<string, string> = {
	'maverick': '40-Year Project',
	'maverick elevator': '40-Year Project',
};

// Vendors that map to Revenue when they appear as deposits (e.g., laundry income, tenant payments)
const VENDOR_DEPOSIT_REVENUE: string[] = [
	'wash multifamily',
	'washlaundrysystems',
	'wash laundry',
	'buildium',
];

// ============================================================
// Helper: Normalize text for matching — splits camelCase,
// normalizes separators, and collapses whitespace.
// e.g. "WASHLaundrySystems" → "wash laundry systems"
// e.g. "BREEZELINE FL" → "breezeline fl"
// e.g. "BETTERWASTE MANA" → "betterwaste mana"
// ============================================================
function normalizeForMatching(text: string): string {
	return text
		.replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase: "WASHLaundry" → "WASH Laundry"
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // Split ALLCAPS followed by mixed: "WASHLaundry" → "WASH Laundry"
		.replace(/[-_/&]/g, ' ') // Replace separators with spaces
		.toLowerCase()
		.replace(/\s+/g, ' ') // Collapse multiple spaces
		.trim();
}

// ============================================================
// Helper: Token-based fuzzy matching.
// Splits both strings into tokens and checks for significant
// token overlap. Handles cases like:
//  - "Maverick Elevators" vs "Maverick United Elevators" (overlap on "maverick", "elevators")
//  - "WASHLaundrySystems" vs "Laundry Systems" (after normalization: "wash laundry systems" contains "laundry", "systems")
//  - "BREEZELINE FL" vs "BREEZELINE" (overlap on "breezeline")
// ============================================================
function fuzzyTokenMatch(text1: string, text2: string, minOverlap: number = 1): boolean {
	const norm1 = normalizeForMatching(text1);
	const norm2 = normalizeForMatching(text2);

	// Quick substring check first
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

// ============================================================
// Helper: Find the Revenue/Income category from budget categories.
// Searches by name first, then by description, with progressively
// broader terms.
// ============================================================
function findRevenueCategory(budgetCategories: any[]): any | null {
	// First try: name contains "revenue" or "income"
	let cat = budgetCategories.find((c: any) => {
		const name = (c.category_name || '').toLowerCase();
		return name.includes('revenue') || name.includes('income');
	});
	if (cat) return cat;

	// Second try: name contains "assessment" or "dues"
	cat = budgetCategories.find((c: any) => {
		const name = (c.category_name || '').toLowerCase();
		return name.includes('assessment') || name.includes('dues') || name.includes('owner');
	});
	if (cat) return cat;

	// Third try: description contains revenue/income keywords
	cat = budgetCategories.find((c: any) => {
		const desc = (c.description || '').toLowerCase();
		return desc.includes('revenue') || desc.includes('income')
			|| desc.includes('assessment') || desc.includes('dues')
			|| desc.includes('owner payment');
	});
	return cat || null;
}

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
			// If no match found, use the category name itself as a keyword
			map.set(category.id, { name: catName, keywords: [catNameLower] });
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
	fund_mixing: boolean;
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
		fund_mixing: false,
	};

	const description = (transaction.description || '').toLowerCase().trim();
	const vendorField = (transaction.vendor || '').toLowerCase().trim();
	// Normalize hyphens to spaces so "Jani King" matches "JANI-KING", etc.
	const descriptionNorm = description.replace(/-/g, ' ');
	const vendorFieldNorm = vendorField.replace(/-/g, ' ');
	const searchText = `${descriptionNorm} ${vendorFieldNorm}`;
	// Expanded versions that split camelCase and normalize separators
	// e.g. "WASHLaundrySystems" → "wash laundry systems"
	const vendorFieldExpanded = normalizeForMatching(transaction.vendor || '');
	const descriptionExpanded = normalizeForMatching(transaction.description || '');
	const searchTextExpanded = `${descriptionExpanded} ${vendorFieldExpanded}`;
	const amount = Math.abs(parseFloat(transaction.amount) || 0);
	const isIncomeType = ['deposit', 'transfer_in', 'interest'].includes(transaction.transaction_type);

	// --- Pass 1: Match to a specific budget item ---
	let bestItemScore = 0;
	let bestItem: any = null;

	for (const item of budgetItems) {
		let score = 0;

		// Check vendor patterns (highest priority)
		const vendorPatterns: string[] = item.vendor_patterns || [];
		for (const pattern of vendorPatterns) {
			const p = pattern.toLowerCase().trim().replace(/-/g, ' ');
			if (p && (vendorFieldNorm.includes(p) || descriptionNorm.includes(p))) {
				score += 100;
				break;
			}
			// Fuzzy match: handles camelCase concatenation and token overlap
			// e.g. "WASHLaundrySystems" vs "Laundry Systems", "Maverick United Elevators" vs "Maverick"
			if (p && (
				searchTextExpanded.includes(normalizeForMatching(pattern)) ||
				fuzzyTokenMatch(vendorField, pattern) ||
				fuzzyTokenMatch(vendorField, pattern, 2)
			)) {
				score += 80; // Slightly lower than exact substring match
				break;
			}
		}

		// Check keywords
		const keywords: string[] = item.keywords || [];
		for (const keyword of keywords) {
			const kw = keyword.toLowerCase().trim();
			if (kw && (descriptionNorm.includes(kw) || vendorFieldNorm.includes(kw))) {
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

		// For income-type transactions (deposits, transfers in), override the
		// category to Revenue/Income. The budget_item link is kept for tracking
		// (e.g., laundry revenue still links to the laundry lease budget item)
		// but the category should reflect that this is incoming money.
		if (isIncomeType) {
			const revenueCategory = findRevenueCategory(budgetCategories);
			if (revenueCategory) {
				result.category_id = revenueCategory.id;
				result.category_name = revenueCategory.category_name;
				result.matched_by = 'budget_item_deposit_override';
			}
			// If no revenue category exists, keep the expense category (better than null)
		}
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
				if (searchText.includes(keyword) || searchTextExpanded.includes(keyword)) {
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
	// For deposit-type transactions: only match VENDOR_DEPOSIT_REVENUE vendors to Revenue,
	// skip all expense-vendor mappings (deposits should fall through to Pass 4 for Revenue).
	// This prevents a condo owner who is also a maintenance vendor from having their
	// assessment payment miscategorized as a maintenance expense.
	if (!result.category_id) {
		for (const [vendorKey, groupName] of Object.entries(VENDOR_CATEGORY_MAP)) {
			// Use both original and expanded search text for matching
			const vendorKeyNorm = normalizeForMatching(vendorKey);
			if (searchText.includes(vendorKey) || searchTextExpanded.includes(vendorKeyNorm)) {
				// For income-type transactions, only match deposit-revenue vendors
				if (isIncomeType) {
					const isDepositRevenueVendor = VENDOR_DEPOSIT_REVENUE.some((v) => vendorKey.includes(v) || v.includes(vendorKey));
					if (isDepositRevenueVendor) {
						const revenueCategory = findRevenueCategory(budgetCategories);
						if (revenueCategory) {
							result.category_id = revenueCategory.id;
							result.category_name = revenueCategory.category_name;
							result.confidence = 75;
							result.matched_by = 'vendor_deposit_revenue';
							break;
						}
					}
					// Skip expense-vendor mapping for deposits — let Pass 4 handle as Revenue
					continue;
				}

				// Standard vendor-to-category lookup for non-deposit or non-revenue vendors
				// For dual-purpose vendors, override category when paid from special assessment account
				const txAcctId = typeof transaction.account_id === 'object'
					? transaction.account_id?.id
					: transaction.account_id;
				const override = (txAcctId === ACCOUNT_IDS.SPECIAL_ASSESSMENT)
					? SPECIAL_ASSESSMENT_VENDOR_OVERRIDES[vendorKey]
					: undefined;
				const effectiveGroup = override || groupName;

				// Try the primary category first, then fall back if it doesn't exist in DB
				const categoriesToTry = [effectiveGroup];
				if (CATEGORY_FALLBACKS[effectiveGroup]) {
					categoriesToTry.push(CATEGORY_FALLBACKS[effectiveGroup]);
				}

				for (const targetCategory of categoriesToTry) {
					for (const [catId, catInfo] of categoryKeywordMap) {
						const catGroupLower = catInfo.name.toLowerCase();
						if (
							catGroupLower === targetCategory.toLowerCase() ||
							catGroupLower.includes(targetCategory.toLowerCase()) ||
							targetCategory.toLowerCase().includes(catGroupLower)
						) {
							result.category_id = catId;
							result.category_name = catInfo.name;
							result.confidence = targetCategory === effectiveGroup ? 70 : 60;
							result.matched_by = override
								? 'vendor_lookup_account_override'
								: (targetCategory === effectiveGroup ? 'vendor_lookup' : 'vendor_lookup_fallback');
							break;
						}
					}
					if (result.category_id) break;
				}
				if (result.category_id) break;
			}
		}
	}

	// --- Pass 3b: Extract embedded vendor from bill-pay / Zelle descriptions ---
	// Chase descriptions like "Online Payment 12345 To Acme Corp 01/08" or
	// "Zelle payment to Jane Doe" embed the payee name after " to " / " from ".
	// Extract it and re-run the vendor map lookup.
	if (!result.category_id) {
		const toPatterns = [
			/\bonline\s+(?:ach\s+)?payment\s+\d*\s*to\s+(.+?)(?:\s+\d{2}\/\d{2})?$/i,
			/\bzelle\s+(?:payment\s+)?to\s+(.+?)(?:\s+[A-Z0-9]{8,}|\s+\d{10,}|$)/i,
			/\bbill\s*pay(?:ment)?\s+(?:\d+\s+)?to\s+(.+?)(?:\s+\d{2}\/\d{2})?$/i,
			/\b(?:ach|online)\s+(?:\w+\s+)*?payment\s+\d*\s*to\s+(.+?)(?:\s+\d{2}\/\d{2})?$/i,
			// Also extract sender from "Zelle payment from NAME" (for deposit categorization)
			/\bzelle\s+payment\s+from\s+(.+?)(?:\s+[A-Z0-9]{8,}|\s+\d{10,}|$)/i,
		];

		for (const pattern of toPatterns) {
			const match = description.match(pattern);
			if (match) {
				const extractedVendor = match[1].trim().toLowerCase().replace(/-/g, ' ');

				// For deposit-type transactions with extracted sender, skip expense
				// vendor mapping — these are owner payments (revenue), not expenses.
				// Let Pass 4 handle categorization as Revenue.
				if (isIncomeType) {
					break;
				}

				// Check against VENDOR_CATEGORY_MAP using the extracted vendor
				const txAcctId3b = typeof transaction.account_id === 'object'
					? transaction.account_id?.id
					: transaction.account_id;

				for (const [vendorKey, groupName] of Object.entries(VENDOR_CATEGORY_MAP)) {
					if (extractedVendor.includes(vendorKey) || vendorKey.includes(extractedVendor) ||
						fuzzyTokenMatch(extractedVendor, vendorKey)) {
						const override3b = (txAcctId3b === ACCOUNT_IDS.SPECIAL_ASSESSMENT)
							? SPECIAL_ASSESSMENT_VENDOR_OVERRIDES[vendorKey]
							: undefined;
						const effectiveGroup3b = override3b || groupName;

						const categoriesToTry = [effectiveGroup3b];
						if (CATEGORY_FALLBACKS[effectiveGroup3b]) {
							categoriesToTry.push(CATEGORY_FALLBACKS[effectiveGroup3b]);
						}

						for (const targetCategory of categoriesToTry) {
							for (const [catId, catInfo] of categoryKeywordMap) {
								const catNameLower = catInfo.name.toLowerCase();
								if (
									catNameLower === targetCategory.toLowerCase() ||
									catNameLower.includes(targetCategory.toLowerCase()) ||
									targetCategory.toLowerCase().includes(catNameLower)
								) {
									result.category_id = catId;
									result.category_name = catInfo.name;
									result.confidence = targetCategory === effectiveGroup3b ? 70 : 60;
									result.matched_by = override3b
										? 'vendor_lookup_account_override'
										: (targetCategory === effectiveGroup3b ? 'vendor_lookup' : 'vendor_lookup_fallback');
									break;
								}
							}
							if (result.category_id) break;
						}
						if (result.category_id) break;
					}
				}
				if (result.category_id) break;

				// Also check against category keywords using the extracted vendor name
				if (!result.category_id) {
					for (const [catId, catInfo] of categoryKeywordMap) {
						for (const keyword of catInfo.keywords) {
							if (extractedVendor.includes(keyword) || keyword.includes(extractedVendor)) {
								result.category_id = catId;
								result.category_name = catInfo.name;
								result.confidence = 60;
								result.matched_by = 'category_keyword';
								break;
							}
						}
						if (result.category_id) break;
					}
				}
				break;
			}
		}
	}

	// --- Pass 4: Transaction type heuristics ---
	// In an HOA context, nearly all deposits are assessment/dues revenue.
	// Handles deposits, transfer_in, and interest as income.
	if (!result.category_id && isIncomeType) {
		// Find the revenue/income category using the resilient helper
		// (searches by name, then description, with progressively broader terms)
		const revenueCategory = findRevenueCategory(budgetCategories);

		if (revenueCategory) {
			// High-confidence deposit keywords (owner payments)
			const highConfidenceKeywords = [
				'zelle', 'venmo', 'assessment', 'dues', 'hoa',
				'maintenance fee', 'condo fee', 'remote deposit',
				'remote online deposit', 'mobile deposit', 'check deposit',
				'online transfer', 'ach deposit', 'direct deposit',
				'ach credit', 'orig co', 'payment from', 'deposit',
				'credit', 'quickpay', 'cashapp', 'cash app',
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

	// Transfer out — categorize to Administrative by default (inter-account transfers)
	if (!result.category_id && transaction.transaction_type === 'transfer_out') {
		const adminCategory = budgetCategories.find((cat: any) => {
			const name = (cat.category_name || '').toLowerCase();
			return name.includes('admin') || name.includes('banking') || name.includes('other');
		});
		if (adminCategory) {
			result.category_id = adminCategory.id;
			result.category_name = adminCategory.category_name;
			result.confidence = 40;
			result.matched_by = 'transfer_out_type';
		}
	}

	// Fees — map to Administrative (which includes bank fees in the keyword list)
	if (!result.category_id && transaction.transaction_type === 'fee') {
		for (const cat of budgetCategories) {
			const name = (cat.category_name || '').toLowerCase();
			if (name.includes('admin') || name.includes('bank') || name.includes('fee') || name.includes('other')) {
				result.category_id = cat.id;
				result.category_name = cat.category_name;
				result.confidence = 65;
				result.matched_by = 'fee_type';
				break;
			}
		}
	}

	// --- Pass 5: Vendor record matching (adds vendor info to any match) ---
	// Uses both exact substring and fuzzy token matching to handle vendor name
	// variations like "Maverick Elevators" vs "Maverick United Elevators",
	// "WASHLaundrySystems" vs "Wash Multifamily", "BREEZELINE FL" vs "BREEZELINE".
	for (const vendor of vendors) {
		const vendorTitle = (vendor.title || '').toLowerCase();
		const matchingKeywords: string[] = vendor.matching_keywords || [];

		// Exact substring match on title
		if (vendorTitle && (description.includes(vendorTitle) || vendorField.includes(vendorTitle))) {
			result.vendor_id = vendor.id;
			result.vendor_name = vendor.title;
			break;
		}

		// Fuzzy token match on title (handles camelCase, word reordering, extra words)
		if (vendorTitle && vendorField && fuzzyTokenMatch(vendorField, vendorTitle)) {
			result.vendor_id = vendor.id;
			result.vendor_name = vendor.title;
			break;
		}

		let matched = false;
		for (const keyword of matchingKeywords) {
			if (!keyword) continue;
			const kwLower = keyword.toLowerCase();
			// Exact substring match on keyword
			if (searchText.includes(kwLower)) {
				result.vendor_id = vendor.id;
				result.vendor_name = vendor.title;
				matched = true;
				break;
			}
			// Fuzzy match on keyword (expanded search text includes camelCase-split versions)
			if (searchTextExpanded.includes(normalizeForMatching(keyword))) {
				result.vendor_id = vendor.id;
				result.vendor_name = vendor.title;
				matched = true;
				break;
			}
		}
		if (matched) break;
	}

	// --- Fund-mixing detection ---
	// If this transaction matches a special assessment vendor but is in the
	// operating account, flag it. The Treasurer should have paid from 5872.
	const txAccountId = typeof transaction.account_id === 'object'
		? transaction.account_id?.id
		: transaction.account_id;

	if (txAccountId && txAccountId !== ACCOUNT_IDS.SPECIAL_ASSESSMENT) {
		const isSpecialAssessmentVendor = SPECIAL_ASSESSMENT_VENDORS.some(
			(v) => searchText.includes(v)
		);
		if (isSpecialAssessmentVendor && transaction.transaction_type === 'withdrawal') {
			result.fund_mixing = true;
		}
	}

	return result;
}
