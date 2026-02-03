/**
 * Comprehensive Analytics Composable
 * Provides centralized tracking for Google Analytics 4 events
 */

export interface AnalyticsEventParams {
	[key: string]: string | number | boolean | undefined;
}

export interface PageViewParams {
	page_title?: string;
	page_location?: string;
	page_path?: string;
	page_referrer?: string;
}

export interface ScrollTrackingConfig {
	thresholds?: number[];
	trackOnce?: boolean;
}

export interface ClickEventParams {
	element_id?: string;
	element_class?: string;
	element_text?: string;
	element_type?: string;
	link_url?: string;
	link_domain?: string;
	outbound?: boolean;
}

export interface FormEventParams {
	form_id?: string;
	form_name?: string;
	form_destination?: string;
	form_length?: number;
	field_name?: string;
	field_type?: string;
}

export interface UserEngagementParams {
	engagement_time_msec?: number;
	session_duration?: number;
	page_depth?: number;
	pages_viewed?: string[];
}

export interface ContentInteractionParams {
	content_type?: string;
	content_id?: string;
	content_name?: string;
	content_group?: string;
	item_id?: string;
	item_name?: string;
}

export interface SearchParams {
	search_term?: string;
	search_results?: number;
}

export interface ErrorParams {
	error_message?: string;
	error_type?: string;
	error_stack?: string;
	fatal?: boolean;
}

// Store for tracking session data
const sessionData = reactive({
	startTime: 0,
	pageDepth: 0,
	pagesViewed: [] as string[],
	scrollDepthReached: new Set<number>(),
	engagementTime: 0,
	lastActivityTime: 0,
});

export default function useAnalytics() {
	const {gtag} = useGtag();
	const route = useRoute();

	// Initialize session tracking
	const initSession = () => {
		if (import.meta.client && sessionData.startTime === 0) {
			sessionData.startTime = Date.now();
			sessionData.lastActivityTime = Date.now();
		}
	};

	// ===================
	// PAGE VIEW TRACKING
	// ===================

	/**
	 * Track a page view with optional custom parameters
	 */
	const trackPageView = (params?: PageViewParams) => {
		if (import.meta.server) return;

		const defaultParams: PageViewParams = {
			page_title: document.title,
			page_location: window.location.href,
			page_path: route.path,
			page_referrer: document.referrer || undefined,
		};

		gtag('event', 'page_view', {...defaultParams, ...params});

		// Update session data
		sessionData.pageDepth++;
		if (!sessionData.pagesViewed.includes(route.path)) {
			sessionData.pagesViewed.push(route.path);
		}
	};

	/**
	 * Track virtual page view for SPAs (e.g., modals, tabs)
	 */
	const trackVirtualPageView = (virtualPath: string, title?: string) => {
		if (import.meta.server) return;

		gtag('event', 'page_view', {
			page_title: title || document.title,
			page_location: `${window.location.origin}${virtualPath}`,
			page_path: virtualPath,
			virtual_page: true,
		});
	};

	// ===================
	// SCROLL TRACKING
	// ===================

	/**
	 * Track scroll depth at various thresholds
	 */
	const trackScrollDepth = (percentage: number) => {
		if (import.meta.server) return;

		// Only track each threshold once per page
		if (sessionData.scrollDepthReached.has(percentage)) return;
		sessionData.scrollDepthReached.add(percentage);

		gtag('event', 'scroll', {
			percent_scrolled: percentage,
			page_path: route.path,
			page_title: document.title,
		});
	};

	/**
	 * Setup automatic scroll depth tracking
	 */
	const setupScrollTracking = (config?: ScrollTrackingConfig) => {
		if (import.meta.server) return;

		const thresholds = config?.thresholds || [25, 50, 75, 90, 100];
		const trackOnce = config?.trackOnce !== false;

		// Reset tracked thresholds for new page
		if (!trackOnce) {
			sessionData.scrollDepthReached.clear();
		}

		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const scrollPercent = Math.round((scrollTop / docHeight) * 100);

			thresholds.forEach((threshold) => {
				if (scrollPercent >= threshold && !sessionData.scrollDepthReached.has(threshold)) {
					trackScrollDepth(threshold);
				}
			});
		};

		window.addEventListener('scroll', handleScroll, {passive: true});

		// Return cleanup function
		return () => window.removeEventListener('scroll', handleScroll);
	};

	// ===================
	// CLICK TRACKING
	// ===================

	/**
	 * Track a click event
	 */
	const trackClick = (params: ClickEventParams & AnalyticsEventParams) => {
		if (import.meta.server) return;

		gtag('event', 'click', {
			page_path: route.path,
			...params,
		});
	};

	/**
	 * Track outbound link clicks
	 */
	const trackOutboundLink = (url: string, params?: AnalyticsEventParams) => {
		if (import.meta.server) return;

		try {
			const linkUrl = new URL(url);
			const isOutbound = linkUrl.hostname !== window.location.hostname;

			gtag('event', 'click', {
				event_category: 'outbound',
				link_url: url,
				link_domain: linkUrl.hostname,
				outbound: isOutbound,
				page_path: route.path,
				...params,
			});
		} catch {
			// Invalid URL, track anyway
			gtag('event', 'click', {
				event_category: 'outbound',
				link_url: url,
				page_path: route.path,
				...params,
			});
		}
	};

	/**
	 * Track CTA (Call to Action) button clicks
	 */
	const trackCTAClick = (ctaName: string, ctaLocation: string, params?: AnalyticsEventParams) => {
		if (import.meta.server) return;

		gtag('event', 'cta_click', {
			cta_name: ctaName,
			cta_location: ctaLocation,
			page_path: route.path,
			page_title: document.title,
			...params,
		});
	};

	// ===================
	// FORM TRACKING
	// ===================

	/**
	 * Track form start (first interaction)
	 */
	const trackFormStart = (params: FormEventParams) => {
		if (import.meta.server) return;

		gtag('event', 'form_start', {
			page_path: route.path,
			...params,
		});
	};

	/**
	 * Track form submission
	 */
	const trackFormSubmit = (params: FormEventParams & AnalyticsEventParams) => {
		if (import.meta.server) return;

		gtag('event', 'form_submit', {
			page_path: route.path,
			...params,
		});
	};

	/**
	 * Track form abandonment
	 */
	const trackFormAbandon = (params: FormEventParams & {fields_completed?: number; total_fields?: number}) => {
		if (import.meta.server) return;

		gtag('event', 'form_abandon', {
			page_path: route.path,
			...params,
		});
	};

	/**
	 * Track form field focus
	 */
	const trackFormFieldFocus = (params: FormEventParams) => {
		if (import.meta.server) return;

		gtag('event', 'form_field_focus', {
			page_path: route.path,
			...params,
		});
	};

	/**
	 * Track form validation error
	 */
	const trackFormError = (params: FormEventParams & {error_message?: string}) => {
		if (import.meta.server) return;

		gtag('event', 'form_error', {
			page_path: route.path,
			...params,
		});
	};

	// ===================
	// TIME TRACKING
	// ===================

	/**
	 * Track time on page
	 */
	const trackTimeOnPage = (timeMs: number) => {
		if (import.meta.server) return;

		gtag('event', 'timing_complete', {
			name: 'page_view_time',
			value: Math.round(timeMs),
			page_path: route.path,
			page_title: document.title,
		});
	};

	/**
	 * Track user engagement time
	 */
	const trackEngagement = (params?: UserEngagementParams) => {
		if (import.meta.server) return;

		const engagementTime = Date.now() - sessionData.lastActivityTime;
		sessionData.engagementTime += engagementTime;
		sessionData.lastActivityTime = Date.now();

		gtag('event', 'user_engagement', {
			engagement_time_msec: engagementTime,
			session_duration: Date.now() - sessionData.startTime,
			page_depth: sessionData.pageDepth,
			...params,
		});
	};

	/**
	 * Setup automatic time tracking for the current page
	 */
	const setupTimeTracking = () => {
		if (import.meta.server) return;

		const startTime = Date.now();
		let lastPingTime = startTime;

		// Track engagement every 30 seconds
		const engagementInterval = setInterval(() => {
			const currentTime = Date.now();
			gtag('event', 'user_engagement', {
				engagement_time_msec: currentTime - lastPingTime,
				total_time_on_page: currentTime - startTime,
				page_path: route.path,
			});
			lastPingTime = currentTime;
		}, 30000);

		// Track final time when leaving page
		const handleBeforeUnload = () => {
			trackTimeOnPage(Date.now() - startTime);
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		// Return cleanup function
		return () => {
			clearInterval(engagementInterval);
			window.removeEventListener('beforeunload', handleBeforeUnload);
			trackTimeOnPage(Date.now() - startTime);
		};
	};

	// ===================
	// PAGE FLOW TRACKING
	// ===================

	/**
	 * Get the current page flow/journey
	 */
	const getPageFlow = () => {
		return {
			pagesViewed: [...sessionData.pagesViewed],
			pageDepth: sessionData.pageDepth,
			sessionDuration: Date.now() - sessionData.startTime,
		};
	};

	/**
	 * Track navigation within the site
	 */
	const trackNavigation = (from: string, to: string, method?: string) => {
		if (import.meta.server) return;

		gtag('event', 'navigation', {
			from_page: from,
			to_page: to,
			navigation_method: method || 'click',
			page_depth: sessionData.pageDepth,
		});
	};

	// ===================
	// CONTENT INTERACTION
	// ===================

	/**
	 * Track content view
	 */
	const trackContentView = (params: ContentInteractionParams) => {
		if (import.meta.server) return;

		gtag('event', 'view_item', {
			page_path: route.path,
			...params,
		});
	};

	/**
	 * Track content share
	 */
	const trackShare = (method: string, contentType: string, itemId?: string) => {
		if (import.meta.server) return;

		gtag('event', 'share', {
			method,
			content_type: contentType,
			item_id: itemId,
			page_path: route.path,
		});
	};

	/**
	 * Track file download
	 */
	const trackDownload = (fileName: string, fileType: string, params?: AnalyticsEventParams) => {
		if (import.meta.server) return;

		gtag('event', 'file_download', {
			file_name: fileName,
			file_extension: fileType,
			page_path: route.path,
			...params,
		});
	};

	/**
	 * Track video interaction
	 */
	const trackVideo = (
		action: 'start' | 'progress' | 'complete' | 'pause',
		videoTitle: string,
		params?: {video_percent?: number; video_duration?: number}
	) => {
		if (import.meta.server) return;

		gtag('event', `video_${action}`, {
			video_title: videoTitle,
			page_path: route.path,
			...params,
		});
	};

	// ===================
	// SEARCH TRACKING
	// ===================

	/**
	 * Track site search
	 */
	const trackSearch = (params: SearchParams) => {
		if (import.meta.server) return;

		gtag('event', 'search', {
			page_path: route.path,
			...params,
		});
	};

	// ===================
	// ERROR TRACKING
	// ===================

	/**
	 * Track errors
	 */
	const trackError = (params: ErrorParams) => {
		if (import.meta.server) return;

		gtag('event', 'exception', {
			description: params.error_message,
			fatal: params.fatal || false,
			error_type: params.error_type,
			page_path: route.path,
		});
	};

	// ===================
	// CUSTOM EVENTS
	// ===================

	/**
	 * Track any custom event
	 */
	const trackEvent = (eventName: string, params?: AnalyticsEventParams) => {
		if (import.meta.server) return;

		gtag('event', eventName, {
			page_path: route.path,
			...params,
		});
	};

	/**
	 * Track conversion/goal completion
	 */
	const trackConversion = (conversionName: string, value?: number, params?: AnalyticsEventParams) => {
		if (import.meta.server) return;

		gtag('event', 'conversion', {
			conversion_name: conversionName,
			value: value,
			page_path: route.path,
			...params,
		});
	};

	// ===================
	// USER PROPERTIES
	// ===================

	/**
	 * Set user properties for segmentation
	 */
	const setUserProperties = (properties: Record<string, string | number | boolean>) => {
		if (import.meta.server) return;

		gtag('set', 'user_properties', properties);
	};

	/**
	 * Set user ID for cross-device tracking
	 */
	const setUserId = (userId: string) => {
		if (import.meta.server) return;

		gtag('set', {user_id: userId});
	};

	// Initialize session on composable use
	initSession();

	return {
		// Page views
		trackPageView,
		trackVirtualPageView,

		// Scroll
		trackScrollDepth,
		setupScrollTracking,

		// Clicks
		trackClick,
		trackOutboundLink,
		trackCTAClick,

		// Forms
		trackFormStart,
		trackFormSubmit,
		trackFormAbandon,
		trackFormFieldFocus,
		trackFormError,

		// Time
		trackTimeOnPage,
		trackEngagement,
		setupTimeTracking,

		// Page flow
		getPageFlow,
		trackNavigation,

		// Content
		trackContentView,
		trackShare,
		trackDownload,
		trackVideo,

		// Search
		trackSearch,

		// Errors
		trackError,

		// Custom
		trackEvent,
		trackConversion,

		// User
		setUserProperties,
		setUserId,

		// Session data (readonly)
		sessionData: readonly(sessionData),
	};
}
