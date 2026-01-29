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
 *   - starting_balances: Record<number, number> — optional, map of account_id to starting balance
 *     e.g. { "1": 46086.55 } to set the Jan 1 opening balance for account 1
 *   - force: boolean — optional, if true, recalculates and overwrites existing statement balances
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
	const startingBalances: Record<string, number> = body?.starting_balances || {};
	const forceRecalculate = body?.force === true;

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

			// Collect existing statements with real balances for this account
			const existingWithBalances: Array<{ month: string; beginning_balance: number; ending_balance: number }> = [];
			for (const month of monthsWithTx) {
				const existing = existingMap.get(`${account.id}-${month}`);
				if (existing && existing.ending_balance !== null && existing.ending_balance !== undefined) {
					existingWithBalances.push({
						month,
						beginning_balance: safeParseFloat(existing.beginning_balance),
						ending_balance: safeParseFloat(existing.ending_balance),
					});
				}
			}

			// Determine starting balance:
			// 1. User-provided starting_balances takes priority
			// 2. If an existing statement has real balances, back-calculate the starting balance
			// 3. Default to 0
			let startBal: number;
			const userStartBal = startingBalances[String(account.id)];

			if (userStartBal !== undefined && userStartBal !== null) {
				startBal = Number(userStartBal);
			} else if (existingWithBalances.length > 0) {
				// Use the earliest existing statement to back-calculate Jan 1 balance
				const earliest = existingWithBalances[0];
				// beginning_balance of the earliest statement = balance before that month's transactions
				// So we need to figure out what the running balance was at the start of that month
				// by subtracting the net of all prior months from the earliest beginning balance
				const earliestMonthIndex = monthsWithTx.indexOf(earliest.month);
				let priorNet = 0;
				for (let i = 0; i < earliestMonthIndex; i++) {
					const mTx = accountTx.filter((t: any) => t.statement_month === monthsWithTx[i]);
					const mIn = mTx
						.filter((t: any) => t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in')
						.reduce((sum: number, t: any) => sum + safeParseFloat(t.amount), 0);
					const mOut = mTx
						.filter((t: any) => t.transaction_type === 'withdrawal' || t.transaction_type === 'fee' || t.transaction_type === 'transfer_out')
						.reduce((sum: number, t: any) => sum + safeParseFloat(t.amount), 0);
					priorNet += mIn - mOut;
				}
				startBal = earliest.beginning_balance - priorNet;
			} else {
				startBal = 0;
			}

			let runningBalance = startBal;

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

				// If existing statement has real balances from bank PDF, use those as anchors
				// (but not when force-recalculating with a user-provided starting balance)
				const hasRealBalances = !forceRecalculate && existing &&
					existing.beginning_balance !== null && existing.beginning_balance !== undefined &&
					existing.ending_balance !== null && existing.ending_balance !== undefined;

				if (hasRealBalances) {
					// Anchor to the real ending balance for subsequent months
					runningBalance = safeParseFloat(existing.ending_balance);
				}

				const beginBal = hasRealBalances ? safeParseFloat(existing.beginning_balance) : Math.round(prevBalance * 100) / 100;
				const endBal = hasRealBalances ? safeParseFloat(existing.ending_balance) : Math.round(runningBalance * 100) / 100;

				try {
					if (existing) {
						// Update if balances are missing OR if force recalculate is enabled
						const needsUpdate = forceRecalculate ||
							(existing.beginning_balance === null || existing.beginning_balance === undefined) ||
							(existing.ending_balance === null || existing.ending_balance === undefined);

						if (needsUpdate) {
							const updates: any = {
								beginning_balance: beginBal,
								ending_balance: endBal,
							};

							await client.request(updateItem('monthly_statements', existing.id, updates));
							result.updated++;
							result.statements.push({
								account_id: account.id,
								account_name: account.account_name,
								month,
								beginning_balance: beginBal,
								ending_balance: endBal,
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
								beginning_balance: beginBal,
								ending_balance: endBal,
								status: 'published',
							})
						);
						result.created++;
						result.statements.push({
							account_id: account.id,
							account_name: account.account_name,
							month,
							beginning_balance: beginBal,
							ending_balance: endBal,
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
