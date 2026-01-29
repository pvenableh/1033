/**
 * POST /api/admin/extract-pdf-transactions
 *
 * Accepts a PDF bank statement and uses Claude to extract structured transaction data.
 * Returns a parsed transaction array ready for import.
 *
 * Requires admin/board member access and ANTHROPIC_API_KEY to be configured.
 */
import { hasAdminAccess } from '~/server/utils/directus';
import { isClaudeConfigured, callClaude, pdfToContentBlock, extractClaudeText } from '~/server/utils/claude';

const EXTRACTION_SYSTEM_PROMPT = `You are a financial data extraction assistant. You extract transactions from bank statement PDFs into structured JSON.

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown fences, no explanation text
- Every amount must be a positive number (use the "type" field to indicate direction)
- Dates should be in MM/DD or MM/DD/YYYY format as shown on the statement
- If the statement shows a year, include it in the dates
- Categorize each transaction type accurately based on the statement
- Include beginning and ending balances if shown on the statement
- Include the statement period if shown (e.g., "January 2025")
- For descriptions, use the exact text from the statement
- For vendor, extract the payee/merchant name when identifiable from the description`;

const EXTRACTION_PROMPT = `Extract all transactions from this bank statement PDF. Return the data as a JSON object with this exact structure:

{
  "beginning_balance": 46086.55,
  "ending_balance": 64114.11,
  "statement_period": "January 2025",
  "account_number_last4": "1234",
  "transactions": [
    {
      "date": "01/02/2025",
      "description": "Remote Deposit - Multiple Units",
      "amount": 2300.00,
      "type": "deposit",
      "vendor": "Multiple Units",
      "check_number": "1234"
    }
  ]
}

Transaction type must be one of: "deposit", "withdrawal", "fee", "transfer_in", "transfer_out"
- Use "deposit" for credits, incoming transfers, interest
- Use "withdrawal" for debits, checks, outgoing payments
- Use "fee" for bank fees, service charges
- Use "transfer_in" for incoming wire/ACH transfers
- Use "transfer_out" for outgoing wire/ACH transfers

The "vendor" field should contain the payee or merchant name when identifiable.
The "check_number" field should only be included if a check number is shown.
Amounts must ALWAYS be positive numbers.

Return ONLY the JSON object, no other text.`;

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'fee' | 'transfer_in' | 'transfer_out';
  vendor?: string;
  check_number?: string;
  balance?: number;
}

interface ExtractionResult {
  success: boolean;
  transactions?: ExtractedTransaction[];
  beginning_balance?: number;
  ending_balance?: number;
  statement_period?: string;
  account_number_last4?: string;
  token_usage?: { input: number; output: number };
  error?: string;
  message?: string;
}

export default defineEventHandler(async (event): Promise<ExtractionResult> => {
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
        error: 'Only PDF files are supported for Claude extraction. Please upload a PDF bank statement.',
      };
    }

    // Send PDF to Claude for extraction
    const pdfContent = pdfToContentBlock(fileField.data);

    const response = await callClaude({
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            pdfContent,
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const responseText = extractClaudeText(response);

    // Parse the JSON response — Claude may sometimes wrap in markdown fences
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

    // Normalize and validate transactions
    const rawTransactions = parsed.transactions || [];
    const transactions: ExtractedTransaction[] = rawTransactions.map((tx: any, index: number) => ({
      date: tx.date || '',
      description: tx.description || '',
      amount: Math.abs(parseFloat(tx.amount) || 0),
      type: normalizeType(tx.type || ''),
      vendor: tx.vendor || undefined,
      check_number: tx.check_number || undefined,
      balance: tx.balance ? parseFloat(tx.balance) : undefined,
      _raw: tx,
      _source_line: index + 1,
    }));

    return {
      success: true,
      transactions,
      beginning_balance: parsed.beginning_balance ? parseFloat(parsed.beginning_balance) : undefined,
      ending_balance: parsed.ending_balance ? parseFloat(parsed.ending_balance) : undefined,
      statement_period: parsed.statement_period || undefined,
      account_number_last4: parsed.account_number_last4 || undefined,
      token_usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      message: `Claude extracted ${transactions.length} transactions from the PDF statement.`,
    };
  } catch (error: any) {
    console.error('PDF extraction error:', error);

    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      error: `Failed to extract transactions: ${error.message}`,
    };
  }
});

function normalizeType(type: string): ExtractedTransaction['type'] {
  const t = type.toLowerCase().trim();
  if (t === 'deposit' || t === 'credit') return 'deposit';
  if (t === 'withdrawal' || t === 'debit' || t === 'check') return 'withdrawal';
  if (t === 'fee' || t === 'charge' || t === 'service charge') return 'fee';
  if (t === 'transfer_in' || t === 'transfer in') return 'transfer_in';
  if (t === 'transfer_out' || t === 'transfer out') return 'transfer_out';
  return 'withdrawal';
}
