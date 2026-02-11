/**
 * POST /api/admin/parse-statement
 *
 * Accepts a PDF or JSON bank statement upload and returns parsed transaction data.
 * For PDF files: stores the file in Directus and returns file metadata for the user
 *   to then provide a JSON version or use client-side AI extraction.
 * For JSON files: validates and returns the parsed transaction array.
 *
 * Requires admin/board member access.
 */
import {hasAdminAccess, useDirectusAdmin, uploadFiles as sdkUploadFiles} from '~/server/utils/directus';

interface ParsedTransaction {
	date: string;
	description: string;
	amount: number;
	type: 'deposit' | 'withdrawal' | 'fee' | 'transfer_in' | 'transfer_out';
	vendor?: string;
	category?: string;
	check_number?: string;
	balance?: number;
	_raw?: Record<string, any>;
	_source_line?: number;
}

interface StatementParseResult {
	success: boolean;
	file_type: 'pdf' | 'json' | 'csv';
	file_id?: string;
	file_name?: string;
	transactions?: ParsedTransaction[];
	beginning_balance?: number;
	ending_balance?: number;
	statement_period?: string;
	error?: string;
	message?: string;
}

export default defineEventHandler(async (event): Promise<StatementParseResult> => {
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

	try {
		const formData = await readMultipartFormData(event);

		if (!formData || formData.length === 0) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: 'No file provided',
			});
		}

		const file = formData.find((item) => item.name === 'file');
		const accountId = formData.find((item) => item.name === 'account_id')?.data?.toString();
		const fiscalYear = formData.find((item) => item.name === 'fiscal_year')?.data?.toString();

		if (!file || !file.data || !file.filename) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: 'No valid file found in request',
			});
		}

		const filename = file.filename.toLowerCase();
		const mimeType = file.type || '';

		// Handle JSON files - parse and return transaction data
		if (filename.endsWith('.json') || mimeType === 'application/json') {
			return handleJsonFile(file.data);
		}

		// Handle CSV files - parse and return transaction data
		if (filename.endsWith('.csv') || mimeType === 'text/csv') {
			return handleCsvFile(file.data);
		}

		// Handle PDF files - upload to Directus for storage
		if (filename.endsWith('.pdf') || mimeType === 'application/pdf') {
			return await handlePdfFile(file, accountId, fiscalYear);
		}

		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'Unsupported file type. Please upload a PDF, JSON, or CSV file.',
		});
	} catch (error: any) {
		console.error('Statement parse error:', error);

		if (error.statusCode) {
			throw error;
		}

		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: error.message || 'Failed to process statement file',
		});
	}
});

/**
 * Parse a JSON statement file containing transaction data.
 * Expected format:
 * {
 *   "beginning_balance": 46086.55,
 *   "ending_balance": 64114.11,
 *   "statement_period": "January 2025",
 *   "transactions": [
 *     { "date": "01/02", "description": "...", "amount": 2300, "type": "deposit", ... }
 *   ]
 * }
 */
function handleJsonFile(data: Buffer): StatementParseResult {
	try {
		const jsonStr = data.toString('utf-8');
		const parsed = JSON.parse(jsonStr);

		// Support both array-of-transactions and object-with-transactions
		let transactions: ParsedTransaction[] = [];
		let beginningBalance: number | undefined;
		let endingBalance: number | undefined;
		let statementPeriod: string | undefined;

		if (Array.isArray(parsed)) {
			transactions = parsed;
		} else if (parsed.transactions && Array.isArray(parsed.transactions)) {
			transactions = parsed.transactions;
			beginningBalance = parsed.beginning_balance;
			endingBalance = parsed.ending_balance;
			statementPeriod = parsed.statement_period;
		} else {
			return {
				success: false,
				file_type: 'json',
				error: 'Invalid JSON format. Expected an array of transactions or an object with a "transactions" array.',
			};
		}

		// Validate and normalize transactions, preserving raw source data
		const normalized = transactions.map((tx: any, index: number) => ({
			date: tx.date || tx.Date || '',
			description: tx.description || tx.Description || '',
			amount: parseFloat(tx.amount || tx.Amount || 0),
			type: normalizeTransactionType(tx.type || tx.Type || ''),
			vendor: tx.vendor || tx.Vendor || undefined,
			category: tx.category || tx.Category || undefined,
			check_number: tx.check_number || tx.checkNumber || undefined,
			balance: tx.balance ? parseFloat(tx.balance) : undefined,
			_raw: tx,
			_source_line: index + 1,
		}));

		return {
			success: true,
			file_type: 'json',
			transactions: normalized,
			beginning_balance: beginningBalance,
			ending_balance: endingBalance,
			statement_period: statementPeriod,
			message: `Successfully parsed ${normalized.length} transactions from JSON.`,
		};
	} catch (error: any) {
		return {
			success: false,
			file_type: 'json',
			error: `Failed to parse JSON: ${error.message}`,
		};
	}
}

/**
 * Parse a CSV statement file.
 * Supports both the internal reconciliation CSV format and Chase bank CSV exports.
 *
 * Chase CSV headers: Details, Posting Date, Description, Amount, Type, Balance, Check or Slip #
 * Chase Type values: ACH_DEBIT, ACH_CREDIT, QUICKPAY_CREDIT, QUICKPAY_DEBIT,
 *   PARTNERFI_TO_CHASE, CHASE_TO_PARTNERFI, CHECK_DEPOSIT, BILLPAY,
 *   ACH_PAYMENT, ACCT_XFER, FEE_TRANSACTION, etc.
 */
function handleCsvFile(data: Buffer): StatementParseResult {
	try {
		// Strip UTF-8 BOM if present
		let csvText = data.toString('utf-8');
		if (csvText.charCodeAt(0) === 0xfeff) {
			csvText = csvText.slice(1);
		}

		const lines = csvText.split('\n').filter((line) => line.trim());

		if (lines.length < 2) {
			return {
				success: false,
				file_type: 'csv',
				error: 'CSV file is empty or has no data rows.',
			};
		}

		const headers = parseCsvLine(lines[0]);
		const rows = [];

		for (let i = 1; i < lines.length; i++) {
			const values = parseCsvLine(lines[i]);
			if (values.length >= 4) {
				const row: Record<string, string> = {};
				headers.forEach((header, idx) => {
					row[header] = values[idx] || '';
				});
				rows.push(row);
			}
		}

		// Detect Chase CSV format by checking for Chase-specific headers
		const isChaseFormat =
			headers.includes('Details') &&
			headers.includes('Posting Date') &&
			headers.includes('Balance');

		if (isChaseFormat) {
			return handleChaseCsvRows(rows);
		}

		// ── Legacy/internal reconciliation CSV format ──
		const balanceRows = rows.filter((r) => r.Type === 'BALANCE');
		const transactionRows = rows.filter((r) => r.Type && ['DEPOSIT', 'WITHDRAWAL', 'FEE'].includes(r.Type));

		const beginningBalance = balanceRows.find((b) =>
			b.SubType === 'Beginning' ||
			(b.Category || '').toLowerCase() === 'beginning' ||
			(b.Description || '').toLowerCase().includes('beginning balance')
		);
		const endingBalance = balanceRows.find((b) =>
			b.SubType === 'Ending' ||
			(b.Category || '').toLowerCase() === 'ending' ||
			(b.Description || '').toLowerCase().includes('ending balance')
		);

		const transactions: ParsedTransaction[] = transactionRows.map((row, index) => ({
			date: row.Date || '',
			description: row.Description || '',
			amount: parseFloat(row.Amount || '0'),
			type: normalizeTransactionType(row.Type || ''),
			vendor: row.Vendor || undefined,
			category: row.Category || undefined,
			_raw: row,
			_source_line: index + 1,
		}));

		return {
			success: true,
			file_type: 'csv',
			transactions,
			beginning_balance: beginningBalance ? parseFloat(beginningBalance.Amount || '0') : undefined,
			ending_balance: endingBalance ? parseFloat(endingBalance.Amount || '0') : undefined,
			statement_period: transactionRows[0]?.Period || undefined,
			message: `Successfully parsed ${transactions.length} transactions from CSV.`,
		};
	} catch (error: any) {
		return {
			success: false,
			file_type: 'csv',
			error: `Failed to parse CSV: ${error.message}`,
		};
	}
}

/**
 * Handle rows from a Chase bank CSV export.
 *
 * Chase columns:
 *   Details      – DEBIT, CREDIT, DSLIP
 *   Posting Date – MM/DD/YYYY
 *   Description  – full text (ACH details, Zelle info, etc.)
 *   Amount       – signed number (negative = debit)
 *   Type         – ACH_DEBIT, QUICKPAY_CREDIT, BILLPAY, ACCT_XFER, etc.
 *   Balance      – running account balance after this transaction
 *   Check or Slip # – optional
 */
function handleChaseCsvRows(rows: Record<string, string>[]): StatementParseResult {
	if (rows.length === 0) {
		return {
			success: false,
			file_type: 'csv',
			error: 'Chase CSV file has no data rows.',
		};
	}

	const transactions: ParsedTransaction[] = rows.map((row, index) => {
		const details = (row['Details'] || '').trim();
		const postingDate = (row['Posting Date'] || '').trim();
		const description = (row['Description'] || '').trim();
		const amount = parseFloat(row['Amount'] || '0');
		const chaseType = (row['Type'] || '').trim();
		const balance = parseFloat(row['Balance'] || '0');
		const checkNumber = (row['Check or Slip #'] || '').trim();

		return {
			date: postingDate,
			description,
			amount: Math.abs(amount),
			type: normalizeChaseType(details, chaseType, description),
			vendor: extractChaseVendor(description, chaseType),
			check_number: checkNumber || undefined,
			balance,
			_raw: row,
			_source_line: index + 1,
		};
	}).filter(tx => tx.date);

	// Calculate beginning and ending balances from Chase's running Balance column.
	// Chase CSVs list newest transactions first, so the FIRST row has the latest balance
	// and the LAST row has the earliest balance.
	let beginningBalance: number | undefined;
	let endingBalance: number | undefined;

	if (transactions.length > 0) {
		// Last row in file = earliest transaction → balance before that tx is the beginning balance
		const earliest = transactions[transactions.length - 1];
		const earliestAmount = parseFloat(rows[rows.length - 1]?.['Amount'] || '0');
		beginningBalance = Math.round((earliest.balance! - earliestAmount) * 100) / 100;

		// First row in file = latest transaction → its balance is the ending balance
		endingBalance = transactions[0].balance;
	}

	// Detect statement period from date range
	let statementPeriod: string | undefined;
	if (transactions.length > 0) {
		const dates = transactions
			.map(tx => tx.date)
			.filter(d => d);
		if (dates.length > 0) {
			statementPeriod = `${dates[dates.length - 1]} – ${dates[0]}`;
		}
	}

	return {
		success: true,
		file_type: 'csv',
		transactions,
		beginning_balance: beginningBalance,
		ending_balance: endingBalance,
		statement_period: statementPeriod,
		message: `Successfully parsed ${transactions.length} Chase transactions from CSV.`,
	};
}

/**
 * Handle PDF file - upload to Directus for storage and return metadata.
 * PDF text extraction happens client-side or via a future AI integration.
 */
async function handlePdfFile(
	file: {data: Buffer; filename?: string; type?: string},
	accountId?: string,
	fiscalYear?: string
): Promise<StatementParseResult> {
	try {
		const client = useDirectusAdmin();

		// Build FormData to upload PDF to Directus files
		const directusFormData = new FormData();
		const blob = new Blob([file.data], {type: 'application/pdf'});
		const sanitizedName = file.filename || 'bank-statement.pdf';
		directusFormData.append('file', blob, sanitizedName);

		// Add metadata
		if (accountId) {
			directusFormData.append('title', `Bank Statement - Account ${accountId}`);
		}
		directusFormData.append('folder', 'bank-statements');

		const result = await client.request(sdkUploadFiles(directusFormData));

		return {
			success: true,
			file_type: 'pdf',
			file_id: (result as any).id,
			file_name: sanitizedName,
			message: `PDF "${sanitizedName}" uploaded successfully. Please provide a JSON version of the transactions or use the manual entry form to add transactions from this statement.`,
		};
	} catch (error: any) {
		// If folder doesn't exist, try without folder
		try {
			const client = useDirectusAdmin();
			const directusFormData = new FormData();
			const blob = new Blob([file.data], {type: 'application/pdf'});
			directusFormData.append('file', blob, file.filename || 'bank-statement.pdf');

			const result = await client.request(sdkUploadFiles(directusFormData));

			return {
				success: true,
				file_type: 'pdf',
				file_id: (result as any).id,
				file_name: file.filename || 'bank-statement.pdf',
				message: `PDF uploaded successfully. Please provide a JSON version of the transactions to import them.`,
			};
		} catch (retryError: any) {
			return {
				success: false,
				file_type: 'pdf',
				error: `Failed to upload PDF: ${retryError.message}`,
			};
		}
	}
}

function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}

function normalizeTransactionType(type: string): ParsedTransaction['type'] {
	const t = type.toLowerCase().trim();
	if (t === 'deposit' || t === 'credit') return 'deposit';
	if (t === 'withdrawal' || t === 'debit' || t === 'check') return 'withdrawal';
	if (t === 'fee' || t === 'charge') return 'fee';
	if (t === 'transfer_in' || t === 'transfer in') return 'transfer_in';
	if (t === 'transfer_out' || t === 'transfer out') return 'transfer_out';
	return 'withdrawal'; // default
}

/**
 * Map a Chase CSV row to an app transaction type.
 *
 * Uses the Details column (DEBIT/CREDIT/DSLIP) and the Chase Type column
 * (ACH_DEBIT, QUICKPAY_CREDIT, ACCT_XFER, etc.) to determine the normalized type.
 */
function normalizeChaseType(
	details: string,
	chaseType: string,
	description: string,
): ParsedTransaction['type'] {
	const desc = (description || '').toLowerCase();

	// Inter-account transfers
	const isTransferDesc =
		desc.includes('online transfer') ||
		desc.includes('transfer from') ||
		desc.includes('transfer to');

	if (chaseType === 'ACCT_XFER' || isTransferDesc) {
		return details === 'DEBIT' ? 'transfer_out' : 'transfer_in';
	}

	// Fee
	if (chaseType === 'FEE_TRANSACTION') return 'fee';

	// Deposit / credit types
	const depositTypes = [
		'QUICKPAY_CREDIT', 'ACH_CREDIT', 'PARTNERFI_TO_CHASE',
		'CHECK_DEPOSIT', 'MISC_CREDIT', 'LOAN_PMT', 'ATM_CREDIT',
	];
	if (depositTypes.includes(chaseType)) return 'deposit';

	// Withdrawal / debit types
	const withdrawalTypes = [
		'ACH_DEBIT', 'ACH_PAYMENT', 'DEBIT_CARD', 'QUICKPAY_DEBIT',
		'CHASE_TO_PARTNERFI', 'BILLPAY', 'CHECK_PAID', 'MISC_DEBIT',
		'ATM_DEBIT', 'WIRE_OUTGOING',
	];
	if (withdrawalTypes.includes(chaseType)) return 'withdrawal';

	// Fallback by Details column
	if (details === 'CREDIT' || details === 'DSLIP') return 'deposit';
	if (details === 'DEBIT') return 'withdrawal';

	return 'withdrawal';
}

/**
 * Extract a meaningful vendor name from a Chase transaction description.
 */
function extractChaseVendor(description: string, chaseType: string): string | undefined {
	if (!description) return undefined;
	const desc = description.trim();

	// Transfers have no vendor
	if (desc.toLowerCase().includes('online transfer')) return undefined;

	// ACH: "ORIG CO NAME:MDCBUILDINGS           ORIG ID:xxx..."
	const achMatch = desc.match(/ORIG CO NAME:(.+?)(?:\s{2,}|\s*ORIG ID:)/i);
	if (achMatch) return achMatch[1].trim();

	// Zelle: "Zelle payment from JOHN DOE ..." or "Zelle payment to ..."
	const zelleMatch = desc.match(/Zelle (?:payment|transfer)\s+(?:from|to)\s+(.+?)(?:\s+[A-Z0-9]{8,}|\s+\d{10,}|$)/i);
	if (zelleMatch) return zelleMatch[1].trim();

	// Online Payment: "Online Payment 12345678 To Company Name 01/15"
	const onlinePayMatch = desc.match(/Online Payment\s+\d+\s+To\s+(.+?)(?:\s+\d{2}\/\d{2}|$)/i);
	if (onlinePayMatch) return onlinePayMatch[1].trim();

	// Online ACH Payment: "Online ACH Payment 12345 To Company (..."
	const achPayMatch = desc.match(/Online ACH Payment\s+\d+\s+To\s+(.+?)(?:\s+\(|$)/i);
	if (achPayMatch) return achPayMatch[1].trim();

	// Check deposit
	if (chaseType === 'CHECK_DEPOSIT' || desc.toLowerCase().includes('remote online deposit')) {
		return 'Check Deposit';
	}

	return undefined;
}
