/**
 * Session utility functions for accessing Directus tokens
 * Tokens are stored in the secure section which is encrypted
 */

/**
 * Get Directus access token from session
 */
export function getSessionAccessToken(session: any): string | undefined {
  return session?.secure?.directusAccessToken;
}

/**
 * Get Directus refresh token from session
 */
export function getSessionRefreshToken(session: any): string | undefined {
  return session?.secure?.directusRefreshToken;
}
