import { getGA4Client, getGA4PropertyId, getDateRange } from '~/server/utils/ga4-client';

/**
 * Fetch engagement metrics from GA4
 * Returns scroll depth, page depth, engagement rate, etc.
 */
export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const dateRangePreset = (query.dateRange as string) || '7d';

	const propertyId = getGA4PropertyId();
	const client = getGA4Client();
	const { startDate, endDate } = getDateRange(dateRangePreset);

	try {
		// Get overall engagement metrics
		const [engagementResponse] = await client.runReport({
			property: propertyId,
			dateRanges: [{ startDate, endDate }],
			metrics: [
				{ name: 'engagementRate' },
				{ name: 'engagedSessions' },
				{ name: 'sessions' },
				{ name: 'screenPageViewsPerSession' },
				{ name: 'averageSessionDuration' },
			],
		});

		// Get scroll events for scroll depth analysis
		const [scrollResponse] = await client.runReport({
			property: propertyId,
			dateRanges: [{ startDate, endDate }],
			dimensions: [{ name: 'customEvent:percent_scrolled' }],
			metrics: [{ name: 'eventCount' }],
			dimensionFilter: {
				filter: {
					fieldName: 'eventName',
					stringFilter: {
						matchType: 'EXACT',
						value: 'scroll',
					},
				},
			},
			orderBys: [
				{ dimension: { dimensionName: 'customEvent:percent_scrolled' }, desc: false },
			],
		});

		// Get form conversion metrics
		const [formResponse] = await client.runReport({
			property: propertyId,
			dateRanges: [{ startDate, endDate }],
			dimensions: [{ name: 'eventName' }],
			metrics: [{ name: 'eventCount' }],
			dimensionFilter: {
				filter: {
					fieldName: 'eventName',
					stringFilter: {
						matchType: 'FULL_REGEXP',
						value: 'form_start|form_submit',
					},
				},
			},
		});

		// Process engagement metrics
		const engagementRow = engagementResponse.rows?.[0]?.metricValues || [];
		const engagementRate = parseFloat(engagementRow[0]?.value || '0') * 100;
		const engagedSessions = parseInt(engagementRow[1]?.value || '0', 10);
		const totalSessions = parseInt(engagementRow[2]?.value || '0', 10);
		const pagesPerSession = parseFloat(engagementRow[3]?.value || '0');
		const avgSessionDuration = parseFloat(engagementRow[4]?.value || '0');

		// Process scroll depth data
		const scrollDepth: Record<string, number> = {
			'25': 0,
			'50': 0,
			'75': 0,
			'90': 0,
			'100': 0,
		};

		let maxScrollUsers = 0;
		if (scrollResponse.rows) {
			for (const row of scrollResponse.rows) {
				const percent = row.dimensionValues?.[0]?.value || '0';
				const count = parseInt(row.metricValues?.[0]?.value || '0', 10);

				// Map to our buckets
				const percentNum = parseInt(percent, 10);
				if (percentNum >= 25 && percentNum < 50) scrollDepth['25'] += count;
				else if (percentNum >= 50 && percentNum < 75) scrollDepth['50'] += count;
				else if (percentNum >= 75 && percentNum < 90) scrollDepth['75'] += count;
				else if (percentNum >= 90 && percentNum < 100) scrollDepth['90'] += count;
				else if (percentNum >= 100) scrollDepth['100'] += count;

				if (count > maxScrollUsers) maxScrollUsers = count;
			}
		}

		// Calculate scroll percentages (relative to max)
		const scrollPercentages = maxScrollUsers > 0
			? {
				'25': Math.round((scrollDepth['25'] / maxScrollUsers) * 100),
				'50': Math.round((scrollDepth['50'] / maxScrollUsers) * 100),
				'75': Math.round((scrollDepth['75'] / maxScrollUsers) * 100),
				'90': Math.round((scrollDepth['90'] / maxScrollUsers) * 100),
				'100': Math.round((scrollDepth['100'] / maxScrollUsers) * 100),
			}
			: { '25': 0, '50': 0, '75': 0, '90': 0, '100': 0 };

		// Process form conversion rate
		let formStarts = 0;
		let formSubmits = 0;
		if (formResponse.rows) {
			for (const row of formResponse.rows) {
				const eventName = row.dimensionValues?.[0]?.value || '';
				const count = parseInt(row.metricValues?.[0]?.value || '0', 10);
				if (eventName === 'form_start') formStarts = count;
				if (eventName === 'form_submit') formSubmits = count;
			}
		}
		const formCompletionRate = formStarts > 0 ? Math.round((formSubmits / formStarts) * 100) : 0;

		return {
			success: true,
			dateRange: dateRangePreset,
			startDate,
			endDate,
			metrics: [
				{
					label: 'Avg. Page Depth',
					value: `${pagesPerSession.toFixed(1)} pages`,
					description: 'Average pages viewed per session',
				},
				{
					label: 'Scroll Engagement',
					value: `${scrollPercentages['50']}%`,
					description: 'Users who scroll past 50%',
				},
				{
					label: 'Engagement Rate',
					value: `${engagementRate.toFixed(1)}%`,
					description: 'Sessions with engagement',
				},
				{
					label: 'Form Completion',
					value: `${formCompletionRate}%`,
					description: 'Form start to submit rate',
				},
			],
			scrollDepth: {
				labels: ['25%', '50%', '75%', '90%', '100%'],
				data: [
					scrollPercentages['25'],
					scrollPercentages['50'],
					scrollPercentages['75'],
					scrollPercentages['90'],
					scrollPercentages['100'],
				],
				rawCounts: scrollDepth,
			},
			totals: {
				engagementRate,
				engagedSessions,
				totalSessions,
				pagesPerSession,
				avgSessionDuration,
				formStarts,
				formSubmits,
				formCompletionRate,
			},
		};
	} catch (error: any) {
		console.error('GA4 engagement error:', error);
		throw createError({
			statusCode: 500,
			message: error.message || 'Failed to fetch engagement metrics',
		});
	}
});
