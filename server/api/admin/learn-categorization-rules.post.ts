/**
 * POST /api/admin/learn-categorization-rules
 *
 * "Learn from corrections" — makes the rules-based auto-categorizer smarter over
 * time by mining manually-categorized transactions for reliable vendor → category
 * associations, then teaching them to the engine.
 *
 * The auto-categorizer's strongest signal (Pass 1) is `budget_items.vendor_patterns`.
 * This endpoint derives a vendor token from each manually-categorized transaction
 * (the vendor field, or a payee extracted from the description), finds tokens that
 * map consistently to one category, and appends them to a representative budget
 * item's `vendor_patterns` in that category.
 *
 * Manual categorizations are transactions with a category set where
 * `auto_categorized` is not true — i.e., a human assigned the category.
 *
 * Body:
 *   - fiscal_year?: number     — limit the scan to one fiscal year (default: all)
 *   - dry_run?: boolean        — when true (default), only return proposals; no writes
 *   - min_occurrences?: number — min times a token must appear to be learned (default 2)
 *   - min_dominance?: number   — min share that must agree on one category (default 0.8)
 *
 * Requires admin/board member access.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
	updateItem,
} from '~/server/utils/directus';

defineRouteMeta({ maxDuration: 60 });
export const config = { maxDuration: 60 };

interface LearnedRule {
	token: string;
	category_id: number;
	category_name: string;
	occurrences: number;
	dominance: number;
	sample_description: string;
	budget_item_id: number | null;
	budget_item_desc: string | null;
	action: 'would_add' | 'added' | 'already_present' | 'no_budget_item';
}

interface LearnResult {
	success: boolean;
	dry_run: boolean;
	scanned: number;
	candidates: number;
	learned: number;
	rules: LearnedRule[];
	errors: string[];
}

// Generic banking/transfer words that are never useful as a learned vendor token.
const TOKEN_STOPWORDS = new Set([
	'payment', 'deposit', 'withdrawal', 'transfer', 'online', 'ach', 'check',
	'debit', 'credit', 'fee', 'charge', 'bank', 'mobile', 'remote', 'direct',
	'zelle', 'venmo', 'quickpay', 'cashapp', 'wire', 'to', 'from', 'the', 'and',
	'payroll', 'purchase', 'pos', 'card', 'recurring', 'monthly', 'unknown',
]);

export default defineEventHandler(async (event): Promise<LearnResult> => {
	const session = await getUserSession(event);
	if (!session?.user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Authentication required' });
	}
	if (!hasAdminAccess(session)) {
		throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Admin access required' });
	}

	const body = await readBody(event);
	const fiscalYear = body?.fiscal_year || null;
	const dryRun = body?.dry_run !== false; // default true — preview before writing
	const minOccurrences = Math.max(Number(body?.min_occurrences) || 2, 2);
	const minDominance = Math.min(Math.max(Number(body?.min_dominance) || 0.8, 0.5), 1);

	const client = useDirectusAdmin();

	const result: LearnResult = {
		success: true,
		dry_run: dryRun,
		scanned: 0,
		candidates: 0,
		learned: 0,
		rules: [],
		errors: [],
	};

	try {
		// Manually-categorized transactions: category set, not auto-categorized
		const txFilter: any = {
			category_id: { _nnull: true },
			auto_categorized: { _neq: true },
		};
		if (fiscalYear) {
			txFilter.fiscal_year = { year: { _eq: fiscalYear } };
		}

		const [transactions, budgetItems, budgetCategories] = await Promise.all([
			client.request(
				readItems('transactions', {
					filter: txFilter,
					fields: ['id', 'description', 'vendor', 'category_id', 'transaction_type'],
					limit: -1,
				})
			),
			client.request(
				readItems('budget_items', {
					fields: ['id', 'description', 'vendor_patterns', 'category_id.id', 'category_id.category_name'],
					limit: -1,
				})
			),
			client.request(
				readItems('budget_categories', {
					fields: ['id', 'category_name'],
					limit: -1,
				})
			),
		]);

		result.scanned = transactions.length;

		const catNameById = new Map<number, string>();
		for (const c of budgetCategories) catNameById.set(c.id, c.category_name);

		// token → { categoryId → count, total, sample }
		const tokenStats = new Map<
			string,
			{ counts: Map<number, number>; total: number; sample: string }
		>();

		for (const tx of transactions) {
			const catId = typeof tx.category_id === 'object' ? tx.category_id?.id : tx.category_id;
			if (!catId) continue;

			const token = deriveToken(tx.vendor, tx.description);
			if (!token) continue;

			let stat = tokenStats.get(token);
			if (!stat) {
				stat = { counts: new Map(), total: 0, sample: tx.description || tx.vendor || token };
				tokenStats.set(token, stat);
			}
			stat.counts.set(catId, (stat.counts.get(catId) || 0) + 1);
			stat.total++;
		}

		// Pick tokens that map consistently to a single category
		const proposals: Array<{ token: string; categoryId: number; occurrences: number; dominance: number; sample: string }> = [];
		for (const [token, stat] of tokenStats) {
			if (stat.total < minOccurrences) continue;
			let bestCat = 0;
			let bestCount = 0;
			for (const [catId, count] of stat.counts) {
				if (count > bestCount) {
					bestCount = count;
					bestCat = catId;
				}
			}
			const dominance = bestCount / stat.total;
			if (bestCat && dominance >= minDominance) {
				proposals.push({ token, categoryId: bestCat, occurrences: stat.total, dominance, sample: stat.sample });
			}
		}

		result.candidates = proposals.length;

		// Index budget items by category for attachment
		const itemsByCategory = new Map<number, any[]>();
		for (const item of budgetItems) {
			const itemCatId = typeof item.category_id === 'object' ? item.category_id?.id : item.category_id;
			if (!itemCatId) continue;
			if (!itemsByCategory.has(itemCatId)) itemsByCategory.set(itemCatId, []);
			itemsByCategory.get(itemCatId)!.push(item);
		}

		// Track in-memory pattern additions so multiple tokens for the same item batch together
		const pendingByItem = new Map<number, { item: any; add: string[] }>();

		for (const p of proposals) {
			const categoryName = catNameById.get(p.categoryId) || String(p.categoryId);
			const items = itemsByCategory.get(p.categoryId) || [];

			if (items.length === 0) {
				result.rules.push({
					token: p.token,
					category_id: p.categoryId,
					category_name: categoryName,
					occurrences: p.occurrences,
					dominance: Math.round(p.dominance * 100) / 100,
					sample_description: p.sample,
					budget_item_id: null,
					budget_item_desc: null,
					action: 'no_budget_item',
				});
				continue;
			}

			// Attach to the item that already carries the most vendor_patterns (the
			// most "catch-all" line item for this category), to limit pollution.
			const target = items.reduce((best, cur) => {
				const bestLen = (best.vendor_patterns || []).length;
				const curLen = (cur.vendor_patterns || []).length;
				return curLen > bestLen ? cur : best;
			}, items[0]);

			const existing = new Set((target.vendor_patterns || []).map((x: string) => (x || '').toLowerCase().trim()));
			const pendingAdds = pendingByItem.get(target.id)?.add || [];
			const alreadyPending = pendingAdds.some((x) => x.toLowerCase() === p.token);

			if (existing.has(p.token) || alreadyPending) {
				result.rules.push({
					token: p.token,
					category_id: p.categoryId,
					category_name: categoryName,
					occurrences: p.occurrences,
					dominance: Math.round(p.dominance * 100) / 100,
					sample_description: p.sample,
					budget_item_id: target.id,
					budget_item_desc: target.description || null,
					action: 'already_present',
				});
				continue;
			}

			if (!pendingByItem.has(target.id)) {
				pendingByItem.set(target.id, { item: target, add: [] });
			}
			pendingByItem.get(target.id)!.add.push(p.token);

			result.rules.push({
				token: p.token,
				category_id: p.categoryId,
				category_name: categoryName,
				occurrences: p.occurrences,
				dominance: Math.round(p.dominance * 100) / 100,
				sample_description: p.sample,
				budget_item_id: target.id,
				budget_item_desc: target.description || null,
				action: dryRun ? 'would_add' : 'added',
			});
		}

		// Apply (unless previewing)
		if (!dryRun && pendingByItem.size > 0) {
			for (const { item, add } of pendingByItem.values()) {
				try {
					const merged = [...(item.vendor_patterns || []), ...add];
					await client.request(updateItem('budget_items', item.id, { vendor_patterns: merged }));
					result.learned += add.length;
				} catch (err: any) {
					// Mark this item's rules as failed
					for (const rule of result.rules) {
						if (rule.budget_item_id === item.id && rule.action === 'added') {
							rule.action = 'would_add';
						}
					}
					result.errors.push(`Failed to update budget item ${item.id}: ${err.message}`);
				}
			}
		}

		// Sort most-confident / most-frequent first for display
		result.rules.sort((a, b) => b.occurrences - a.occurrences || b.dominance - a.dominance);

		return result;
	} catch (err: any) {
		console.error('Learn-categorization-rules error:', err);
		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: `Learning failed: ${err.message}`,
		});
	}
});

/**
 * Derive a normalized vendor token from a transaction, preferring the vendor
 * field and falling back to a payee name extracted from common bill-pay / Zelle
 * description patterns. Returns null when no useful token can be found.
 */
function deriveToken(vendor: string | null, description: string | null): string | null {
	const clean = (s: string) =>
		s
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/[-_/&]/g, ' ')
			.toLowerCase()
			.replace(/[^a-z0-9 ]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	let candidate = (vendor || '').trim();

	if (!candidate && description) {
		const patterns = [
			/\bonline\s+(?:ach\s+)?payment\s+\d*\s*to\s+(.+?)(?:\s+\d{2}\/\d{2})?$/i,
			/\bzelle\s+(?:payment\s+)?to\s+(.+?)(?:\s+[A-Z0-9]{8,}|\s+\d{10,}|$)/i,
			/\bzelle\s+payment\s+from\s+(.+?)(?:\s+[A-Z0-9]{8,}|\s+\d{10,}|$)/i,
			/\bbill\s*pay(?:ment)?\s+(?:\d+\s+)?to\s+(.+?)(?:\s+\d{2}\/\d{2})?$/i,
		];
		for (const re of patterns) {
			const m = description.match(re);
			if (m && m[1]) {
				candidate = m[1].trim();
				break;
			}
		}
	}

	if (!candidate) return null;

	const normalized = clean(candidate);
	if (!normalized) return null;

	// Drop tokens that are only generic/stopwords or too short to be a real vendor
	const words = normalized.split(' ').filter((w) => w.length > 1 && !TOKEN_STOPWORDS.has(w));
	const meaningful = words.join(' ').trim();
	if (meaningful.length < 4) return null;
	if (!/[a-z]/.test(meaningful)) return null;

	return meaningful;
}
