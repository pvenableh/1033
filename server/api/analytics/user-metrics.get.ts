import { isGA4Configured, createNotConfiguredResponse, getGA4PropertyId, getGA4Client } from '~/server/utils/ga4-client';

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
	// Check if GA4 is configured
	if (!isGA4Configured()) {
		return createNotConfiguredResponse();
	}

	const propertyId = getGA4PropertyId()!;
	const analyticsDataClient = getGA4Client();

	if (!analyticsDataClient) {
		return createNotConfiguredResponse();
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
		// Query 1: Get daily user metrics (using standard date dimension instead of custom user_id)
		const [dailyMetricsResponse] = await analyticsDataClient.runReport({
			property: propertyId,
			dateRanges: [
				{
					startDate: formatDate(startDate),
					endDate: formatDate(endDate),
				},
			],
			dimensions: [
				{ name: 'date' },
			],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'sessions' },
				{ name: 'totalUsers' },
				{ name: 'newUsers' },
				{ name: 'engagementRate' },
				{ name: 'averageSessionDuration' },
			],
			orderBys: [
				{
					dimension: { dimensionName: 'date' },
					desc: false,
				},
			],
		});

		// Query 2: Get today's metrics
		const [todayResponse] = await analyticsDataClient.runReport({
			property: propertyId,
			dateRanges: [
				{
					startDate: 'today',
					endDate: 'today',
				},
			],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'sessions' },
				{ name: 'totalUsers' },
				{ name: 'activeUsers' },
			],
		});

		// Query 3: Get aggregate metrics for the period
		const [aggregateResponse] = await analyticsDataClient.runReport({
			property: propertyId,
			dateRanges: [
				{
					startDate: formatDate(startDate),
					endDate: formatDate(endDate),
				},
			],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'sessions' },
				{ name: 'totalUsers' },
				{ name: 'newUsers' },
				{ name: 'engagementRate' },
				{ name: 'averageSessionDuration' },
			],
		});

		// Process daily metrics for time series data
		const dailyData: Array<{
			date: string;
			pageViews: number;
			sessions: number;
			users: number;
			newUsers: number;
			engagementRate: number;
			avgSessionDuration: number;
		}> = [];

		if (dailyMetricsResponse.rows) {
			for (const row of dailyMetricsResponse.rows) {
				const dateStr = row.dimensionValues?.[0]?.value || '';
				// Format date from YYYYMMDD to readable format
				let formattedDate = dateStr;
				if (dateStr.length === 8) {
					const year = dateStr.substring(0, 4);
					const month = dateStr.substring(4, 6);
					const day = dateStr.substring(6, 8);
					formattedDate = `${year}-${month}-${day}`;
				}

				dailyData.push({
					date: formattedDate,
					pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
					sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
					users: parseInt(row.metricValues?.[2]?.value || '0', 10),
					newUsers: parseInt(row.metricValues?.[3]?.value || '0', 10),
					engagementRate: parseFloat(row.metricValues?.[4]?.value || '0'),
					avgSessionDuration: parseFloat(row.metricValues?.[5]?.value || '0'),
				});
			}
		}

		// Process today's metrics
		const todayMetrics = todayResponse.rows?.[0]?.metricValues || [];
		const today = {
			pageViews: parseInt(todayMetrics[0]?.value || '0', 10),
			sessions: parseInt(todayMetrics[1]?.value || '0', 10),
			users: parseInt(todayMetrics[2]?.value || '0', 10),
			activeUsers: parseInt(todayMetrics[3]?.value || '0', 10),
		};

		// Process aggregate metrics
		const aggregateMetrics = aggregateResponse.rows?.[0]?.metricValues || [];
		const totals = {
			totalUsers: parseInt(aggregateMetrics[2]?.value || '0', 10),
			totalPageViews: parseInt(aggregateMetrics[0]?.value || '0', 10),
			totalSessions: parseInt(aggregateMetrics[1]?.value || '0', 10),
			newUsers: parseInt(aggregateMetrics[3]?.value || '0', 10),
			engagementRate: parseFloat(aggregateMetrics[4]?.value || '0'),
			avgSessionDuration: parseFloat(aggregateMetrics[5]?.value || '0'),
			activeToday: today.activeUsers,
		};

		return {
			success: true,
			dateRange,
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
			dailyData,
			today,
			totals,
		};
	} catch (error: any) {
		console.error('GA4 user metrics error:', error.message || error);

		// Handle credential/DECODER errors gracefully
		if (error.message?.includes('DECODER') || error.message?.includes('unsupported') || error.code === 2) {
			return {
				success: false,
				configured: false,
				message: 'GA4 credentials are invalid or misconfigured. Please check your service account credentials.',
			};
		}

		throw createError({
			statusCode: 500,
			message: error.message || 'Failed to fetch analytics data',
		});
	}
});
