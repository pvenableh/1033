/**
 * POST /api/admin/pdf-to-csv
 *
 * Accepts a PDF bank statement and uses Claude to extract structured transaction
 * data in CSV-compatible format, including:
 *   - Category assignment (Revenue, Utilities, Maintenance, etc.)
 *   - Period detection (statement month name)
 *   - Beginning and ending balance rows
 *   - Proper transaction type classification (deposit, withdrawal, fee, transfer)
 *
 * The output matches the CSV import format used by the import center:
 *   Date, Type, Description, Vendor, Amount, Category, Period
 *
 * Also uploads the original PDF to the Directus statements folder.
 *
 * Accepts multipart form data:
 *   - file: PDF file (required)
 *
 * Requires admin/board member access and ANTHROPIC_API_KEY.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
	uploadFiles as sdkUploadFiles,
} from '~/server/utils/directus';
import { isClaudeConfigured, callClaude, pdfToContentBlock, extractClaudeText } from '~/server/utils/claude';

const STATEMENTS_FOLDER = 'b538fbe2-698d-4131-9160-f049949c8a0b';

interface CsvTransaction {
	date: string;
	type: string;
	description: string;
	vendor: string;
	amount: number;
	category: string;
	period: string;
	check_number?: string;
}

interface PdfToCsvResult {
	success: boolean;
	transactions?: CsvTransaction[];
	beginning_balance?: number;
	ending_balance?: number;
	statement_period?: string;
	account_number_last4?: string;
	pdf_file_id?: string;
	csv_text?: string;
	token_usage?: { input: number; output: number };
	error?: string;
	message?: string;
}

// Extend Vercel timeout for AI endpoints
export const config = {
	maxDuration: 120,
}

export default defineEventHandler(async (event): Promise<PdfToCsvResult> => {
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
		return {
			success: false,
			error: 'Claude API is not configured. Set the ANTHROPIC_API_KEY environment variable.',
		};
	}

	try {
		// Read the uploaded PDF file
		const formData = await readMultipartFormData(event);
		if (!formData || formData.length === 0) {
			return {
				success: false,
				error: 'No file uploaded. Please upload a PDF bank statement.',
			};
		}

		const fileField = formData.find((f) => f.name === 'file');
		if (!fileField || !fileField.data) {
			return {
				success: false,
				error: 'No file data found in upload.',
			};
		}

		const contentType = fileField.type || '';
		if (!contentType.includes('pdf')) {
			return {
				success: false,
				error: 'Only PDF files are supported. Please upload a PDF bank statement.',
			};
		}

		// Fetch budget categories and accounts for context
		const client = useDirectusAdmin();

		let categoriesList = '';
		let accountsList = '';
		try {
			const budgetCategories = await client.request(
				readItems('budget_categories', {
					fields: ['id', 'category_name'],
					limit: -1,
				})
			);
			categoriesList = [...new Set(budgetCategories.map((c: any) => c.category_name).filter(Boolean))].join(', ');

			const accounts = await client.request(
				readItems('accounts', {
					fields: ['id', 'account_name', 'account_number', 'account_type'],
					limit: -1,
				})
			);
			accountsList = accounts.map((a: any) =>
				`${a.account_name} (${a.account_type}, ending ...${(a.account_number || '').slice(-4)})`
			).join('; ');
		} catch (e) {
			console.warn('Could not load budget categories/accounts for context:', e);
		}

		// Build Claude prompt
		const systemPrompt = `You are a financial data extraction assistant for 1033 Lenox Park, a condominium HOA in Miami Beach, FL. You extract transactions from bank statement PDFs into a structured CSV-compatible JSON format.

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown fences, no explanation text
- Every amount must be a POSITIVE number
- Dates must be in MM/DD/YYYY format
- For descriptions, use the exact text from the statement
- For vendor, extract the payee/merchant name when identifiable
- Include beginning and ending balances
- Include the statement period (e.g., "January")

HOA CONTEXT:
- This HOA has these bank accounts: ${accountsList || 'Operating, Reserve, Special Assessment'}
- Revenue comes from: owner HOA dues, special assessments, Zelle payments, Buildium ACH, laundry income (Wash Multifamily)
- Common vendors: Maverick Elevators, Betterwaste Management, Florida Power & Light, Buildium, First Insurance
- Transfers between accounts appear as "Online Transfer To/From Mma ...XXXX" where XXXX is the last 4 digits of the target account
- Zelle payments from individuals are HOA dues (Revenue)
- Buildium ACH deposits are Revenue; Buildium withdrawals are Professional
- Wash Multifamily EDI Payments are Revenue (laundry income)

BUDGET CATEGORIES (use these exact names for the category field):
${categoriesList || 'Revenue, Utilities, Maintenance, Professional, Insurance, Transfer, Operating'}

CATEGORIZATION RULES:
- Deposits from owners/residents (Zelle, checks, Buildium ACH) → "Revenue"
- Florida Power & Light, water bills, gas → "Utilities"
- Elevator, pest control, cleaning, landscaping, pool, plumbing, repairs → "Maintenance"
- Buildium subscription, accounting, legal, management fees → "Professional"
- Insurance premiums → "Insurance"
- Online transfers between HOA accounts → "Transfer"
- Bank fees, service charges → "Operating"
- If unsure, leave category empty`;

		const extractionPrompt = `Extract all transactions from this bank statement PDF. Return the data as a JSON object with this exact structure:

{
  "beginning_balance": 12155.63,
  "ending_balance": 31655.36,
  "statement_period": "January",
  "account_number_last4": "5129",
  "transactions": [
    {
      "date": "01/02/2025",
      "type": "deposit",
      "description": "Zelle Payment From John Smith",
      "vendor": "John Smith",
      "amount": 650.00,
      "category": "Revenue",
      "check_number": null
    },
    {
      "date": "01/15/2025",
      "type": "withdrawal",
      "description": "Online Transfer To Mma ...7011",
      "vendor": "",
      "amount": 5000.00,
      "category": "Transfer",
      "check_number": null
    }
  ]
}

Transaction type rules:
- "deposit" for credits, incoming money, Zelle received, ACH deposits, checks deposited
- "withdrawal" for debits, checks written, outgoing payments, bill pay
- "fee" for bank fees, service charges, maintenance fees from the bank
- "transfer_in" should NOT be used — use "deposit" with category "Transfer" for incoming transfers
- "transfer_out" should NOT be used — use "withdrawal" with category "Transfer" for outgoing transfers

The "category" field must be one of: ${categoriesList || 'Revenue, Utilities, Maintenance, Professional, Insurance, Transfer, Operating'} or empty string if uncertain.

The "vendor" field should contain the payee or merchant name when identifiable. For Zelle payments, use the person's name. For transfers, leave empty.

The "check_number" field should only be included if a check number is shown.

Amounts must ALWAYS be positive numbers.

Return ONLY the JSON object, no other text.`;

		// Send PDF to Claude
		const pdfContent = pdfToContentBlock(fileField.data);

		const response = await callClaude({
			system: systemPrompt,
			messages: [
				{
					role: 'user',
					content: [
						pdfContent,
						{ type: 'text', text: extractionPrompt },
					],
				},
			],
			maxTokens: 8192,
		});

		const responseText = extractClaudeText(response);

		// Parse JSON response
		let cleanJson = responseText.trim();
		if (cleanJson.startsWith('```')) {
			cleanJson = cleanJson.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
		}

		let parsed: any;
		try {
			parsed = JSON.parse(cleanJson);
		} catch (parseErr: any) {
			return {
				success: false,
				error: `Claude returned invalid JSON. Raw response: ${responseText.substring(0, 500)}`,
				token_usage: {
					input: response.usage.input_tokens,
					output: response.usage.output_tokens,
				},
			};
		}

		// Normalize transactions into CSV-compatible format
		const rawTransactions = parsed.transactions || [];
		const period = parsed.statement_period || '';

		const transactions: CsvTransaction[] = rawTransactions.map((tx: any) => ({
			date: tx.date || '',
			type: normalizeType(tx.type || ''),
			description: tx.description || '',
			vendor: tx.vendor || '',
			amount: Math.abs(parseFloat(tx.amount) || 0),
			category: tx.category || '',
			period: period,
			check_number: tx.check_number || undefined,
		}));

		// Build CSV text output
		const csvLines = ['Date,Type,Description,Vendor,Amount,Category,Period'];

		// Add beginning balance row
		if (parsed.beginning_balance != null) {
			csvLines.push(`,,Beginning Balance,,${parseFloat(parsed.beginning_balance).toFixed(2)},Beginning,${period}`);
		}

		// Add transaction rows
		for (const tx of transactions) {
			const escapeCsv = (val: string) => {
				if (!val) return '';
				if (val.includes(',') || val.includes('"') || val.includes('\n')) {
					return `"${val.replace(/"/g, '""')}"`;
				}
				return val;
			};
			csvLines.push([
				tx.date,
				tx.type,
				escapeCsv(tx.description),
				escapeCsv(tx.vendor),
				tx.amount.toFixed(2),
				tx.category,
				tx.period,
			].join(','));
		}

		// Add ending balance row
		if (parsed.ending_balance != null) {
			csvLines.push(`,,Ending Balance,,${parseFloat(parsed.ending_balance).toFixed(2)},Ending,${period}`);
		}

		const csvText = csvLines.join('\n');

		// Upload the original PDF to Directus
		let pdf_file_id: string | undefined;
		try {
			const directusFormData = new FormData();
			const blob = new Blob([fileField.data], { type: 'application/pdf' });
			const filename = fileField.filename || `statement-${period || 'unknown'}.pdf`;
			directusFormData.append('file', blob, filename);
			directusFormData.append('folder', STATEMENTS_FOLDER);
			const uploadResult = await client.request(sdkUploadFiles(directusFormData));
			pdf_file_id = uploadResult?.id;
		} catch (uploadErr: any) {
			console.warn('Could not upload PDF to Directus:', uploadErr.message);
		}

		return {
			success: true,
			transactions,
			beginning_balance: parsed.beginning_balance != null ? parseFloat(parsed.beginning_balance) : undefined,
			ending_balance: parsed.ending_balance != null ? parseFloat(parsed.ending_balance) : undefined,
			statement_period: period || undefined,
			account_number_last4: parsed.account_number_last4 || undefined,
			pdf_file_id,
			csv_text: csvText,
			token_usage: {
				input: response.usage.input_tokens,
				output: response.usage.output_tokens,
			},
			message: `Claude extracted ${transactions.length} transactions with categories from the PDF statement.`,
		};
	} catch (error: any) {
		console.error('PDF-to-CSV extraction error:', error);

		if (error.statusCode) {
			throw error;
		}

		return {
			success: false,
			error: `Failed to extract transactions: ${error.message}`,
		};
	}
});

function normalizeType(type: string): string {
	const t = type.toLowerCase().trim();
	if (t === 'deposit' || t === 'credit') return 'deposit';
	if (t === 'withdrawal' || t === 'debit' || t === 'check') return 'withdrawal';
	if (t === 'fee' || t === 'charge' || t === 'service charge') return 'fee';
	if (t === 'transfer_in' || t === 'transfer in') return 'deposit';
	if (t === 'transfer_out' || t === 'transfer out') return 'withdrawal';
	return 'withdrawal';
}
