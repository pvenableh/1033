/**
 * POST /api/admin/reconciliation-assistant
 *
 * Claude-powered reconciliation assistant that analyzes transactions for a given
 * month and account, then provides intelligent suggestions for:
 *   - Uncategorized transaction categorization
 *   - Transactions needing notes or clarification
 *   - Potential duplicate or suspicious entries
 *   - Future-period payments that need special marking
 *   - Transfer matching suggestions
 *   - Overall reconciliation assessment
 *
 * Accepts:
 *   - fiscal_year: number (required)
 *   - account_id: number (required)
 *   - month: string (required, '01'-'12')
 *
 * Requires admin/board member access and ANTHROPIC_API_KEY.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
} from '~/server/utils/directus';
import { isClaudeConfigured, callClaude, extractClaudeText } from '~/server/utils/claude';

// Extend Vercel timeout for AI endpoints (Hobby plan max: 60s)
export const config = {
	maxDuration: 60,
}

export default defineEventHandler(async (event) => {
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

	if (!isClaudeConfigured()) {
		throw createError({
			statusCode: 503,
			statusMessage: 'Service Unavailable',
			message: 'Claude AI is not configured. Set the ANTHROPIC_API_KEY environment variable.',
		});
	}

	const body = await readBody(event);
	const fiscalYear = body?.fiscal_year;
	const accountId = body?.account_id;
	const month = body?.month;

	if (!fiscalYear || !accountId || !month) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'fiscal_year, account_id, and month are required',
		});
	}

	const client = useDirectusAdmin();

	try {
		// 1. Fetch the account info
		const accounts = await client.request(
			readItems('accounts', {
				filter: { id: { _eq: accountId } },
				fields: ['id', 'account_name', 'account_number', 'account_type'],
				limit: 1,
			})
		);
		const account = accounts[0];
		if (!account) {
			throw new Error(`Account ${accountId} not found`);
		}

		// 2. Fetch all accounts for transfer context
		const allAccounts = await client.request(
			readItems('accounts', {
				fields: ['id', 'account_name', 'account_number', 'account_type'],
				limit: -1,
			})
		);

		// 3. Fetch transactions for this month
		const transactions = await client.request(
			readItems('transactions', {
				filter: {
					fiscal_year: { year: { _eq: fiscalYear } },
					account_id: { _eq: accountId },
					statement_month: { _eq: month },
				},
				fields: [
					'id', 'description', 'vendor', 'amount', 'transaction_type',
					'transaction_date', 'category_id', 'budget_item_id',
					'linked_transfer_id', 'reconciliation_status',
					'auto_categorized', 'board_notes',
				],
				sort: ['transaction_date'],
				limit: -1,
			})
		);

		// 4. Fetch budget categories
		const budgetCategories = await client.request(
			readItems('budget_categories', {
				filter: {
					_or: [
						{ fiscal_year: { year: { _eq: fiscalYear } } },
						{ fiscal_year: { _null: true } },
					],
				},
				fields: ['id', 'category_name', 'monthly_budget', 'yearly_budget'],
				limit: -1,
			})
		);

		// 5. Fetch monthly statement for this month
		const fyRecords = await client.request(
			readItems('fiscal_years', {
				filter: { year: { _eq: fiscalYear } },
				fields: ['id'],
				limit: 1,
			})
		);
		const fyId = fyRecords[0]?.id;

		let statement = null;
		if (fyId) {
			const statements = await client.request(
				readItems('monthly_statements', {
					filter: {
						fiscal_year: { _eq: fyId },
						account_id: { _eq: accountId },
						statement_month: { _eq: month },
					},
					fields: ['id', 'beginning_balance', 'ending_balance', 'reconciled'],
					limit: 1,
				})
			);
			statement = statements[0] || null;
		}

		// 6. Build context for Claude
		const monthNames: Record<string, string> = {
			'01': 'January', '02': 'February', '03': 'March', '04': 'April',
			'05': 'May', '06': 'June', '07': 'July', '08': 'August',
			'09': 'September', '10': 'October', '11': 'November', '12': 'December',
		};

		const categoryMap = new Map<number, string>();
		for (const cat of budgetCategories) {
			categoryMap.set(cat.id, cat.category_name);
		}

		const txSummary = transactions.map((tx: any) => ({
			id: tx.id,
			date: tx.transaction_date,
			description: tx.description,
			vendor: tx.vendor || null,
			amount: parseFloat(tx.amount) || 0,
			type: tx.transaction_type,
			category: tx.category_id ? (categoryMap.get(typeof tx.category_id === 'object' ? tx.category_id.id : tx.category_id) || 'Unknown') : null,
			is_categorized: !!tx.category_id,
			is_reconciled: tx.reconciliation_status === 'reconciled',
			is_linked_transfer: !!tx.linked_transfer_id,
			has_notes: !!tx.board_notes,
		}));

		const uncategorized = txSummary.filter((t: any) => !t.is_categorized);
		const unreconciled = txSummary.filter((t: any) => !t.is_reconciled);
		const unlinkedTransfers = txSummary.filter((t: any) =>
			(t.type === 'transfer_out' || t.type === 'transfer_in') && !t.is_linked_transfer
		);

		// Calculate totals
		const totalDeposits = txSummary
			.filter((t: any) => t.type === 'deposit' || t.type === 'transfer_in')
			.reduce((sum: number, t: any) => sum + t.amount, 0);
		const totalWithdrawals = txSummary
			.filter((t: any) => t.type === 'withdrawal' || t.type === 'transfer_out' || t.type === 'fee')
			.reduce((sum: number, t: any) => sum + t.amount, 0);

		const accountsList = allAccounts.map((a: any) =>
			`- ${a.account_name} (${a.account_type}) ending in ...${a.account_number?.slice(-4) || '????'}`
		).join('\n');

		const categoriesList = budgetCategories.map((c: any) =>
			`- ${c.category_name} (monthly budget: $${(parseFloat(c.monthly_budget) || 0).toFixed(2)})`
		).join('\n');

		const systemPrompt = `You are a financial reconciliation assistant for 1033 Lenox Park, a condominium association in Miami Beach, FL. You help the Treasurer and Board reconcile monthly bank statements.

CONTEXT:
- This is an HOA with 3 bank accounts: Operating (daily expenses), Reserve (long-term savings/capital), and Special Assessment (one-time assessments from owners)
- The Treasurer uses Zelle to accept owner payments for HOA maintenance dues and special assessments
- Transfers between accounts are common (e.g., moving funds from Operating to Reserve or Special Assessment)
- Transfer descriptions contain account suffixes like "...7011" or "...5872" that identify the target account
- Common vendors: Maverick Elevators, Betterwaste Management, Florida Power & Light, Buildium (property management software)
- Revenue comes from: owner dues/assessments, Buildium ACH payments, Zelle payments, laundry income (Wash Multifamily)

ACCOUNTS:
${accountsList}

BUDGET CATEGORIES:
${categoriesList}

RULES FOR ANALYSIS:
1. For uncategorized transactions, suggest the most likely budget category from the list above
2. Flag any deposits that might be for a FUTURE quarter (e.g., payment received in January for Q2 dues)
3. Identify transfers that should be linked to counterparts on other accounts
4. Flag any suspicious or unusual transactions that need board notes
5. For each suggestion, explain your reasoning briefly
6. If a transaction is clearly a Zelle payment from a resident, it's Revenue (HOA dues or special assessment)
7. Checks without clear payees need notes asking the Treasurer to identify the payee

RESPOND WITH ONLY VALID JSON in this exact structure:
{
  "summary": "Brief overall assessment of this month's reconciliation status",
  "items": [
    {
      "transaction_id": 123,
      "action": "categorize" | "add_note" | "flag_review" | "link_transfer" | "mark_future_period",
      "suggestion": "What should be done",
      "category_name": "Suggested category name (only for categorize action)",
      "note_text": "Suggested note text (only for add_note/flag_review)",
      "confidence": "high" | "medium" | "low",
      "reasoning": "Brief explanation"
    }
  ],
  "reconciliation_assessment": {
    "status": "ready" | "needs_review" | "issues_found",
    "issues": ["List of issues that prevent reconciliation"],
    "recommendations": ["List of recommended actions"]
  }
}`;

		const userMessage = `Analyze the ${monthNames[month] || month} ${fiscalYear} bank statement for the ${account.account_name} account (${account.account_type} account, ending ...${account.account_number?.slice(-4) || '????'}).

STATEMENT BALANCES:
- Beginning Balance: $${statement?.beginning_balance?.toFixed(2) || 'Unknown'}
- Ending Balance: $${statement?.ending_balance?.toFixed(2) || 'Unknown'}
- Total Deposits: $${totalDeposits.toFixed(2)}
- Total Withdrawals: $${totalWithdrawals.toFixed(2)}
- Calculated Ending: $${((statement?.beginning_balance || 0) + totalDeposits - totalWithdrawals).toFixed(2)}

STATUS:
- Total transactions: ${txSummary.length}
- Uncategorized: ${uncategorized.length}
- Unreconciled: ${unreconciled.length}
- Unlinked transfers: ${unlinkedTransfers.length}

TRANSACTIONS:
${JSON.stringify(txSummary, null, 2)}

Please analyze each transaction and provide your recommendations.`;

		// 7. Call Claude
		const claudeResponse = await callClaude({
			system: systemPrompt,
			messages: [
				{ role: 'user', content: userMessage },
			],
			maxTokens: 8192,
		});

		const responseText = extractClaudeText(claudeResponse);

		// 8. Parse the JSON response
		let analysis;
		try {
			// Strip markdown fences if present
			const jsonStr = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
			analysis = JSON.parse(jsonStr);
		} catch {
			// If JSON parsing fails, return the raw text as a summary
			analysis = {
				summary: responseText,
				items: [],
				reconciliation_assessment: {
					status: 'needs_review',
					issues: ['Could not parse structured response'],
					recommendations: ['Review the raw analysis text'],
				},
			};
		}

		return {
			success: true,
			account: {
				id: account.id,
				name: account.account_name,
				type: account.account_type,
			},
			month: monthNames[month] || month,
			fiscal_year: fiscalYear,
			transaction_count: txSummary.length,
			uncategorized_count: uncategorized.length,
			unreconciled_count: unreconciled.length,
			analysis,
			token_usage: claudeResponse.usage,
		};
	} catch (err: any) {
		console.error('Reconciliation assistant error:', err);
		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: `Reconciliation assistant failed: ${err.message}`,
		});
	}
});
