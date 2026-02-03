import { getGA4Client, getGA4PropertyId } from '~/server/utils/ga4-client';

/**
 * Fetch real-time analytics from GA4
 * Returns current active users and recent activity
 */
export default defineEventHandler(async (event) => {
	const propertyId = getGA4PropertyId();
	const client = getGA4Client();

	try {
		// Get real-time active users
		const [realtimeResponse] = await client.runRealtimeReport({
			property: propertyId,
			metrics: [
				{ name: 'activeUsers' },
			],
		});

		// Get real-time active users by page
		const [pageResponse] = await client.runRealtimeReport({
			property: propertyId,
			dimensions: [{ name: 'unifiedScreenName' }],
			metrics: [{ name: 'activeUsers' }],
			limit: 5,
		});

		// Get today's page views (last 30 minutes approximation from realtime)
		const [eventsResponse] = await client.runRealtimeReport({
			property: propertyId,
			dimensions: [{ name: 'eventName' }],
			metrics: [{ name: 'eventCount' }],
			dimensionFilter: {
				filter: {
					fieldName: 'eventName',
					stringFilter: {
						matchType: 'EXACT',
						value: 'page_view',
					},
				},
			},
		});

		const activeUsers = parseInt(
			realtimeResponse.rows?.[0]?.metricValues?.[0]?.value || '0',
			10
		);

		// Get active pages
		const activePages: Array<{ page: string; users: number }> = [];
		if (pageResponse.rows) {
			for (const row of pageResponse.rows) {
				activePages.push({
					page: row.dimensionValues?.[0]?.value || 'Unknown',
					users: parseInt(row.metricValues?.[0]?.value || '0', 10),
				});
			}
		}

		// Get recent page views (last 30 min)
		const recentPageViews = parseInt(
			eventsResponse.rows?.[0]?.metricValues?.[0]?.value || '0',
			10
		);

		return {
			success: true,
			timestamp: new Date().toISOString(),
			activeUsers,
			recentPageViews,
			activePages,
		};
	} catch (error: any) {
		console.error('GA4 realtime error:', error);
		throw createError({
			statusCode: 500,
			message: error.message || 'Failed to fetch real-time data',
		});
	}
});
