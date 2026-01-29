/**
 * POST /api/admin/auto-categorize-transactions
 *
 * Finds uncategorized transactions and attempts to match them to budget categories
 * and budget items using vendor patterns, keywords, and description matching.
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
		// 1. Fetch budget items with category info for this fiscal year
		const budgetItems = await client.request(
			readItems('budget_items', {
				filter: { fiscal_year: { year: { _eq: fiscalYear } } },
				fields: ['*', 'category_id.id', 'category_id.category_name'],
				limit: -1,
			})
		);

		// 2. Fetch budget categories for this fiscal year
		const budgetCategories = await client.request(
			readItems('budget_categories', {
				filter: { fiscal_year: { year: { _eq: fiscalYear } } },
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

		// 5. Run matching algorithm
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
				const match = matchTransaction(tx, budgetItems, budgetCategories, vendors);

				if (match.confidence >= minConfidence) {
					// Apply the match to the database
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
// Matching logic (server-side port of useTransactionMatching)
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
	vendors: any[]
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

		// Check keywords (medium priority)
		const keywords: string[] = item.keywords || [];
		for (const keyword of keywords) {
			const kw = keyword.toLowerCase().trim();
			if (kw && description.includes(kw)) {
				score += 50;
			}
		}

		// Check item description similarity
		const itemDesc = (item.description || '').toLowerCase();
		if (itemDesc && (description.includes(itemDesc) || itemDesc.includes(description.split(' ')[0]))) {
			score += 25;
		}

		// Amount range check
		const monthlyBudget = parseFloat(item.monthly_budget) || 0;
		if (monthlyBudget > 0 && amount > 0) {
			const variance = Math.abs(amount - monthlyBudget) / monthlyBudget;
			if (variance < 0.2) {
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

	// --- Pass 2: Fallback to category-level matching if no item match ---
	if (!result.category_id) {
		const categoryPatterns: Record<string, string[]> = {
			Insurance: ['insurance', 'premium', 'coverage', 'policy'],
			Professional: ['management', 'legal', 'attorney', 'cpa', 'accountant', 'audit', 'boir'],
			Utilities: ['electric', 'water', 'gas', 'internet', 'cable', 'fpl', 'att', 'comcast', 'utility'],
			Maintenance: ['repair', 'maintenance', 'cleaning', 'janitorial', 'landscaping', 'pool', 'elevator', 'hvac'],
			Regulatory: ['permit', 'license', 'inspection', 'certificate', 'compliance', 'fire marshal'],
			Banking: ['bank', 'fee', 'charge', 'wire', 'ach'],
		};

		for (const category of budgetCategories) {
			const categoryName = category.category_name;
			const patterns = categoryPatterns[categoryName] || [];

			for (const pattern of patterns) {
				if (description.includes(pattern) || vendorField.includes(pattern)) {
					result.category_id = category.id;
					result.category_name = categoryName;
					result.confidence = 75;
					result.matched_by = 'category_keyword';
					break;
				}
			}
			if (result.category_id) break;
		}
	}

	// --- Pass 3: Vendor matching (always attempt, adds vendor info) ---
	for (const vendor of vendors) {
		const vendorTitle = (vendor.title || '').toLowerCase();
		const matchingKeywords: string[] = vendor.matching_keywords || [];

		if (vendorTitle && description.includes(vendorTitle)) {
			result.vendor_id = vendor.id;
			result.vendor_name = vendor.title;
			break;
		}

		let matched = false;
		for (const keyword of matchingKeywords) {
			if (keyword && description.includes(keyword.toLowerCase())) {
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
