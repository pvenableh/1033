/**
 * useSanitize composable
 *
 * Provides HTML sanitization that works safely during SSR.
 * DOMPurify is only loaded on the client side to avoid ESM compatibility issues.
 */

let DOMPurifyModule: typeof import('isomorphic-dompurify').default | null = null;

const DEFAULT_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 's', 'u', 'a', 'ul', 'ol', 'li', 'span', 'img'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'data-id', 'data-label'],
};

export function useSanitize() {
  const isClient = import.meta.client;

  /**
   * Sanitize HTML content
   * During SSR, returns the raw content (will be sanitized on hydration)
   * On client, uses DOMPurify for proper sanitization
   */
  const sanitize = async (
    html: string,
    config?: typeof DEFAULT_CONFIG
  ): Promise<string> => {
    if (!html) return '';

    // On server, return escaped content for safety
    if (!isClient) {
      // Basic HTML escape for SSR - will be properly sanitized on client
      return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Lazy load DOMPurify on client
    if (!DOMPurifyModule) {
      const module = await import('isomorphic-dompurify');
      DOMPurifyModule = module.default;
    }

    return DOMPurifyModule.sanitize(html, config || DEFAULT_CONFIG);
  };

  /**
   * Synchronous sanitize - for use in computed properties
   * Returns raw content on server, sanitized on client (after DOMPurify is loaded)
   */
  const sanitizeSync = (
    html: string,
    config?: typeof DEFAULT_CONFIG
  ): string => {
    if (!html) return '';

    // On server or if DOMPurify not yet loaded, return content as-is
    // The component should use ClientOnly wrapper for safe rendering
    if (!isClient || !DOMPurifyModule) {
      return html;
    }

    return DOMPurifyModule.sanitize(html, config || DEFAULT_CONFIG);
  };

  /**
   * Initialize DOMPurify on client
   * Call this in onMounted to ensure DOMPurify is ready
   */
  const initSanitizer = async (): Promise<void> => {
    if (isClient && !DOMPurifyModule) {
      const module = await import('isomorphic-dompurify');
      DOMPurifyModule = module.default;
    }
  };

  return {
    sanitize,
    sanitizeSync,
    initSanitizer,
    DEFAULT_CONFIG,
  };
}
