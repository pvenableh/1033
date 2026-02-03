import { BetaAnalyticsDataClient } from '@google-analytics/data';

let analyticsClient: BetaAnalyticsDataClient | null = null;
let clientCreationError: Error | null = null;

/**
 * Get or create the GA4 Analytics Data client
 * Caches the client instance for reuse
 * Returns null if credentials are invalid or missing
 */
export function getGA4Client(): BetaAnalyticsDataClient | null {
	// If we already have a client, return it
	if (analyticsClient) {
		return analyticsClient;
	}

	// If we already tried and failed, don't retry
	if (clientCreationError) {
		return null;
	}

	const config = useRuntimeConfig();
	const credentialsJson = config.googleAnalyticsCredentials || process.env.GOOGLE_ANALYTICS_CREDENTIALS;

	try {
		if (credentialsJson) {
			const credentials = JSON.parse(credentialsJson);

			// Validate that required fields exist
			if (!credentials.private_key || !credentials.client_email) {
				console.warn('GA4 credentials missing required fields (private_key or client_email)');
				clientCreationError = new Error('Invalid credentials format');
				return null;
			}

			analyticsClient = new BetaAnalyticsDataClient({ credentials });
		} else {
			// Fall back to GOOGLE_APPLICATION_CREDENTIALS file path
			analyticsClient = new BetaAnalyticsDataClient();
		}

		return analyticsClient;
	} catch (error: any) {
		console.warn('GA4 client creation failed:', error.message);
		clientCreationError = error;
		return null;
	}
}

/**
 * Get GA4 Property ID from config
 * Returns null if not configured (for graceful handling)
 */
export function getGA4PropertyId(): string | null {
	const config = useRuntimeConfig();
	const propertyId = config.ga4PropertyId || process.env.GA4_PROPERTY_ID;

	return propertyId || null;
}

/**
 * Check if GA4 is fully configured (property ID + valid client)
 */
export function isGA4Configured(): boolean {
	return getGA4PropertyId() !== null && getGA4Client() !== null;
}

/**
 * Get the GA4 client creation error (if any)
 */
export function getGA4ClientError(): Error | null {
	return clientCreationError;
}

/**
 * Create a "not configured" response for analytics endpoints
 */
export function createNotConfiguredResponse() {
	return {
		success: false,
		configured: false,
		message: 'GA4 Data API not configured. See /admin/analytics/setup for instructions.',
	};
}

/**
 * Calculate date range based on preset
 */
export function getDateRange(preset: string): { startDate: string; endDate: string } {
	const endDate = new Date();
	const startDate = new Date();

	switch (preset) {
		case '30d':
			startDate.setDate(startDate.getDate() - 30);
			break;
		case '90d':
			startDate.setDate(startDate.getDate() - 90);
			break;
		case 'ytd':
			startDate.setMonth(0, 1);
			break;
		case 'today':
			// startDate is already today
			break;
		default: // 7d
			startDate.setDate(startDate.getDate() - 7);
	}

	return {
		startDate: formatDate(startDate),
		endDate: formatDate(endDate),
	};
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

/**
 * Format seconds to human readable duration
 */
export function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}m ${secs}s`;
}
