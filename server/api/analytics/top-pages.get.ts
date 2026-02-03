import { getGA4Client, getGA4PropertyId, getDateRange, formatDuration, isGA4Configured, createNotConfiguredResponse } from '~/server/utils/ga4-client';

/**
 * Fetch top pages from GA4
 * Returns page path, title, views, avg time on page, bounce rate
 */
export default defineEventHandler(async (event) => {
	// Check if GA4 is configured
	if (!isGA4Configured()) {
		return createNotConfiguredResponse();
	}

	const query = getQuery(event);
	const dateRangePreset = (query.dateRange as string) || '7d';
	const limit = parseInt((query.limit as string) || '10', 10);

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
			dimensions: [
				{ name: 'pagePath' },
				{ name: 'pageTitle' },
			],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'averageSessionDuration' },
				{ name: 'bounceRate' },
				{ name: 'totalUsers' },
			],
			orderBys: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit,
		});

		const pages: Array<{
			path: string;
			title: string;
			views: number;
			avgTime: string;
			bounceRate: string;
			users: number;
		}> = [];

		if (response.rows) {
			for (const row of response.rows) {
				const path = row.dimensionValues?.[0]?.value || '/';
				let title = row.dimensionValues?.[1]?.value || 'Unknown';

				// Clean up title - remove site name suffix if present
				title = title.replace(/ \| .*$/, '').replace(/ - .*$/, '');
				if (!title || title === '(not set)') {
					// Generate title from path
					title = path === '/' ? 'Home' : path.split('/').pop()?.replace(/-/g, ' ') || 'Unknown';
					title = title.charAt(0).toUpperCase() + title.slice(1);
				}

				const views = parseInt(row.metricValues?.[0]?.value || '0', 10);
				const avgDuration = parseFloat(row.metricValues?.[1]?.value || '0');
				const bounceRate = parseFloat(row.metricValues?.[2]?.value || '0') * 100;
				const users = parseInt(row.metricValues?.[3]?.value || '0', 10);

				pages.push({
					path,
					title,
					views,
					avgTime: formatDuration(avgDuration),
					bounceRate: `${bounceRate.toFixed(0)}%`,
					users,
				});
			}
		}

		return {
			success: true,
			dateRange: dateRangePreset,
			startDate,
			endDate,
			pages,
			totalPages: response.rowCount || pages.length,
		};
	} catch (error: any) {
		console.error('GA4 top pages error:', error.message || error);

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
			message: error.message || 'Failed to fetch top pages',
		});
	}
});
