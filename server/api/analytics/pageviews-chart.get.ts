import { getGA4Client, getGA4PropertyId, getDateRange, isGA4Configured, createNotConfiguredResponse } from '~/server/utils/ga4-client';

/**
 * Fetch page views over time for chart
 * Returns daily page views for the selected date range
 */
export default defineEventHandler(async (event) => {
	// Check if GA4 is configured
	if (!isGA4Configured()) {
		return createNotConfiguredResponse();
	}

	const query = getQuery(event);
	const dateRangePreset = (query.dateRange as string) || '7d';

	const propertyId = getGA4PropertyId()!;
	const client = getGA4Client();
	const { startDate, endDate } = getDateRange(dateRangePreset);

	try {
		const [response] = await client.runReport({
			property: propertyId,
			dateRanges: [{ startDate, endDate }],
			dimensions: [{ name: 'date' }],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'sessions' },
				{ name: 'totalUsers' },
			],
			orderBys: [
				{ dimension: { dimensionName: 'date' }, desc: false },
			],
		});

		// Process the data for chart format
		const labels: string[] = [];
		const pageViewsData: number[] = [];
		const sessionsData: number[] = [];
		const usersData: number[] = [];

		if (response.rows) {
			for (const row of response.rows) {
				const dateStr = row.dimensionValues?.[0]?.value || '';
				// Format date from YYYYMMDD to readable format
				if (dateStr.length === 8) {
					const year = dateStr.substring(0, 4);
					const month = dateStr.substring(4, 6);
					const day = dateStr.substring(6, 8);
					const date = new Date(`${year}-${month}-${day}`);

					// Use short weekday for 7d, or MM/DD for longer ranges
					if (dateRangePreset === '7d') {
						labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
					} else {
						labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
					}
				}

				pageViewsData.push(parseInt(row.metricValues?.[0]?.value || '0', 10));
				sessionsData.push(parseInt(row.metricValues?.[1]?.value || '0', 10));
				usersData.push(parseInt(row.metricValues?.[2]?.value || '0', 10));
			}
		}

		return {
			success: true,
			dateRange: dateRangePreset,
			startDate,
			endDate,
			chart: {
				labels,
				datasets: {
					pageViews: pageViewsData,
					sessions: sessionsData,
					users: usersData,
				},
			},
			totals: {
				pageViews: pageViewsData.reduce((a, b) => a + b, 0),
				sessions: sessionsData.reduce((a, b) => a + b, 0),
				users: usersData.reduce((a, b) => a + b, 0),
			},
		};
	} catch (error: any) {
		console.error('GA4 pageviews chart error:', error);
		throw createError({
			statusCode: 500,
			message: error.message || 'Failed to fetch page views chart data',
		});
	}
});
