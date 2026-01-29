/**
 * POST /api/admin/auto-link-transfers
 *
 * Automatically links transfer_out transactions to their corresponding transfer_in
 * transactions on other accounts by matching:
 *   1. Account number suffixes in descriptions (e.g., "Online Transfer To Mma ...7011")
 *   2. Amount matching between transfer_out and transfer_in
 *   3. Date proximity (same day or +/- 1 business day)
 *
 * Also auto-categorizes transfers based on the target account type:
 *   - Transfers to 'special' accounts → Special Assessment category
 *   - Transfers to 'reserve' accounts → Reserve category
 *   - Transfers to 'operating' accounts → Operating category
 *
 * Accepts:
 *   - fiscal_year: number (required)
 *   - account_id: number (optional, limit to specific account)
 *   - dry_run: boolean (optional, if true just returns matches without writing)
 *
 * Requires admin/board member access.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
	updateItem,
} from '~/server/utils/directus';

interface LinkResult {
	success: boolean;
	total_unlinked: number;
	linked: number;
	categorized: number;
	skipped: number;
	dry_run: boolean;
	results: Array<{
		transfer_out_id: number;
		transfer_in_id: number;
		amount: number;
		from_account: string;
		to_account: string;
		target_account_type: string;
		category_assigned: string | null;
		description: string;
		matched_by: string;
	}>;
	errors: string[];
}

// Extract the last 4 digits of an account number from a transfer description
// Patterns: "Online Transfer To Mma ...7011", "Online Transfer From Mma ...5872"
function extractAccountSuffix(description: string): string | null {
	const desc = (description || '').trim();

	// Pattern: "...NNNN" (3 dots followed by digits)
	const dotMatch = desc.match(/\.{3}(\d{4})/);
	if (dotMatch) return dotMatch[1];

	// Pattern: "Mma NNNN" or "MMA NNNN"
	const mmaMatch = desc.match(/[Mm][Mm][Aa]\s+(\d{4})/);
	if (mmaMatch) return mmaMatch[1];

	// Pattern: account number at end "Transaction#: NNNNNNNNNNN" - extract last 4
	// This is a transaction reference, not an account number, so skip it

	return null;
}

// Check if a description indicates a transfer TO another account
function isTransferTo(description: string): boolean {
	const desc = (description || '').toLowerCase();
	return desc.includes('transfer to') || desc.includes('online payment to');
}

// Check if a description indicates a transfer FROM another account
function isTransferFrom(description: string): boolean {
	const desc = (description || '').toLowerCase();
	return desc.includes('transfer from');
}

// Check if two dates are within 1 business day of each other
function datesMatch(date1: string, date2: string): boolean {
	if (!date1 || !date2) return false;
	const d1 = new Date(date1);
	const d2 = new Date(date2);
	const diffMs = Math.abs(d1.getTime() - d2.getTime());
	const diffDays = diffMs / (1000 * 60 * 60 * 24);
	return diffDays <= 3; // Allow up to 3 days for weekends/processing
}

export default defineEventHandler(async (event): Promise<LinkResult> => {
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
	const filterAccountId = body?.account_id || null;
	const dryRun = body?.dry_run === true;

	if (!fiscalYear) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'fiscal_year is required',
		});
	}

	const client = useDirectusAdmin();

	try {
		// 1. Fetch all accounts with their numbers and types
		const accounts = await client.request(
			readItems('accounts', {
				fields: ['id', 'account_name', 'account_number', 'account_type'],
				limit: -1,
			})
		);

		// Build account lookup by last 4 digits of account_number
		const accountBySuffix = new Map<string, any>();
		const accountById = new Map<number, any>();
		for (const acct of accounts) {
			accountById.set(acct.id, acct);
			if (acct.account_number) {
				const suffix = acct.account_number.slice(-4);
				accountBySuffix.set(suffix, acct);
			}
		}

		// 2. Fetch budget categories for transfer categorization
		const budgetCategories = await client.request(
			readItems('budget_categories', {
				filter: {
					_or: [
						{ fiscal_year: { year: { _eq: fiscalYear } } },
						{ fiscal_year: { _null: true } },
					],
				},
				fields: ['id', 'category_name'],
				limit: -1,
			})
		);

		// Map account types to category names
		function findCategoryForAccountType(accountType: string): { id: number; name: string } | null {
			const typeKeywords: Record<string, string[]> = {
				special: ['special assessment', 'special', 'assessment'],
				reserve: ['reserve', 'reserves'],
				operating: ['operating', 'operations', 'general'],
			};

			const keywords = typeKeywords[accountType] || [];
			for (const keyword of keywords) {
				const cat = budgetCategories.find((c: any) =>
					(c.category_name || '').toLowerCase().includes(keyword)
				);
				if (cat) return { id: cat.id, name: cat.category_name };
			}

			// Fallback: look for a "Transfer" category
			const transferCat = budgetCategories.find((c: any) =>
				(c.category_name || '').toLowerCase().includes('transfer')
			);
			if (transferCat) return { id: transferCat.id, name: transferCat.category_name };

			return null;
		}

		// 3. Fetch transfer transactions that are not yet linked
		const txFilter: any = {
			fiscal_year: { year: { _eq: fiscalYear } },
			linked_transfer_id: { _null: true },
			transaction_type: {
				_in: ['transfer_out', 'transfer_in', 'deposit', 'withdrawal'],
			},
		};

		if (filterAccountId) {
			txFilter.account_id = { _eq: filterAccountId };
		}

		const transactions = await client.request(
			readItems('transactions', {
				filter: txFilter,
				fields: ['id', 'account_id', 'description', 'vendor', 'amount', 'transaction_type', 'transaction_date', 'statement_month', 'category_id'],
				sort: ['transaction_date'],
				limit: -1,
			})
		);

		// Also fetch ALL transfer transactions (including already-linked) for matching
		const allTransfers = await client.request(
			readItems('transactions', {
				filter: {
					fiscal_year: { year: { _eq: fiscalYear } },
					transaction_type: {
						_in: ['transfer_out', 'transfer_in', 'deposit', 'withdrawal'],
					},
				},
				fields: ['id', 'account_id', 'description', 'vendor', 'amount', 'transaction_type', 'transaction_date', 'linked_transfer_id'],
				sort: ['transaction_date'],
				limit: -1,
			})
		);

		// 4. Identify transfer candidates
		// A transfer_out on account A with "...7011" in description should match
		// a transfer_in on the account ending in 7011 with matching amount and date
		const result: LinkResult = {
			success: true,
			total_unlinked: 0,
			linked: 0,
			categorized: 0,
			skipped: 0,
			dry_run: dryRun,
			results: [],
			errors: [],
		};

		// Find unlinked outgoing transfers (transfer_out or withdrawals that are transfers)
		const outgoing = transactions.filter((t: any) => {
			const isOutType = t.transaction_type === 'transfer_out' || t.transaction_type === 'withdrawal';
			const isTransferDesc = isTransferTo(t.description);
			return isOutType && isTransferDesc;
		});

		// Find unlinked incoming transfers (transfer_in or deposits that are transfers)
		const incoming = allTransfers.filter((t: any) => {
			const isInType = t.transaction_type === 'transfer_in' || t.transaction_type === 'deposit';
			const isTransferDesc = isTransferFrom(t.description);
			return isInType && isTransferDesc && !t.linked_transfer_id;
		});

		result.total_unlinked = outgoing.length + incoming.length;

		// Track which incoming transfers have been matched so we don't double-match
		const matchedIncoming = new Set<number>();

		for (const outTx of outgoing) {
			try {
				const targetSuffix = extractAccountSuffix(outTx.description);
				if (!targetSuffix) {
					result.skipped++;
					continue;
				}

				const targetAccount = accountBySuffix.get(targetSuffix);
				if (!targetAccount) {
					result.skipped++;
					continue;
				}

				const sourceAccount = accountById.get(outTx.account_id);
				const outAmount = Math.abs(parseFloat(outTx.amount) || 0);

				// Find matching incoming transfer on the target account
				const match = incoming.find((inTx: any) => {
					if (matchedIncoming.has(inTx.id)) return false;
					if (inTx.account_id !== targetAccount.id) return false;

					const inAmount = Math.abs(parseFloat(inTx.amount) || 0);
					const amountMatch = Math.abs(outAmount - inAmount) < 0.01;
					const dateMatch = datesMatch(outTx.transaction_date, inTx.transaction_date);

					return amountMatch && dateMatch;
				});

				if (!match) {
					result.skipped++;
					continue;
				}

				matchedIncoming.add(match.id);

				// Determine category based on target account type
				const categoryMatch = findCategoryForAccountType(targetAccount.account_type);

				const matchResult = {
					transfer_out_id: outTx.id,
					transfer_in_id: match.id,
					amount: outAmount,
					from_account: sourceAccount?.account_name || `Account ${outTx.account_id}`,
					to_account: targetAccount.account_name,
					target_account_type: targetAccount.account_type,
					category_assigned: categoryMatch?.name || null,
					description: outTx.description,
					matched_by: `account_suffix:${targetSuffix}+amount+date`,
				};

				if (!dryRun) {
					// Link both sides
					await client.request(
						updateItem('transactions', outTx.id, {
							linked_transfer_id: match.id,
							transaction_type: 'transfer_out', // Ensure correct type
						})
					);
					await client.request(
						updateItem('transactions', match.id, {
							linked_transfer_id: outTx.id,
							transaction_type: 'transfer_in', // Ensure correct type
						})
					);

					// Categorize both sides if category found and not already categorized
					if (categoryMatch) {
						if (!outTx.category_id) {
							await client.request(
								updateItem('transactions', outTx.id, {
									category_id: categoryMatch.id,
									auto_categorized: true,
								})
							);
						}
						if (!match.category_id) {
							await client.request(
								updateItem('transactions', match.id, {
									category_id: categoryMatch.id,
									auto_categorized: true,
								})
							);
						}
						result.categorized += 2;
					}
				}

				result.linked++;
				result.results.push(matchResult);
			} catch (err: any) {
				result.errors.push(`Transfer ${outTx.id}: ${err.message}`);
			}
		}

		return result;
	} catch (err: any) {
		console.error('Auto-link transfers error:', err);
		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: `Auto-link transfers failed: ${err.message}`,
		});
	}
});
