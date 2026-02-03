import { getGA4Client, getGA4PropertyId, getDateRange, formatDuration, isGA4Configured, createNotConfiguredResponse } from '~/server/utils/ga4-client';

/**
 * Fetch overview metrics from GA4
 * Returns: total page views, unique visitors, avg session duration, bounce rate
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

	if (!client) {
		return createNotConfiguredResponse();
	}

	const { startDate, endDate } = getDateRange(dateRangePreset);

	// Also get previous period for comparison
	const prevEndDate = new Date(startDate);
	prevEndDate.setDate(prevEndDate.getDate() - 1);
	const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
	const prevStartDate = new Date(prevEndDate);
	prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

	try {
		// Current period metrics
		const [currentResponse] = await client.runReport({
			property: propertyId,
			dateRanges: [{ startDate, endDate }],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'totalUsers' },
				{ name: 'averageSessionDuration' },
				{ name: 'bounceRate' },
				{ name: 'sessions' },
				{ name: 'engagedSessions' },
			],
		});

		// Previous period metrics for comparison
		const [previousResponse] = await client.runReport({
			property: propertyId,
			dateRanges: [{
				startDate: prevStartDate.toISOString().split('T')[0],
				endDate: prevEndDate.toISOString().split('T')[0],
			}],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'totalUsers' },
				{ name: 'averageSessionDuration' },
				{ name: 'bounceRate' },
			],
		});

		// Extract current values
		const current = currentResponse.rows?.[0]?.metricValues || [];
		const pageViews = parseInt(current[0]?.value || '0', 10);
		const uniqueVisitors = parseInt(current[1]?.value || '0', 10);
		const avgSessionDuration = parseFloat(current[2]?.value || '0');
		const bounceRate = parseFloat(current[3]?.value || '0') * 100;
		const sessions = parseInt(current[4]?.value || '0', 10);
		const engagedSessions = parseInt(current[5]?.value || '0', 10);

		// Extract previous values
		const previous = previousResponse.rows?.[0]?.metricValues || [];
		const prevPageViews = parseInt(previous[0]?.value || '0', 10);
		const prevUniqueVisitors = parseInt(previous[1]?.value || '0', 10);
		const prevAvgSessionDuration = parseFloat(previous[2]?.value || '0');
		const prevBounceRate = parseFloat(previous[3]?.value || '0') * 100;

		// Calculate percentage changes
		const calcChange = (current: number, previous: number): string => {
			if (previous === 0) return current > 0 ? '+100%' : '0%';
			const change = ((current - previous) / previous) * 100;
			return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
		};

		return {
			success: true,
			dateRange: dateRangePreset,
			startDate,
			endDate,
			metrics: [
				{
					label: 'Total Page Views',
					value: pageViews.toLocaleString(),
					rawValue: pageViews,
					change: calcChange(pageViews, prevPageViews),
					changeType: pageViews >= prevPageViews ? 'positive' : 'negative',
					icon: 'i-heroicons-eye',
				},
				{
					label: 'Unique Visitors',
					value: uniqueVisitors.toLocaleString(),
					rawValue: uniqueVisitors,
					change: calcChange(uniqueVisitors, prevUniqueVisitors),
					changeType: uniqueVisitors >= prevUniqueVisitors ? 'positive' : 'negative',
					icon: 'i-heroicons-users',
				},
				{
					label: 'Avg. Session Duration',
					value: formatDuration(avgSessionDuration),
					rawValue: avgSessionDuration,
					change: calcChange(avgSessionDuration, prevAvgSessionDuration),
					changeType: avgSessionDuration >= prevAvgSessionDuration ? 'positive' : 'negative',
					icon: 'i-heroicons-clock',
				},
				{
					label: 'Bounce Rate',
					value: `${bounceRate.toFixed(1)}%`,
					rawValue: bounceRate,
					change: calcChange(bounceRate, prevBounceRate),
					// Lower bounce rate is better
					changeType: bounceRate <= prevBounceRate ? 'positive' : 'negative',
					icon: 'i-heroicons-arrow-uturn-left',
				},
			],
			totals: {
				pageViews,
				uniqueVisitors,
				avgSessionDuration,
				bounceRate,
				sessions,
				engagedSessions,
			},
		};
	} catch (error: any) {
		console.error('GA4 overview error:', error.message || error);

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
			message: error.message || 'Failed to fetch overview metrics',
		});
	}
});
