import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * Fetch per-user analytics metrics from GA4
 *
 * Requires:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
 *    OR GOOGLE_ANALYTICS_CREDENTIALS env var with JSON string
 * 2. GA4_PROPERTY_ID env var (e.g., "properties/123456789")
 * 3. Service account must have Viewer access to the GA4 property
 */
export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();

	// Check for required config
	const propertyId = config.ga4PropertyId || process.env.GA4_PROPERTY_ID;
	if (!propertyId) {
		throw createError({
			statusCode: 500,
			message: 'GA4_PROPERTY_ID not configured',
		});
	}

	// Initialize the client
	let analyticsDataClient: BetaAnalyticsDataClient;

	try {
		// Try to use credentials from env var (for serverless deployments)
		const credentialsJson = config.googleAnalyticsCredentials || process.env.GOOGLE_ANALYTICS_CREDENTIALS;
		if (credentialsJson) {
			const credentials = JSON.parse(credentialsJson);
			analyticsDataClient = new BetaAnalyticsDataClient({ credentials });
		} else {
			// Fall back to GOOGLE_APPLICATION_CREDENTIALS file path
			analyticsDataClient = new BetaAnalyticsDataClient();
		}
	} catch (error) {
		console.error('Failed to initialize GA4 client:', error);
		throw createError({
			statusCode: 500,
			message: 'Failed to initialize Google Analytics client',
		});
	}

	const query = getQuery(event);
	const dateRange = (query.dateRange as string) || '7d';

	// Calculate date range
	const endDate = new Date();
	const startDate = new Date();

	switch (dateRange) {
		case '30d':
			startDate.setDate(startDate.getDate() - 30);
			break;
		case '90d':
			startDate.setDate(startDate.getDate() - 90);
			break;
		case 'ytd':
			startDate.setMonth(0, 1);
			break;
		default: // 7d
			startDate.setDate(startDate.getDate() - 7);
	}

	const formatDate = (date: Date) => date.toISOString().split('T')[0];

	try {
		// Query 1: Get per-user metrics (pageviews, sessions)
		const [userMetricsResponse] = await analyticsDataClient.runReport({
			property: propertyId,
			dateRanges: [
				{
					startDate: formatDate(startDate),
					endDate: formatDate(endDate),
				},
			],
			dimensions: [
				{ name: 'customUser:user_id' }, // Custom user ID dimension
			],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'sessions' },
				{ name: 'engagementRate' },
				{ name: 'averageSessionDuration' },
			],
			dimensionFilter: {
				filter: {
					fieldName: 'customUser:user_id',
					stringFilter: {
						matchType: 'FULL_REGEXP',
						value: '.+', // Only users with a user_id set
					},
				},
			},
			orderBys: [
				{
					metric: { metricName: 'screenPageViews' },
					desc: true,
				},
			],
			limit: 100,
		});

		// Query 2: Get today's active users
		const [todayResponse] = await analyticsDataClient.runReport({
			property: propertyId,
			dateRanges: [
				{
					startDate: 'today',
					endDate: 'today',
				},
			],
			dimensions: [
				{ name: 'customUser:user_id' },
			],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'sessions' },
			],
			dimensionFilter: {
				filter: {
					fieldName: 'customUser:user_id',
					stringFilter: {
						matchType: 'FULL_REGEXP',
						value: '.+',
					},
				},
			},
		});

		// Process the results into a map by user_id
		const userMetrics: Record<string, {
			pageViews: number;
			sessions: number;
			engagementRate: number;
			avgSessionDuration: number;
			pageViewsToday: number;
			sessionsToday: number;
		}> = {};

		// Process period metrics
		if (userMetricsResponse.rows) {
			for (const row of userMetricsResponse.rows) {
				const userId = row.dimensionValues?.[0]?.value;
				if (userId) {
					userMetrics[userId] = {
						pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
						sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
						engagementRate: parseFloat(row.metricValues?.[2]?.value || '0'),
						avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0'),
						pageViewsToday: 0,
						sessionsToday: 0,
					};
				}
			}
		}

		// Add today's metrics
		if (todayResponse.rows) {
			for (const row of todayResponse.rows) {
				const userId = row.dimensionValues?.[0]?.value;
				if (userId && userMetrics[userId]) {
					userMetrics[userId].pageViewsToday = parseInt(row.metricValues?.[0]?.value || '0', 10);
					userMetrics[userId].sessionsToday = parseInt(row.metricValues?.[1]?.value || '0', 10);
				} else if (userId) {
					userMetrics[userId] = {
						pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
						sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
						engagementRate: 0,
						avgSessionDuration: 0,
						pageViewsToday: parseInt(row.metricValues?.[0]?.value || '0', 10),
						sessionsToday: parseInt(row.metricValues?.[1]?.value || '0', 10),
					};
				}
			}
		}

		// Calculate totals
		const totals = {
			totalUsers: Object.keys(userMetrics).length,
			totalPageViews: Object.values(userMetrics).reduce((sum, u) => sum + u.pageViews, 0),
			totalSessions: Object.values(userMetrics).reduce((sum, u) => sum + u.sessions, 0),
			activeToday: Object.values(userMetrics).filter(u => u.sessionsToday > 0).length,
		};

		return {
			success: true,
			dateRange,
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
			userMetrics,
			totals,
		};
	} catch (error: any) {
		console.error('GA4 API error:', error);
		throw createError({
			statusCode: 500,
			message: error.message || 'Failed to fetch analytics data',
		});
	}
});
