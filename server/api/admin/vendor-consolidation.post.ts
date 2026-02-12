/**
 * POST /api/admin/vendor-consolidation
 *
 * Analyzes transaction vendor names to find duplicates/variants and helps
 * consolidate them using the vendors collection matching_keywords field.
 *
 * Actions:
 *   - action: 'analyze' — scans transactions, finds vendor name variants,
 *     groups them with existing vendor records. Returns suggested consolidations.
 *   - action: 'apply' — given a vendor_id and a list of alternate names,
 *     adds the names as matching_keywords on the vendor record and updates
 *     all transactions with those names to point to the canonical vendor.
 *
 * Requires admin/board member access.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
	updateItem,
	updateItems,
} from '~/server/utils/directus';

interface VendorGroup {
	canonical: string;
	vendor_id: number | null;
	variants: { name: string; count: number }[];
	existing_keywords: string[];
}

export default defineEventHandler(async (event) => {
	const client = useDirectusAdmin();

	// Check admin access
	const isAdmin = await hasAdminAccess(event);
	if (!isAdmin) {
		throw createError({ statusCode: 403, message: 'Admin access required' });
	}

	const body = await readBody(event);
	const action = body?.action || 'analyze';
	const fiscalYear = body?.fiscal_year;

	if (action === 'analyze') {
		return await analyzeVendors(client, fiscalYear);
	} else if (action === 'apply') {
		return await applyConsolidation(client, body);
	}

	throw createError({ statusCode: 400, message: 'Invalid action. Use "analyze" or "apply".' });
});

/**
 * Analyze vendor names across transactions to find duplicates and variants.
 */
async function analyzeVendors(client: any, fiscalYear?: number) {
	// Fetch all vendor records
	const vendors = await client.request(
		readItems('vendors', {
			fields: ['id', 'title', 'matching_keywords', 'status'],
			filter: { status: { _eq: 'published' } },
			limit: -1,
		})
	);

	// Fetch all unique vendor strings from transactions
	const txFilter: any = {};
	if (fiscalYear) {
		txFilter.fiscal_year = { year: { _eq: fiscalYear } };
	}
	txFilter.vendor = { _nnull: true };

	const transactions = await client.request(
		readItems('transactions', {
			fields: ['vendor', 'vendor_id'],
			filter: txFilter,
			limit: -1,
		})
	);

	// Count occurrences of each vendor string
	const vendorCounts: Record<string, { count: number; vendor_id: number | null }> = {};
	for (const tx of transactions) {
		const name = (tx.vendor || '').trim();
		if (!name) continue;

		if (!vendorCounts[name]) {
			vendorCounts[name] = { count: 0, vendor_id: tx.vendor_id ? (typeof tx.vendor_id === 'object' ? tx.vendor_id.id : tx.vendor_id) : null };
		}
		vendorCounts[name].count++;
	}

	// Build lookup: normalized vendor title → vendor record
	const vendorByTitle: Record<string, any> = {};
	const vendorById: Record<number, any> = {};
	for (const v of vendors) {
		if (v.title) {
			vendorByTitle[v.title.toLowerCase().trim()] = v;
		}
		vendorById[v.id] = v;
	}

	// Group similar vendor names
	const vendorNames = Object.keys(vendorCounts).sort();
	const processed = new Set<string>();
	const groups: VendorGroup[] = [];

	for (const name of vendorNames) {
		if (processed.has(name)) continue;

		const nameLower = name.toLowerCase().trim();
		const nameNorm = nameLower.replace(/-/g, ' ');

		// Find all similar names
		const similar: string[] = [name];
		processed.add(name);

		for (const other of vendorNames) {
			if (processed.has(other)) continue;
			const otherLower = other.toLowerCase().trim();
			const otherNorm = otherLower.replace(/-/g, ' ');

			if (areSimilarVendors(nameNorm, otherNorm)) {
				similar.push(other);
				processed.add(other);
			}
		}

		// Also check if any vendor record's matching_keywords capture names not yet in the group
		for (const v of vendors) {
			const keywords = v.matching_keywords || [];
			for (const kw of keywords) {
				const kwLower = (kw || '').toLowerCase().trim();
				for (const s of similar) {
					if (s.toLowerCase().includes(kwLower) || kwLower.includes(s.toLowerCase())) {
						// Check if other names match this keyword
						for (const other of vendorNames) {
							if (processed.has(other)) continue;
							if (other.toLowerCase().includes(kwLower)) {
								similar.push(other);
								processed.add(other);
							}
						}
					}
				}
			}
		}

		// Only report groups with multiple variants OR unlinked vendors
		// Find the matching vendor record
		let matchedVendor: any = null;
		for (const s of similar) {
			const sLower = s.toLowerCase().trim();
			if (vendorByTitle[sLower]) {
				matchedVendor = vendorByTitle[sLower];
				break;
			}
		}

		// Also check by vendor_id on the transactions
		if (!matchedVendor) {
			for (const s of similar) {
				const vid = vendorCounts[s]?.vendor_id;
				if (vid && vendorById[vid]) {
					matchedVendor = vendorById[vid];
					break;
				}
			}
		}

		// Check if any vendor record has keywords matching these names
		if (!matchedVendor) {
			for (const v of vendors) {
				const keywords = (v.matching_keywords || []).map((k: string) => (k || '').toLowerCase());
				const titleLower = (v.title || '').toLowerCase();
				for (const s of similar) {
					const sLower = s.toLowerCase();
					if (sLower.includes(titleLower) || titleLower.includes(sLower) ||
						keywords.some((kw: string) => kw && (sLower.includes(kw) || kw.includes(sLower)))) {
						matchedVendor = v;
						break;
					}
				}
				if (matchedVendor) break;
			}
		}

		const variants = similar.map((s) => ({
			name: s,
			count: vendorCounts[s]?.count || 0,
		})).sort((a, b) => b.count - a.count);

		// Determine canonical name (highest count, or vendor record title)
		const canonical = matchedVendor?.title || variants[0].name;

		if (similar.length > 1 || (matchedVendor && !similar.some((s) => s.toLowerCase() === (matchedVendor.title || '').toLowerCase()))) {
			groups.push({
				canonical,
				vendor_id: matchedVendor?.id || null,
				variants,
				existing_keywords: matchedVendor?.matching_keywords || [],
			});
		}
	}

	// Sort groups by total transaction count (most important first)
	groups.sort((a, b) => {
		const aTotal = a.variants.reduce((sum, v) => sum + v.count, 0);
		const bTotal = b.variants.reduce((sum, v) => sum + v.count, 0);
		return bTotal - aTotal;
	});

	return {
		success: true,
		total_unique_vendor_names: vendorNames.length,
		total_vendor_records: vendors.length,
		groups_found: groups.length,
		groups,
	};
}

/**
 * Check if two vendor names are likely the same vendor.
 */
function areSimilarVendors(a: string, b: string): boolean {
	// Exact match
	if (a === b) return true;

	// One contains the other
	if (a.includes(b) || b.includes(a)) return true;

	// Split into words and check overlap
	const wordsA = a.split(/\s+/).filter((w) => w.length > 2);
	const wordsB = b.split(/\s+/).filter((w) => w.length > 2);

	if (wordsA.length === 0 || wordsB.length === 0) return false;

	// Count shared significant words
	const sharedWords = wordsA.filter((w) => wordsB.some((wb) => wb.includes(w) || w.includes(wb)));
	const minWords = Math.min(wordsA.length, wordsB.length);

	// If most significant words overlap, it's likely the same vendor
	if (minWords > 0 && sharedWords.length / minWords >= 0.5) {
		return true;
	}

	return false;
}

/**
 * Apply vendor consolidation: add matching_keywords and update transactions.
 */
async function applyConsolidation(client: any, body: any) {
	const vendorId = body?.vendor_id;
	const alternateNames: string[] = body?.alternate_names || [];
	const canonicalName = body?.canonical_name;
	const fiscalYear = body?.fiscal_year;

	if (!vendorId) {
		throw createError({ statusCode: 400, message: 'vendor_id is required' });
	}
	if (!alternateNames.length) {
		throw createError({ statusCode: 400, message: 'alternate_names array is required' });
	}

	// Fetch the vendor record
	const vendors = await client.request(
		readItems('vendors', {
			fields: ['id', 'title', 'matching_keywords'],
			filter: { id: { _eq: vendorId } },
			limit: 1,
		})
	);

	if (!vendors || vendors.length === 0) {
		throw createError({ statusCode: 404, message: `Vendor with id ${vendorId} not found` });
	}

	const vendor = vendors[0];
	const existingKeywords: string[] = vendor.matching_keywords || [];
	const vendorTitle = canonicalName || vendor.title;

	// Merge new alternate names into matching_keywords (deduplicated, case-insensitive)
	const keywordSet = new Set(existingKeywords.map((k: string) => k.toLowerCase().trim()));
	const newKeywords = [...existingKeywords];

	for (const altName of alternateNames) {
		const trimmed = altName.trim();
		if (!trimmed) continue;
		const lower = trimmed.toLowerCase();

		// Don't add the canonical name as a keyword
		if (lower === (vendorTitle || '').toLowerCase()) continue;

		if (!keywordSet.has(lower)) {
			keywordSet.add(lower);
			newKeywords.push(trimmed);
		}
	}

	// Update vendor record with new keywords
	await client.request(
		updateItem('vendors', vendorId, {
			matching_keywords: newKeywords,
			...(canonicalName ? { title: canonicalName } : {}),
		})
	);

	// Update transactions that have the alternate vendor names
	let totalUpdated = 0;

	for (const altName of alternateNames) {
		const trimmed = altName.trim();
		if (!trimmed) continue;

		// Skip if it's already the canonical name
		if (trimmed.toLowerCase() === (vendorTitle || '').toLowerCase()) continue;

		const txFilter: any = {
			vendor: { _eq: trimmed },
		};
		if (fiscalYear) {
			txFilter.fiscal_year = { year: { _eq: fiscalYear } };
		}

		// Find transactions with this vendor name
		const txs = await client.request(
			readItems('transactions', {
				fields: ['id'],
				filter: txFilter,
				limit: -1,
			})
		);

		if (txs && txs.length > 0) {
			const txIds = txs.map((t: any) => t.id);

			await client.request(
				updateItems('transactions', txIds, {
					vendor: vendorTitle,
					vendor_id: vendorId,
				})
			);

			totalUpdated += txIds.length;
		}
	}

	return {
		success: true,
		vendor_id: vendorId,
		canonical_name: vendorTitle,
		keywords_added: newKeywords.length - existingKeywords.length,
		total_keywords: newKeywords.length,
		transactions_updated: totalUpdated,
	};
}
