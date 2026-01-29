/**
 * POST /api/admin/backfill-monthly-statements
 *
 * Creates monthly_statements records from existing transaction data for months
 * that don't already have a statement record. Calculates beginning and ending
 * balances by computing a running balance from all transactions.
 *
 * Accepts:
 *   - fiscal_year: number (e.g. 2025) — required
 *   - account_id: number — optional, limit to specific account (does all if omitted)
 *
 * Requires admin/board member access.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
	createItem,
	updateItem,
} from '~/server/utils/directus';

interface BackfillResult {
	success: boolean;
	created: number;
	updated: number;
	skipped: number;
	statements: Array<{
		account_id: number;
		account_name: string;
		month: string;
		beginning_balance: number;
		ending_balance: number;
		transaction_count: number;
		action: 'created' | 'updated' | 'skipped';
	}>;
	errors: string[];
}

export default defineEventHandler(async (event): Promise<BackfillResult> => {
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

	if (!fiscalYear) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'fiscal_year is required',
		});
	}

	const client = useDirectusAdmin();

	try {
		// 1. Resolve the fiscal_year record ID
		const fiscalYears = await client.request(
			readItems('fiscal_years', {
				filter: { year: { _eq: fiscalYear } },
				fields: ['id', 'year'],
				limit: 1,
			})
		);

		if (!fiscalYears || fiscalYears.length === 0) {
			throw new Error(`No fiscal_years record found for year ${fiscalYear}. Create one first.`);
		}

		const fiscalYearId = fiscalYears[0].id;

		// 2. Fetch all accounts (or just the requested one)
		const accountFilter: any = {};
		if (filterAccountId) {
			accountFilter.id = { _eq: filterAccountId };
		}

		const accounts = await client.request(
			readItems('accounts', {
				filter: accountFilter,
				fields: ['id', 'account_name', 'account_number'],
				sort: ['account_number'],
			})
		);

		// 3. Fetch all transactions for this fiscal year
		const transactions = await client.request(
			readItems('transactions', {
				filter: { fiscal_year: { year: { _eq: fiscalYear } } },
				fields: ['id', 'account_id', 'statement_month', 'transaction_type', 'amount', 'transaction_date'],
				sort: ['transaction_date'],
				limit: -1,
			})
		);

		// 4. Fetch existing monthly_statements
		const existingStatements = await client.request(
			readItems('monthly_statements', {
				filter: { fiscal_year: { _eq: fiscalYearId } },
				fields: ['id', 'account_id', 'statement_month', 'beginning_balance', 'ending_balance'],
				limit: -1,
			})
		);

		const existingMap = new Map<string, any>();
		for (const stmt of existingStatements) {
			existingMap.set(`${stmt.account_id}-${stmt.statement_month}`, stmt);
		}

		// 5. Process each account
		const result: BackfillResult = {
			success: true,
			created: 0,
			updated: 0,
			skipped: 0,
			statements: [],
			errors: [],
		};

		const safeParseFloat = (v: any) => {
			const parsed = parseFloat(v);
			return isNaN(parsed) ? 0 : parsed;
		};

		for (const account of accounts) {
			// Get transactions for this account, grouped by month
			const accountTx = transactions.filter((t: any) => t.account_id === account.id);
			const monthsWithTx = [...new Set(accountTx.map((t: any) => t.statement_month).filter((m: any) => m))].sort();

			if (monthsWithTx.length === 0) continue;

			// Calculate running balance per month
			let runningBalance = 0;

			for (const month of monthsWithTx) {
				const monthTx = accountTx.filter((t: any) => t.statement_month === month);
				const prevBalance = runningBalance;

				const totalIn = monthTx
					.filter((t: any) => t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in')
					.reduce((sum: number, t: any) => sum + safeParseFloat(t.amount), 0);

				const totalOut = monthTx
					.filter((t: any) =>
						t.transaction_type === 'withdrawal' ||
						t.transaction_type === 'fee' ||
						t.transaction_type === 'transfer_out'
					)
					.reduce((sum: number, t: any) => sum + safeParseFloat(t.amount), 0);

				runningBalance += totalIn - totalOut;

				const key = `${account.id}-${month}`;
				const existing = existingMap.get(key);

				try {
					if (existing) {
						// Update if balances are missing
						const needsUpdate =
							(!existing.beginning_balance && existing.beginning_balance !== 0) ||
							(!existing.ending_balance && existing.ending_balance !== 0);

						if (needsUpdate) {
							const updates: any = {};
							if (!existing.beginning_balance && existing.beginning_balance !== 0) {
								updates.beginning_balance = Math.round(prevBalance * 100) / 100;
							}
							if (!existing.ending_balance && existing.ending_balance !== 0) {
								updates.ending_balance = Math.round(runningBalance * 100) / 100;
							}

							await client.request(updateItem('monthly_statements', existing.id, updates));
							result.updated++;
							result.statements.push({
								account_id: account.id,
								account_name: account.account_name,
								month,
								beginning_balance: Math.round(prevBalance * 100) / 100,
								ending_balance: Math.round(runningBalance * 100) / 100,
								transaction_count: monthTx.length,
								action: 'updated',
							});
						} else {
							result.skipped++;
							result.statements.push({
								account_id: account.id,
								account_name: account.account_name,
								month,
								beginning_balance: safeParseFloat(existing.beginning_balance),
								ending_balance: safeParseFloat(existing.ending_balance),
								transaction_count: monthTx.length,
								action: 'skipped',
							});
						}
					} else {
						// Create new statement
						await client.request(
							createItem('monthly_statements', {
								account_id: account.id,
								statement_month: month,
								fiscal_year: fiscalYearId,
								beginning_balance: Math.round(prevBalance * 100) / 100,
								ending_balance: Math.round(runningBalance * 100) / 100,
								status: 'published',
							})
						);
						result.created++;
						result.statements.push({
							account_id: account.id,
							account_name: account.account_name,
							month,
							beginning_balance: Math.round(prevBalance * 100) / 100,
							ending_balance: Math.round(runningBalance * 100) / 100,
							transaction_count: monthTx.length,
							action: 'created',
						});
					}
				} catch (err: any) {
					result.errors.push(`${account.account_name} ${month}: ${err.message}`);
				}
			}
		}

		return result;
	} catch (err: any) {
		console.error('Backfill error:', err);
		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: `Backfill failed: ${err.message}`,
		});
	}
});
