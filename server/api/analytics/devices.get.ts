import { getGA4Client, getGA4PropertyId, getDateRange, isGA4Configured, createNotConfiguredResponse } from '~/server/utils/ga4-client';

/**
 * Fetch device breakdown from GA4
 * Returns desktop, mobile, tablet percentages
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

	try {
		const [response] = await client.runReport({
			property: propertyId,
			dateRanges: [{ startDate, endDate }],
			dimensions: [{ name: 'deviceCategory' }],
			metrics: [
				{ name: 'sessions' },
				{ name: 'totalUsers' },
			],
			orderBys: [
				{ metric: { metricName: 'sessions' }, desc: true },
			],
		});

		const deviceData: Record<string, { sessions: number; users: number }> = {
			desktop: { sessions: 0, users: 0 },
			mobile: { sessions: 0, users: 0 },
			tablet: { sessions: 0, users: 0 },
		};

		let totalSessions = 0;

		if (response.rows) {
			for (const row of response.rows) {
				const device = (row.dimensionValues?.[0]?.value || 'unknown').toLowerCase();
				const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
				const users = parseInt(row.metricValues?.[1]?.value || '0', 10);

				if (device in deviceData) {
					deviceData[device] = { sessions, users };
				}
				totalSessions += sessions;
			}
		}

		// Calculate percentages
		const calcPercentage = (sessions: number) =>
			totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0;

		return {
			success: true,
			dateRange: dateRangePreset,
			startDate,
			endDate,
			devices: {
				desktop: {
					...deviceData.desktop,
					percentage: calcPercentage(deviceData.desktop.sessions),
				},
				mobile: {
					...deviceData.mobile,
					percentage: calcPercentage(deviceData.mobile.sessions),
				},
				tablet: {
					...deviceData.tablet,
					percentage: calcPercentage(deviceData.tablet.sessions),
				},
			},
			chart: {
				labels: ['Desktop', 'Mobile', 'Tablet'],
				data: [
					calcPercentage(deviceData.desktop.sessions),
					calcPercentage(deviceData.mobile.sessions),
					calcPercentage(deviceData.tablet.sessions),
				],
			},
			totalSessions,
		};
	} catch (error: any) {
		console.error('GA4 devices error:', error.message || error);

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
			message: error.message || 'Failed to fetch device breakdown',
		});
	}
});
