/**
 * composables/useChaseCSV.js
 *
 * Parser and normalizer for Chase bank CSV exports (tab-separated).
 *
 * Chase CSV format:
 *   Details\tPosting Date\tDescription\tAmount\tType\tBalance\tCheck or Slip #
 *   DEBIT\t12/31/2025\tORIG CO NAME:...\t-55.00\tACH_DEBIT\t24913.78\t
 *
 * Features:
 * - Auto-detects tab vs comma delimiters
 * - Maps Chase types (ACH_DEBIT, QUICKPAY_CREDIT, etc.) → app transaction_type
 * - Extracts vendor names from Chase description patterns
 * - Groups transactions by month
 * - Calculates exact beginning/ending balances from Chase's Balance column
 * - Detects inter-account transfers from description patterns
 */

/**
 * Chase Details+Type → app transaction_type mapping
 */
const CHASE_TYPE_MAP = {
	// Fee types → 'fee'
	FEE_TRANSACTION: 'fee',

	// Deposit/credit types → 'deposit'
	QUICKPAY_CREDIT: 'deposit',
	ACH_CREDIT: 'deposit',
	PARTNERFI_TO_CHASE: 'deposit',
	CHECK_DEPOSIT: 'deposit',
	MISC_CREDIT: 'deposit',
	LOAN_PMT: 'deposit',
	ATM_CREDIT: 'deposit',

	// Withdrawal/debit types → 'withdrawal'
	ACH_DEBIT: 'withdrawal',
	ACH_PAYMENT: 'withdrawal',
	DEBIT_CARD: 'withdrawal',
	QUICKPAY_DEBIT: 'withdrawal',
	CHASE_TO_PARTNERFI: 'withdrawal',
	BILLPAY: 'withdrawal',
	CHECK_PAID: 'withdrawal',
	MISC_DEBIT: 'withdrawal',
	ATM_DEBIT: 'withdrawal',
	WIRE_OUTGOING: 'withdrawal',

	// Transfer types → resolved by direction
	ACCT_XFER: 'transfer',
};

/**
 * Determine the app transaction_type from Chase row data.
 *
 * @param {string} details - Chase Details column (DEBIT, CREDIT, DSLIP)
 * @param {string} chaseType - Chase Type column (ACH_DEBIT, QUICKPAY_CREDIT, etc.)
 * @param {string} description - Transaction description text
 * @returns {string} One of: deposit, withdrawal, fee, transfer_in, transfer_out
 */
export function mapTransactionType(details, chaseType, description) {
	const desc = (description || '').toLowerCase();
	const isTransferDesc = desc.includes('online transfer') ||
		desc.includes('transfer from') ||
		desc.includes('transfer to');

	// Explicit transfer detection
	if (chaseType === 'ACCT_XFER' || isTransferDesc) {
		return details === 'DEBIT' ? 'transfer_out' : 'transfer_in';
	}

	// Map by Chase Type
	const mapped = CHASE_TYPE_MAP[chaseType];
	if (mapped && mapped !== 'transfer') return mapped;

	// Fallback by Details column
	if (details === 'CREDIT' || details === 'DSLIP') return 'deposit';
	if (details === 'DEBIT') return 'withdrawal';

	return 'withdrawal';
}

/**
 * Extract a meaningful vendor name from Chase description text.
 *
 * @param {string} description - Raw Chase description
 * @param {string} chaseType - Chase Type column
 * @returns {string|null} Extracted vendor name or null
 */
export function extractVendor(description, chaseType) {
	if (!description) return null;
	const desc = description.trim();

	// Transfers → no vendor
	if (desc.toLowerCase().includes('online transfer')) return null;

	// ACH: "ORIG CO NAME:MDCBUILDINGS ID:xxxxx ORIG ID:xxxxx PPD:xxx..."
	const achMatch = desc.match(/ORIG CO NAME:([^I]+?)(?:\s*ID:|$)/i);
	if (achMatch) return achMatch[1].trim();

	// Zelle: "Zelle payment from JOHN DOE" or "Zelle Transfer Conf..."
	const zelleMatch = desc.match(/Zelle (?:payment|transfer)\s+(?:from|to)\s+(.+?)(?:\s+Conf|$)/i);
	if (zelleMatch) return zelleMatch[1].trim();

	// BillPay: "Bill Payment To XXX On..."
	const billMatch = desc.match(/Bill Payment\s+To\s+(.+?)(?:\s+On\s|$)/i);
	if (billMatch) return billMatch[1].trim();

	// Online Payment: "Online Payment ... To Company"
	const onlinePayMatch = desc.match(/Online Payment\s+.*?\s+To\s+(.+?)(?:\s+On\s|$)/i);
	if (onlinePayMatch) return onlinePayMatch[1].trim();

	// Check deposit → generic
	if (chaseType === 'CHECK_DEPOSIT' || desc.toLowerCase().includes('remote online deposit')) {
		return 'Check Deposit';
	}

	// Wire: "WIRE TYPE:xxx ... BNF:Company Name..."
	const wireMatch = desc.match(/BNF:([^/]+)/i);
	if (wireMatch) return wireMatch[1].trim();

	// Fallback: use first meaningful segment (before common separators)
	const fallback = desc.split(/\s{2,}|;|\|/)[0].trim();
	if (fallback && fallback.length > 2 && fallback.length < 80) {
		return fallback;
	}

	return null;
}

/**
 * Extract last-4 account number from a Chase transfer description.
 *
 * Patterns:
 *   "Online Transfer to MMA ...5872 transaction#: 25745556605"
 *   "Online Transfer from MMA ...7011 transaction#: 26945005134 11/13"
 *   "Online Transfer to Chk ...5129"
 *
 * @param {string} description
 * @returns {string|null} Last 4 digits or null
 */
export function extractAccountNumber(description) {
	if (!description) return null;
	const patterns = [
		/\.{3}(\d{4})/,          // ...5872
		/\.\.\s*(\d{4})/,        // .. 5872
		/Chk\s*(\d{4})/i,        // Chk 5129
		/Mma\s*\.{3}(\d{4})/i,   // Mma ...7011
		/Account\s*(\d{4})/i,    // Account 5129
	];

	for (const pattern of patterns) {
		const match = description.match(pattern);
		if (match) return match[1];
	}
	return null;
}

/**
 * Check whether a description indicates an inter-account transfer.
 */
export function isTransfer(description) {
	if (!description) return false;
	const desc = description.toLowerCase();
	return desc.includes('online transfer') ||
		desc.includes('transfer from') ||
		desc.includes('transfer to');
}

/**
 * Parse a Chase CSV export (tab-separated or comma-separated).
 *
 * @param {string} csvText - Raw CSV file content
 * @returns {{ transactions: Array, headers: string[], raw: Array }}
 */
export function parseChaseCSV(csvText) {
	const lines = csvText.split('\n').filter(line => line.trim());
	if (lines.length === 0) return { transactions: [], headers: [], raw: [] };

	// Detect delimiter: Chase uses tabs
	const firstLine = lines[0];
	const tabCount = (firstLine.match(/\t/g) || []).length;
	const commaCount = (firstLine.match(/,/g) || []).length;
	const delimiter = tabCount >= 5 ? '\t' : ',';

	// Parse a line respecting quoted fields
	const parseLine = (line) => {
		const result = [];
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
			} else if (char === delimiter && !inQuotes) {
				result.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		result.push(current.trim());
		return result;
	};

	const headers = parseLine(lines[0]);
	const raw = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseLine(lines[i]);
		if (values.length < 4) continue; // skip malformed rows

		const row = {};
		headers.forEach((header, index) => {
			row[header] = values[index] || '';
		});
		raw.push(row);
	}

	// Normalize Chase columns to app format
	const transactions = raw.map((row, index) => {
		const details = row['Details'] || '';
		const postingDate = row['Posting Date'] || '';
		const description = row['Description'] || '';
		const amount = parseFloat(row['Amount'] || '0');
		const chaseType = row['Type'] || '';
		const balance = parseFloat(row['Balance'] || '0');
		const checkNumber = row['Check or Slip #'] || '';

		// Parse date: MM/DD/YYYY → { year, month, day, iso }
		const dateParts = postingDate.split('/');
		let year = '', month = '', day = '', isoDate = '';
		if (dateParts.length === 3) {
			month = dateParts[0].padStart(2, '0');
			day = dateParts[1].padStart(2, '0');
			year = dateParts[2];
			isoDate = `${year}-${month}-${day}`;
		} else if (dateParts.length === 2) {
			// MM/DD format — year must be supplied externally
			month = dateParts[0].padStart(2, '0');
			day = dateParts[1].padStart(2, '0');
		}

		const transactionType = mapTransactionType(details, chaseType, description);
		const vendor = extractVendor(description, chaseType);

		return {
			csvIndex: index,
			date: isoDate,
			year,
			statement_month: month,
			description,
			amount: Math.abs(amount),
			signedAmount: amount,
			transaction_type: transactionType,
			chase_details: details,
			chase_type: chaseType,
			balance,
			check_number: checkNumber,
			vendor,
			isTransfer: isTransfer(description),
			targetAccount: isTransfer(description) ? extractAccountNumber(description) : null,
		};
	}).filter(tx => tx.date); // Filter out rows without a valid date

	return { transactions, headers, raw };
}

/**
 * Group transactions by statement_month and calculate exact balances
 * from the Chase Balance column.
 *
 * For each month:
 * - Ending balance = Balance column of the chronologically LAST transaction
 * - Beginning balance = Balance column of the chronologically FIRST transaction
 *   minus that transaction's signed amount (what balance was before that tx posted)
 *
 * @param {Array} transactions - Normalized transactions from parseChaseCSV()
 * @returns {Map<string, { month: string, monthName: string, transactions: Array,
 *           beginningBalance: number, endingBalance: number,
 *           totalDeposits: number, totalWithdrawals: number }>}
 */
export function groupByMonth(transactions) {
	const MONTH_NAMES = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December',
	];

	const months = new Map();

	for (const tx of transactions) {
		const m = tx.statement_month;
		if (!m) continue;

		if (!months.has(m)) {
			const monthIndex = parseInt(m, 10) - 1;
			months.set(m, {
				month: m,
				monthName: MONTH_NAMES[monthIndex] || m,
				transactions: [],
				beginningBalance: 0,
				endingBalance: 0,
				totalDeposits: 0,
				totalWithdrawals: 0,
				totalFees: 0,
				totalTransfersIn: 0,
				totalTransfersOut: 0,
			});
		}

		const group = months.get(m);
		group.transactions.push(tx);

		// Accumulate by type
		switch (tx.transaction_type) {
			case 'deposit':
				group.totalDeposits += tx.amount;
				break;
			case 'withdrawal':
				group.totalWithdrawals += tx.amount;
				break;
			case 'fee':
				group.totalFees += tx.amount;
				break;
			case 'transfer_in':
				group.totalTransfersIn += tx.amount;
				break;
			case 'transfer_out':
				group.totalTransfersOut += tx.amount;
				break;
		}
	}

	// Sort transactions within each month chronologically.
	// Chase CSV lists newest transactions first (both across dates and within the same date),
	// so within the same date we reverse by csvIndex to get true chronological order.
	for (const [, group] of months) {
		group.transactions.sort((a, b) => {
			const dateCompare = a.date.localeCompare(b.date);
			if (dateCompare !== 0) return dateCompare;
			return b.csvIndex - a.csvIndex;
		});

		if (group.transactions.length > 0) {
			const first = group.transactions[0];
			const last = group.transactions[group.transactions.length - 1];

			// Ending balance = balance after the last transaction
			group.endingBalance = Math.round(last.balance * 100) / 100;

			// Beginning balance = balance before the first transaction
			// balance_before = balance_after - signed_amount
			group.beginningBalance = Math.round((first.balance - first.signedAmount) * 100) / 100;
		}

		// Round totals
		group.totalDeposits = Math.round(group.totalDeposits * 100) / 100;
		group.totalWithdrawals = Math.round(group.totalWithdrawals * 100) / 100;
		group.totalFees = Math.round(group.totalFees * 100) / 100;
		group.totalTransfersIn = Math.round(group.totalTransfersIn * 100) / 100;
		group.totalTransfersOut = Math.round(group.totalTransfersOut * 100) / 100;
	}

	return months;
}

/**
 * Match transfers across multiple accounts.
 *
 * @param {Array} allTransfers - Transfer transactions from all accounts, each with:
 *   { date, amount, transaction_type, targetAccount, sourceAccountNumber, accountType, ... }
 * @returns {{ matches: Array, unmatched: Array }}
 */
export function matchTransfers(allTransfers) {
	const matches = [];
	const used = new Set();

	for (let i = 0; i < allTransfers.length; i++) {
		if (used.has(i)) continue;
		const t1 = allTransfers[i];

		for (let j = i + 1; j < allTransfers.length; j++) {
			if (used.has(j)) continue;
			const t2 = allTransfers[j];

			// Opposite directions
			const isOpposite =
				(t1.transaction_type === 'transfer_out' && t2.transaction_type === 'transfer_in') ||
				(t1.transaction_type === 'transfer_in' && t2.transaction_type === 'transfer_out');
			if (!isOpposite) continue;

			// Same amount
			if (Math.abs(t1.amount - t2.amount) > 0.01) continue;

			// Same date
			if (t1.date !== t2.date) continue;

			// Cross-account: t1's target is t2's source and vice versa
			const crossMatch =
				t1.targetAccount === t2.sourceAccountNumber &&
				t2.targetAccount === t1.sourceAccountNumber;
			if (!crossMatch) continue;

			const outTx = t1.transaction_type === 'transfer_out' ? t1 : t2;
			const inTx = t1.transaction_type === 'transfer_in' ? t1 : t2;

			matches.push({ outTransfer: outTx, inTransfer: inTx, matchQuality: 'perfect' });
			used.add(i);
			used.add(j);
			break;
		}
	}

	const unmatched = allTransfers.filter((_, idx) => !used.has(idx));
	return { matches, unmatched };
}

/**
 * Main composable for Chase CSV import workflow.
 */
export const useChaseCSV = () => {
	return {
		parseChaseCSV,
		groupByMonth,
		mapTransactionType,
		extractVendor,
		extractAccountNumber,
		isTransfer,
		matchTransfers,
	};
};
