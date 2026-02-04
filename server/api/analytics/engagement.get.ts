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

		// Get scroll depth data - try custom dimension first, fall back to total count
		// Custom dimension provides granular breakdown (25%, 50%, 75%, 90%, 100%)
		let scrollDepthData: Record<string, number> = { '25': 0, '50': 0, '75': 0, '90': 0, '100': 0 };
		let scrollEventsTotal = 0;
		let hasCustomDimension = false;

		// First, try to get detailed scroll depth using custom dimension
		try {
			const [scrollDepthResponse] = await client.runReport({
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

			// Process detailed scroll depth data
			if (scrollDepthResponse.rows && scrollDepthResponse.rows.length > 0) {
				hasCustomDimension = true;
				for (const row of scrollDepthResponse.rows) {
					const percent = row.dimensionValues?.[0]?.value || '0';
					const count = parseInt(row.metricValues?.[0]?.value || '0', 10);
					scrollEventsTotal += count;

					// Map to buckets
					const percentNum = parseInt(percent, 10);
					if (percentNum >= 25 && percentNum < 50) scrollDepthData['25'] += count;
					else if (percentNum >= 50 && percentNum < 75) scrollDepthData['50'] += count;
					else if (percentNum >= 75 && percentNum < 90) scrollDepthData['75'] += count;
					else if (percentNum >= 90 && percentNum < 100) scrollDepthData['90'] += count;
					else if (percentNum >= 100) scrollDepthData['100'] += count;
				}
			}
		} catch (scrollError: any) {
			// Custom dimension not available - fall back to total scroll events
			if (scrollError.code === 3) { // INVALID_ARGUMENT
				// Silent fallback - custom dimension not configured
			} else if (process.dev) {
				console.warn('Scroll depth query failed:', scrollError.message);
			}
		}

		// If custom dimension didn't work, get total scroll events as fallback
		if (!hasCustomDimension) {
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
					// Put all in 90% bucket (GA4 enhanced measurement default threshold)
					scrollDepthData['90'] = scrollEventsTotal;
				}
			} catch (fallbackError: any) {
				if (process.dev) {
					console.warn('Fallback scroll query failed:', fallbackError.message);
				}
			}
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

		// Calculate scroll percentages
		let scrollPercentages: Record<string, number>;
		if (hasCustomDimension && scrollEventsTotal > 0) {
			// Use actual percentages from custom dimension data
			const maxScrollUsers = Math.max(...Object.values(scrollDepthData), 1);
			scrollPercentages = {
				'25': Math.round((scrollDepthData['25'] / maxScrollUsers) * 100),
				'50': Math.round((scrollDepthData['50'] / maxScrollUsers) * 100),
				'75': Math.round((scrollDepthData['75'] / maxScrollUsers) * 100),
				'90': Math.round((scrollDepthData['90'] / maxScrollUsers) * 100),
				'100': Math.round((scrollDepthData['100'] / maxScrollUsers) * 100),
			};
		} else if (totalSessions > 0) {
			// Fallback: only 90% data available from basic scroll events
			scrollPercentages = {
				'25': 0,
				'50': 0,
				'75': 0,
				'90': Math.min(100, Math.round((scrollEventsTotal / totalSessions) * 100)),
				'100': 0,
			};
		} else {
			scrollPercentages = { '25': 0, '50': 0, '75': 0, '90': 0, '100': 0 };
		}

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

		// Determine scroll engagement metric - use 50% if custom dimension available, else 90%
		const scrollEngagementPercent = hasCustomDimension ? scrollPercentages['50'] : scrollPercentages['90'];
		const scrollEngagementDesc = hasCustomDimension ? 'Users who scroll past 50%' : 'Sessions with 90% scroll depth';

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
					value: `${scrollEngagementPercent}%`,
					description: scrollEngagementDesc,
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
				rawCounts: scrollDepthData,
				hasDetailedData: hasCustomDimension,
				note: hasCustomDimension
					? 'Full scroll depth breakdown from custom event parameter.'
					: 'Only 90% threshold available. Full breakdown requires custom event parameter setup.',
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
