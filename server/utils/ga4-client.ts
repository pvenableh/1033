import { BetaAnalyticsDataClient } from '@google-analytics/data';

let analyticsClient: BetaAnalyticsDataClient | null = null;
let clientCreationError: Error | null = null;

/**
 * Validate and log details about the private key format
 */
function validatePrivateKey(privateKey: string): { valid: boolean; details: string } {
	if (!privateKey) {
		return { valid: false, details: 'Private key is empty or undefined' };
	}

	const trimmed = privateKey.trim();
	const hasBeginMarker = trimmed.includes('-----BEGIN');
	const hasEndMarker = trimmed.includes('-----END');
	const hasRSAHeader = trimmed.includes('-----BEGIN RSA PRIVATE KEY-----');
	const hasPKCS8Header = trimmed.includes('-----BEGIN PRIVATE KEY-----');
	const hasNewlines = trimmed.includes('\n');
	const hasEscapedNewlines = privateKey.includes('\\n');

	const details = [
		`Length: ${privateKey.length} chars`,
		`Has BEGIN marker: ${hasBeginMarker}`,
		`Has END marker: ${hasEndMarker}`,
		`Format: ${hasRSAHeader ? 'RSA (PKCS#1)' : hasPKCS8Header ? 'PKCS#8' : 'Unknown'}`,
		`Has actual newlines: ${hasNewlines}`,
		`Has escaped \\n: ${hasEscapedNewlines}`,
		`First 50 chars: ${trimmed.substring(0, 50)}...`,
	].join(', ');

	// Google service accounts use PKCS#8 format
	const valid = hasPKCS8Header && hasEndMarker;

	return { valid, details };
}

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
		console.log('GA4: Returning null due to previous creation error:', clientCreationError.message);
		return null;
	}

	const config = useRuntimeConfig();
	const credentialsJson = config.googleAnalyticsCredentials || process.env.GOOGLE_ANALYTICS_CREDENTIALS;
	const credentialsFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

	console.log('GA4 Client Init:', {
		hasCredentialsJson: !!credentialsJson,
		credentialsJsonLength: credentialsJson?.length || 0,
		hasCredentialsFilePath: !!credentialsFilePath,
		credentialsFilePath: credentialsFilePath || 'not set',
	});

	try {
		if (credentialsJson) {
			console.log('GA4: Using inline JSON credentials');

			let credentials;
			try {
				credentials = JSON.parse(credentialsJson);
			} catch (parseError: any) {
				console.error('GA4: Failed to parse credentials JSON:', parseError.message);
				console.error('GA4: First 100 chars of JSON:', credentialsJson.substring(0, 100));
				clientCreationError = new Error(`Invalid JSON: ${parseError.message}`);
				return null;
			}

			// Log credential details (without sensitive data)
			console.log('GA4 Credentials:', {
				type: credentials.type,
				project_id: credentials.project_id,
				client_email: credentials.client_email,
				client_id: credentials.client_id,
				auth_uri: credentials.auth_uri,
				token_uri: credentials.token_uri,
				has_private_key: !!credentials.private_key,
				has_private_key_id: !!credentials.private_key_id,
			});

			// Validate that required fields exist
			if (!credentials.private_key) {
				console.error('GA4: Missing private_key in credentials');
				clientCreationError = new Error('Missing private_key');
				return null;
			}

			if (!credentials.client_email) {
				console.error('GA4: Missing client_email in credentials');
				clientCreationError = new Error('Missing client_email');
				return null;
			}

			// Validate private key format
			const keyValidation = validatePrivateKey(credentials.private_key);
			console.log('GA4 Private Key Validation:', keyValidation);

			if (!keyValidation.valid) {
				console.warn('GA4: Private key may have format issues, but attempting to create client anyway');
			}

			console.log('GA4: Creating BetaAnalyticsDataClient with credentials...');
			analyticsClient = new BetaAnalyticsDataClient({ credentials });
			console.log('GA4: Client created successfully');
		} else if (credentialsFilePath) {
			console.log('GA4: Using GOOGLE_APPLICATION_CREDENTIALS file:', credentialsFilePath);
			analyticsClient = new BetaAnalyticsDataClient();
			console.log('GA4: Client created successfully from file');
		} else {
			console.warn('GA4: No credentials configured - neither GOOGLE_ANALYTICS_CREDENTIALS nor GOOGLE_APPLICATION_CREDENTIALS is set');
			clientCreationError = new Error('No credentials configured');
			return null;
		}

		return analyticsClient;
	} catch (error: any) {
		console.error('GA4 client creation failed:', {
			message: error.message,
			code: error.code,
			stack: error.stack?.split('\n').slice(0, 5).join('\n'),
		});
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

	console.log('GA4 Property ID:', {
		hasPropertyId: !!propertyId,
		propertyId: propertyId || 'not set',
		format: propertyId?.startsWith('properties/') ? 'correct (properties/XXX)' : 'may need prefix',
	});

	return propertyId || null;
}

/**
 * Reset the GA4 client (useful for retrying after config changes)
 */
export function resetGA4Client(): void {
	console.log('GA4: Resetting client state');
	analyticsClient = null;
	clientCreationError = null;
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
