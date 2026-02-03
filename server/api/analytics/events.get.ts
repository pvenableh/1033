import { getGA4Client, getGA4PropertyId, getDateRange, isGA4Configured, createNotConfiguredResponse } from '~/server/utils/ga4-client';

/**
 * Fetch event tracking summary from GA4
 * Returns counts of custom events
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
			dimensions: [{ name: 'eventName' }],
			metrics: [
				{ name: 'eventCount' },
				{ name: 'totalUsers' },
			],
			orderBys: [
				{ metric: { metricName: 'eventCount' }, desc: true },
			],
			limit: 50,
		});

		// Event category mappings
		const eventCategories: Record<string, string> = {
			// User events
			user_identified: 'Users',
			user_logout: 'Users',
			login: 'Users',
			sign_up: 'Users',

			// Engagement events
			click: 'Engagement',
			button_click: 'Engagement',
			cta_click: 'Engagement',
			scroll: 'Engagement',
			user_engagement: 'Engagement',

			// Navigation events
			page_view: 'Navigation',
			navigation: 'Navigation',
			outbound_click: 'Navigation',

			// Conversion events
			form_submit: 'Conversion',
			form_start: 'Conversion',
			form_abandon: 'Conversion',
			conversion: 'Conversion',

			// Content events
			file_download: 'Content',
			view_item: 'Content',
			search: 'Content',
			video_start: 'Content',
			video_complete: 'Content',
		};

		// Events to highlight (custom tracked events)
		const highlightEvents = [
			'user_identified',
			'button_click',
			'cta_click',
			'form_submit',
			'outbound_click',
			'file_download',
			'user_logout',
			'scroll',
		];

		const events: Array<{
			event: string;
			count: number;
			users: number;
			category: string;
		}> = [];

		const allEvents: typeof events = [];

		if (response.rows) {
			for (const row of response.rows) {
				const eventName = row.dimensionValues?.[0]?.value || 'unknown';
				const count = parseInt(row.metricValues?.[0]?.value || '0', 10);
				const users = parseInt(row.metricValues?.[1]?.value || '0', 10);
				const category = eventCategories[eventName] || 'Other';

				const eventData = { event: eventName, count, users, category };
				allEvents.push(eventData);

				// Only include highlight events in the main list
				if (highlightEvents.includes(eventName)) {
					events.push(eventData);
				}
			}
		}

		// Sort highlighted events by count
		events.sort((a, b) => b.count - a.count);

		// Calculate totals by category
		const categoryTotals: Record<string, number> = {};
		for (const e of allEvents) {
			categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.count;
		}

		return {
			success: true,
			dateRange: dateRangePreset,
			startDate,
			endDate,
			events: events.slice(0, 8), // Top 8 highlighted events
			allEvents,
			categoryTotals,
			totalEvents: allEvents.reduce((sum, e) => sum + e.count, 0),
		};
	} catch (error: any) {
		console.error('GA4 events error:', error.message || error);

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
			message: error.message || 'Failed to fetch events summary',
		});
	}
});
