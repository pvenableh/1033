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

  // Check if any message contains a document (PDF) content block
  const hasPdfContent = options.messages.some((msg) => {
    if (Array.isArray(msg.content)) {
      return msg.content.some((block) => (block as any).type === 'document');
    }
    return false;
  });

  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };

  // PDF document support requires the pdfs beta header
  if (hasPdfContent) {
    headers['anthropic-beta'] = 'pdfs-2024-09-25';
  }

  const response = await $fetch<ClaudeResponse>(ANTHROPIC_API_URL, {
    method: 'POST',
    headers,
    body,
  });

  return response;
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
export function pdfToContentBlock(pdfBuffer: Buffer): ClaudeDocumentContent {
  return {
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data: pdfBuffer.toString('base64'),
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
