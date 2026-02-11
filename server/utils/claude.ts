/**
 * Server-side Claude (Anthropic) API utility
 *
 * Provides a reusable function for calling Claude's Messages API.
 * Supports text and document (PDF/image) inputs.
 *
 * Set the ANTHROPIC_API_KEY environment variable to enable.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8192;

interface ClaudeTextContent {
  type: 'text';
  text: string;
}

interface ClaudeDocumentContent {
  type: 'document';
  source: {
    type: 'base64';
    media_type: 'application/pdf';
    data: string;
  };
}

interface ClaudeImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
    data: string;
  };
}

type ClaudeContentBlock = ClaudeTextContent | ClaudeDocumentContent | ClaudeImageContent;

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

interface ClaudeRequestOptions {
  /** The messages to send */
  messages: ClaudeMessage[];
  /** Optional system prompt */
  system?: string;
  /** Model to use (defaults to claude-sonnet-4-20250514) */
  model?: string;
  /** Max tokens to generate (defaults to 8192) */
  maxTokens?: number;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Check if the Anthropic API key is configured.
 */
export function isClaudeConfigured(): boolean {
  const config = useRuntimeConfig();
  return !!config.anthropicApiKey;
}

/**
 * Call the Claude Messages API.
 *
 * @param options - Request options including messages, system prompt, model
 * @returns The Claude API response
 * @throws Error if API key is not configured or request fails
 */
export async function callClaude(options: ClaudeRequestOptions): Promise<ClaudeResponse> {
  const config = useRuntimeConfig();
  const apiKey = config.anthropicApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: 'Anthropic API key is not configured. Set the ANTHROPIC_API_KEY environment variable.',
    });
  }

  const body = {
    model: options.model || DEFAULT_MODEL,
    max_tokens: options.maxTokens || MAX_TOKENS,
    messages: options.messages,
    ...(options.system ? { system: options.system } : {}),
  };

  try {
    const response = await $fetch<ClaudeResponse>(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body,
    });

    return response;
  } catch (error: any) {
    // Log the actual Anthropic API error details (error.data contains the response body)
    const apiError = error?.data?.error || error?.data;
    console.error('Claude API error:', {
      status: error?.status || error?.statusCode,
      type: apiError?.type,
      message: apiError?.message,
      data: JSON.stringify(error?.data)?.substring(0, 1000),
    });
    throw error;
  }
}

/**
 * Extract the text content from a Claude response.
 */
export function extractClaudeText(response: ClaudeResponse): string {
  return response.content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text!)
    .join('\n');
}

/**
 * Helper to build a document content block from a PDF buffer.
 */
export function pdfToContentBlock(pdfBuffer: Buffer | Uint8Array): ClaudeDocumentContent {
  // Ensure proper Buffer for base64 encoding (Uint8Array.toString('base64') doesn't work)
  const buf = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  return {
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data: buf.toString('base64'),
    },
  };
}

/**
 * Helper to build an image content block from a buffer.
 */
export function imageToContentBlock(
  imageBuffer: Buffer,
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
): ClaudeImageContent {
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data: imageBuffer.toString('base64'),
    },
  };
}
