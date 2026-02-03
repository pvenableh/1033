import { getGA4Client, getGA4PropertyId, getDateRange, isGA4Configured, createNotConfiguredResponse } from '~/server/utils/ga4-client';

/**
 * Fetch traffic sources from GA4
 * Returns session source/medium breakdown
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
			dimensions: [{ name: 'sessionDefaultChannelGroup' }],
			metrics: [
				{ name: 'sessions' },
				{ name: 'totalUsers' },
				{ name: 'engagedSessions' },
			],
			orderBys: [
				{ metric: { metricName: 'sessions' }, desc: true },
			],
			limit: 10,
		});

		const sources: Array<{
			source: string;
			sessions: number;
			users: number;
			percentage: number;
		}> = [];

		let totalSessions = 0;

		// First pass to get total
		if (response.rows) {
			for (const row of response.rows) {
				totalSessions += parseInt(row.metricValues?.[0]?.value || '0', 10);
			}
		}

		// Second pass to build data with percentages
		if (response.rows) {
			for (const row of response.rows) {
				const source = row.dimensionValues?.[0]?.value || 'Unknown';
				const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
				const users = parseInt(row.metricValues?.[1]?.value || '0', 10);
				const percentage = totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0;

				// Map GA4 channel names to friendlier names
				let displayName = source;
				switch (source.toLowerCase()) {
					case 'direct':
						displayName = 'Direct';
						break;
					case 'organic search':
						displayName = 'Organic Search';
						break;
					case 'organic social':
						displayName = 'Social';
						break;
					case 'referral':
						displayName = 'Referral';
						break;
					case 'email':
						displayName = 'Email';
						break;
					case 'paid search':
						displayName = 'Paid Search';
						break;
					case 'paid social':
						displayName = 'Paid Social';
						break;
					case 'display':
						displayName = 'Display Ads';
						break;
					case '(not set)':
					case 'unassigned':
						displayName = 'Other';
						break;
				}

				sources.push({
					source: displayName,
					sessions,
					users,
					percentage,
				});
			}
		}

		return {
			success: true,
			dateRange: dateRangePreset,
			startDate,
			endDate,
			sources,
			totalSessions,
		};
	} catch (error: any) {
		console.error('GA4 traffic sources error:', error.message || error);

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
			message: error.message || 'Failed to fetch traffic sources',
		});
	}
});
