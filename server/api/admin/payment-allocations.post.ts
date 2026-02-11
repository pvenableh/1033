/**
 * POST /api/admin/payment-allocations
 *
 * Manages payment allocations for split deposits (e.g., Zelle payments
 * containing both HOA dues and 40-year special assessment funds).
 *
 * Actions:
 *   - create: Create allocations for a deposit transaction
 *   - list: Get allocations for a specific transaction
 *   - update: Update allocation status (e.g., mark as transferred)
 *   - auto-match: Automatically match pending allocations to transfer transactions
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

	const body = await readBody(event);
	const action = body?.action;

	if (!action) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'action is required (create, list, update, auto-match)',
		});
	}

	const client = useDirectusAdmin();

	// ============================================================
	// ACTION: create — Split a deposit into fund allocations
	// ============================================================
	if (action === 'create') {
		const { source_transaction_id, allocations, fiscal_year } = body;

		if (!source_transaction_id || !allocations || !Array.isArray(allocations) || !fiscal_year) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: 'source_transaction_id, allocations array, and fiscal_year are required',
			});
		}

		// Validate the source transaction exists and is a deposit
		const sourceTransactions = await client.request(
			readItems('transactions', {
				filter: { id: { _eq: source_transaction_id } },
				fields: ['id', 'amount', 'transaction_type', 'description'],
				limit: 1,
			})
		);

		if (!sourceTransactions || sourceTransactions.length === 0) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Not Found',
				message: `Transaction ${source_transaction_id} not found`,
			});
		}

		const sourceTx = sourceTransactions[0];
		const sourceAmount = parseFloat(sourceTx.amount) || 0;

		// Validate allocations sum to the source amount
		const totalAllocated = allocations.reduce(
			(sum: number, a: any) => sum + (parseFloat(a.amount) || 0),
			0
		);
		const variance = Math.abs(totalAllocated - sourceAmount);

		if (variance > 0.01) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: `Allocations total $${totalAllocated.toFixed(2)} but source transaction is $${sourceAmount.toFixed(2)} (difference: $${variance.toFixed(2)})`,
			});
		}

		// Create each allocation record
		const created = [];

		for (const alloc of allocations) {
			if (!alloc.fund_type || !alloc.amount) {
				continue;
			}

			const record = await client.request(
				createItem('payment_allocations', {
					source_transaction_id,
					fund_type: alloc.fund_type,
					amount: parseFloat(alloc.amount),
					target_account_id: alloc.target_account_id || null,
					linked_transfer_id: alloc.linked_transfer_id || null,
					allocation_status: alloc.linked_transfer_id ? 'transferred' : 'pending_transfer',
					notes: alloc.notes || null,
					fiscal_year,
					status: 'published',
				})
			);
			created.push(record);
		}

		return {
			success: true,
			message: `Created ${created.length} allocation(s) for transaction ${source_transaction_id}`,
			allocations: created,
		};
	}

	// ============================================================
	// ACTION: list — Get allocations for a transaction
	// ============================================================
	if (action === 'list') {
		const { source_transaction_id, fiscal_year } = body;

		const filter: any = {};
		if (source_transaction_id) {
			filter.source_transaction_id = { _eq: source_transaction_id };
		}
		if (fiscal_year) {
			filter.fiscal_year = { year: { _eq: fiscal_year } };
		}

		const allocations = await client.request(
			readItems('payment_allocations', {
				filter,
				fields: [
					'*',
					'source_transaction_id.id',
					'source_transaction_id.description',
					'source_transaction_id.amount',
					'source_transaction_id.transaction_date',
					'source_transaction_id.vendor',
					'target_account_id.id',
					'target_account_id.account_name',
					'target_account_id.account_type',
					'linked_transfer_id.id',
					'linked_transfer_id.description',
					'linked_transfer_id.amount',
					'linked_transfer_id.transaction_date',
				],
				sort: ['-date_created'],
				limit: -1,
			})
		);

		// Also fetch any pending (unallocated) deposits that look like combined payments
		const pendingSummary = {
			total_allocations: allocations.length,
			pending_transfer: allocations.filter((a: any) => a.allocation_status === 'pending_transfer').length,
			transferred: allocations.filter((a: any) => a.allocation_status === 'transferred').length,
			reconciled: allocations.filter((a: any) => a.allocation_status === 'reconciled').length,
		};

		return {
			success: true,
			allocations,
			summary: pendingSummary,
		};
	}

	// ============================================================
	// ACTION: update — Update allocation status or link a transfer
	// ============================================================
	if (action === 'update') {
		const { allocation_id, allocation_status, linked_transfer_id, notes } = body;

		if (!allocation_id) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: 'allocation_id is required',
			});
		}

		const updates: Record<string, any> = {};
		if (allocation_status) updates.allocation_status = allocation_status;
		if (linked_transfer_id !== undefined) updates.linked_transfer_id = linked_transfer_id;
		if (notes !== undefined) updates.notes = notes;

		const updated = await client.request(
			updateItem('payment_allocations', allocation_id, updates)
		);

		return {
			success: true,
			allocation: updated,
		};
	}

	// ============================================================
	// ACTION: auto-match — Match pending allocations to transfers
	// ============================================================
	if (action === 'auto-match') {
		const { fiscal_year } = body;

		if (!fiscal_year) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: 'fiscal_year is required',
			});
		}

		// Get pending allocations (non-operating, since operating stays in place)
		const pendingAllocations = await client.request(
			readItems('payment_allocations', {
				filter: {
					allocation_status: { _eq: 'pending_transfer' },
					fund_type: { _neq: 'operating' },
					fiscal_year: { year: { _eq: fiscal_year } },
				},
				fields: [
					'*',
					'source_transaction_id.id',
					'source_transaction_id.transaction_date',
					'source_transaction_id.account_id',
					'target_account_id.id',
					'target_account_id.account_number',
				],
				limit: -1,
			})
		);

		if (pendingAllocations.length === 0) {
			return {
				success: true,
				matched: 0,
				message: 'No pending allocations to match',
			};
		}

		// Get transfer_out transactions from the source account for this fiscal year
		const transfers = await client.request(
			readItems('transactions', {
				filter: {
					fiscal_year: { year: { _eq: fiscal_year } },
					transaction_type: { _eq: 'transfer_out' },
				},
				fields: ['id', 'amount', 'transaction_date', 'description', 'account_id', 'linked_transfer_id'],
				sort: ['transaction_date'],
				limit: -1,
			})
		);

		let matched = 0;
		const results: any[] = [];

		for (const alloc of pendingAllocations) {
			const allocAmount = parseFloat(alloc.amount) || 0;
			const sourceDate = alloc.source_transaction_id?.transaction_date;
			const sourceAccountId = alloc.source_transaction_id?.account_id;
			const targetAccountNumber = alloc.target_account_id?.account_number;

			if (!sourceDate || !allocAmount) continue;

			// Find matching transfer: same amount, from source account, within 7 days,
			// description mentions target account
			const matchingTransfer = transfers.find((t: any) => {
				const tAmount = parseFloat(t.amount) || 0;
				const amountMatch = Math.abs(tAmount - allocAmount) < 0.01;
				const sameSourceAccount = t.account_id === sourceAccountId;

				// Check date proximity (within 7 days after the deposit)
				const sourceD = new Date(sourceDate);
				const transferD = new Date(t.transaction_date);
				const daysDiff = (transferD.getTime() - sourceD.getTime()) / (1000 * 60 * 60 * 24);
				const dateMatch = daysDiff >= 0 && daysDiff <= 7;

				// Check if description mentions target account
				const desc = (t.description || '').toLowerCase();
				const mentionsTarget = targetAccountNumber
					? desc.includes(targetAccountNumber.slice(-4))
					: true;

				return amountMatch && sameSourceAccount && dateMatch && mentionsTarget;
			});

			if (matchingTransfer) {
				await client.request(
					updateItem('payment_allocations', alloc.id, {
						linked_transfer_id: matchingTransfer.id,
						allocation_status: 'transferred',
					})
				);

				matched++;
				results.push({
					allocation_id: alloc.id,
					fund_type: alloc.fund_type,
					amount: allocAmount,
					matched_transfer_id: matchingTransfer.id,
					transfer_description: matchingTransfer.description,
				});
			}
		}

		return {
			success: true,
			total_pending: pendingAllocations.length,
			matched,
			unmatched: pendingAllocations.length - matched,
			results,
		};
	}

	throw createError({
		statusCode: 400,
		statusMessage: 'Bad Request',
		message: `Unknown action: ${action}. Use create, list, update, or auto-match.`,
	});
});
