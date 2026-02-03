import { getGA4Client, getGA4PropertyId, getDateRange, isGA4Configured, createNotConfiguredResponse } from '~/server/utils/ga4-client';

/**
 * Fetch engagement metrics from GA4
 * Returns scroll depth, page depth, engagement rate, etc.
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

		// Get scroll events count (without custom dimension - just total scroll events)
		// Note: Detailed scroll depth analysis requires a custom event parameter to be registered
		let scrollResponse: any = { rows: [] };
		let scrollEventsTotal = 0;
		try {
			const [scrollCountResponse] = await client.runReport({
				property: propertyId,
				dateRanges: [{ startDate, endDate }],
				dimensions: [{ name: 'eventName' }],
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
			});
			if (scrollCountResponse.rows?.[0]) {
				scrollEventsTotal = parseInt(scrollCountResponse.rows[0].metricValues?.[0]?.value || '0', 10);
			}
			scrollResponse = scrollCountResponse;
		} catch (scrollError: any) {
			console.warn('Scroll events query failed (this is expected if scroll tracking is not configured):', scrollError.message);
		}

		// Get page depth data by page path
		const [pageDepthResponse] = await client.runReport({
			property: propertyId,
			dateRanges: [{ startDate, endDate }],
			dimensions: [{ name: 'pagePath' }],
			metrics: [
				{ name: 'screenPageViews' },
				{ name: 'averageSessionDuration' },
			],
			orderBys: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 10,
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
		// Note: Without a custom dimension for percent_scrolled, we can only show total scroll events
		// The GA4 enhanced measurement scroll event fires at 90% scroll depth by default
		const scrollDepth: Record<string, number> = {
			'25': 0,
			'50': 0,
			'75': 0,
			'90': scrollEventsTotal, // GA4 default scroll threshold is 90%
			'100': 0,
		};

		// Process page depth data for top pages
		const topPages: Array<{ path: string; views: number; avgDuration: number }> = [];
		if (pageDepthResponse.rows) {
			for (const row of pageDepthResponse.rows) {
				topPages.push({
					path: row.dimensionValues?.[0]?.value || '',
					views: parseInt(row.metricValues?.[0]?.value || '0', 10),
					avgDuration: parseFloat(row.metricValues?.[1]?.value || '0'),
				});
			}
		}

		// Calculate scroll percentages based on total sessions (gives a meaningful percentage)
		const scrollPercentages = totalSessions > 0
			? {
				'25': 0, // Not available without custom dimension
				'50': 0, // Not available without custom dimension
				'75': 0, // Not available without custom dimension
				'90': Math.min(100, Math.round((scrollEventsTotal / totalSessions) * 100)),
				'100': 0, // Not available without custom dimension
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
					value: `${scrollPercentages['90']}%`,
					description: 'Sessions with 90% scroll depth',
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
				note: 'GA4 enhanced measurement tracks scroll at 90% depth. Full scroll depth breakdown requires custom event parameters.',
			},
			topPages,
			totals: {
				engagementRate,
				engagedSessions,
				totalSessions,
				pagesPerSession,
				avgSessionDuration,
				formStarts,
				formSubmits,
				formCompletionRate,
				scrollEvents: scrollEventsTotal,
			},
		};
	} catch (error: any) {
		console.error('GA4 engagement error:', error.message || error);

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
			message: error.message || 'Failed to fetch engagement metrics',
		});
	}
});
