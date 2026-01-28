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
import { hasAdminAccess, useDirectusAdmin, uploadFiles as sdkUploadFiles } from '~/server/utils/directus';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'fee' | 'transfer_in' | 'transfer_out';
  vendor?: string;
  category?: string;
  check_number?: string;
  balance?: number;
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

    // Validate and normalize transactions
    const normalized = transactions.map((tx: any) => ({
      date: tx.date || tx.Date || '',
      description: tx.description || tx.Description || '',
      amount: parseFloat(tx.amount || tx.Amount || 0),
      type: normalizeTransactionType(tx.type || tx.Type || ''),
      vendor: tx.vendor || tx.Vendor || undefined,
      category: tx.category || tx.Category || undefined,
      check_number: tx.check_number || tx.checkNumber || undefined,
      balance: tx.balance ? parseFloat(tx.balance) : undefined,
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
 * Parse a CSV statement file (same format as existing reconciliation CSVs).
 */
function handleCsvFile(data: Buffer): StatementParseResult {
  try {
    const csvText = data.toString('utf-8');
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
      if (values.length === headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        rows.push(row);
      }
    }

    // Separate balances and transactions
    const balanceRows = rows.filter((r) => r.Type === 'BALANCE');
    const transactionRows = rows.filter((r) => r.Type && ['DEPOSIT', 'WITHDRAWAL', 'FEE'].includes(r.Type));

    const beginningBalance = balanceRows.find((b) => b.SubType === 'Beginning');
    const endingBalance = balanceRows.find((b) => b.SubType === 'Ending');

    const transactions: ParsedTransaction[] = transactionRows.map((row) => ({
      date: row.Date || '',
      description: row.Description || '',
      amount: parseFloat(row.Amount || '0'),
      type: normalizeTransactionType(row.Type || ''),
      vendor: row.Vendor || undefined,
      category: row.Category || undefined,
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
 * Handle PDF file - upload to Directus for storage and return metadata.
 * PDF text extraction happens client-side or via a future AI integration.
 */
async function handlePdfFile(
  file: { data: Buffer; filename?: string; type?: string },
  accountId?: string,
  fiscalYear?: string
): Promise<StatementParseResult> {
  try {
    const client = useDirectusAdmin();

    // Build FormData to upload PDF to Directus files
    const directusFormData = new FormData();
    const blob = new Blob([file.data], { type: 'application/pdf' });
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
      const blob = new Blob([file.data], { type: 'application/pdf' });
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
