/**
 * Analytics Plugin - Client-side only
 * Handles automatic tracking for page views, scroll depth, time on page,
 * click events, user engagement, and authenticated user identification
 */

export default defineNuxtPlugin((nuxtApp) => {
	const router = useRouter();
	const {user, loggedIn} = useDirectusAuth();
	const {gtag} = useGtag();

	// Track if we've already identified this user in this session
	let identifiedUserId: string | null = null;

	/**
	 * Set user identification for analytics
	 * Called when user logs in or on app mount if already logged in
	 */
	const identifyUser = () => {
		if (!loggedIn.value || !user.value) {
			// Clear user ID if logged out
			if (identifiedUserId) {
				gtag('set', {user_id: undefined});
				gtag('set', 'user_properties', {
					user_email: undefined,
					user_name: undefined,
					user_first_name: undefined,
					user_role: undefined,
				});
				identifiedUserId = null;
			}
			return;
		}

		const userId = user.value.id;

		// Only identify if this is a new user or different user
		if (identifiedUserId === userId) return;

		identifiedUserId = userId;

		// Set the GA4 user_id (used for cross-device tracking)
		gtag('set', {user_id: userId});

		// Set user properties for segmentation and analysis
		const userProperties: Record<string, string | undefined> = {
			user_email: user.value.email,
			user_name: `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim() || undefined,
			user_first_name: user.value.first_name || undefined,
			user_role: user.value.role || undefined,
		};

		gtag('set', 'user_properties', userProperties);

		// Track login event with user info
		gtag('event', 'user_identified', {
			user_id: userId,
			user_email: user.value.email,
			method: 'session',
		});
	};

	// Watch for authentication changes
	watch(
		loggedIn,
		(isLoggedIn) => {
			if (isLoggedIn) {
				identifyUser();
			} else {
				// User logged out - clear identification
				if (identifiedUserId) {
					gtag('event', 'user_logout', {
						user_id: identifiedUserId,
					});
					identifiedUserId = null;
					gtag('set', {user_id: undefined});
				}
			}
		},
		{immediate: false}
	);

	// Store for tracking data
	const trackingState = {
		pageStartTime: 0,
		scrollCleanup: null as (() => void) | null,
		timeCleanup: null as (() => void) | null,
		scrollThresholdsReached: new Set<number>(),
		clickHandler: null as ((e: MouseEvent) => void) | null,
	};

	// Scroll thresholds to track
	const SCROLL_THRESHOLDS = [25, 50, 75, 90, 100];

	// Elements to track clicks on
	const TRACKABLE_ELEMENTS = ['a', 'button', '[data-track]', '[data-analytics]'];

	/**
	 * Setup scroll depth tracking
	 */
	const setupScrollTracking = () => {
		const {gtag} = useGtag();
		const route = useRoute();

		// Reset tracked thresholds
		trackingState.scrollThresholdsReached.clear();

		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;

			if (docHeight <= 0) return;

			const scrollPercent = Math.round((scrollTop / docHeight) * 100);

			SCROLL_THRESHOLDS.forEach((threshold) => {
				if (scrollPercent >= threshold && !trackingState.scrollThresholdsReached.has(threshold)) {
					trackingState.scrollThresholdsReached.add(threshold);

					gtag('event', 'scroll', {
						percent_scrolled: threshold,
						page_path: route.path,
						page_title: document.title,
					});
				}
			});
		};

		window.addEventListener('scroll', handleScroll, {passive: true});

		return () => window.removeEventListener('scroll', handleScroll);
	};

	/**
	 * Setup time on page tracking
	 */
	const setupTimeTracking = () => {
		const {gtag} = useGtag();
		const route = useRoute();

		trackingState.pageStartTime = Date.now();
		let lastPingTime = trackingState.pageStartTime;
		let isVisible = true;

		// Track visibility changes
		const handleVisibilityChange = () => {
			isVisible = document.visibilityState === 'visible';
			if (isVisible) {
				lastPingTime = Date.now();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Send engagement ping every 30 seconds while page is visible
		const engagementInterval = setInterval(() => {
			if (!isVisible) return;

			const currentTime = Date.now();
			gtag('event', 'user_engagement', {
				engagement_time_msec: currentTime - lastPingTime,
				total_time_on_page: currentTime - trackingState.pageStartTime,
				page_path: route.path,
			});
			lastPingTime = currentTime;
		}, 30000);

		// Track final time on unload
		const handleBeforeUnload = () => {
			const totalTime = Date.now() - trackingState.pageStartTime;
			gtag('event', 'timing_complete', {
				name: 'page_view_time',
				value: Math.round(totalTime),
				page_path: route.path,
				page_title: document.title,
			});
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			clearInterval(engagementInterval);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	};

	/**
	 * Setup automatic click tracking
	 */
	const setupClickTracking = () => {
		const {gtag} = useGtag();
		const route = useRoute();

		const handleClick = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target) return;

			// Find the closest trackable element
			const trackableElement = target.closest(TRACKABLE_ELEMENTS.join(',')) as HTMLElement;
			if (!trackableElement) return;

			// Get tracking data
			const trackData = trackableElement.dataset.track || trackableElement.dataset.analytics;
			const elementText =
				trackableElement.textContent?.trim().substring(0, 100) ||
				trackableElement.getAttribute('aria-label') ||
				'';
			const elementType = trackableElement.tagName.toLowerCase();

			// Check if it's a link
			const linkElement = trackableElement.closest('a') as HTMLAnchorElement;
			const href = linkElement?.href || trackableElement.getAttribute('href');

			// Determine if outbound
			let isOutbound = false;
			let linkDomain = '';
			if (href) {
				try {
					const url = new URL(href, window.location.origin);
					isOutbound = url.hostname !== window.location.hostname;
					linkDomain = url.hostname;
				} catch {
					// Invalid URL
				}
			}

			// Build event params
			const eventParams: Record<string, string | number | boolean | undefined> = {
				element_id: trackableElement.id || undefined,
				element_class: trackableElement.className || undefined,
				element_text: elementText || undefined,
				element_type: elementType,
				page_path: route.path,
			};

			// Add link-specific params
			if (href) {
				eventParams.link_url = href;
				eventParams.link_domain = linkDomain;
				eventParams.outbound = isOutbound;
			}

			// Add custom tracking data
			if (trackData) {
				try {
					const customData = JSON.parse(trackData);
					Object.assign(eventParams, customData);
				} catch {
					eventParams.track_label = trackData;
				}
			}

			// Determine event name
			let eventName = 'click';
			if (isOutbound) {
				eventName = 'outbound_click';
			} else if (trackableElement.dataset.trackEvent) {
				eventName = trackableElement.dataset.trackEvent;
			}

			gtag('event', eventName, eventParams);
		};

		document.addEventListener('click', handleClick, {capture: true});
		trackingState.clickHandler = handleClick;

		return () => {
			document.removeEventListener('click', handleClick, {capture: true});
			trackingState.clickHandler = null;
		};
	};

	/**
	 * Setup form tracking
	 */
	const setupFormTracking = () => {
		const {gtag} = useGtag();
		const route = useRoute();
		const trackedForms = new WeakSet<HTMLFormElement>();

		// Track form start (first focus)
		const handleFocusIn = (event: FocusEvent) => {
			const target = event.target as HTMLElement;
			const form = target.closest('form');

			if (!form || trackedForms.has(form)) return;
			trackedForms.add(form);

			gtag('event', 'form_start', {
				form_id: form.id || undefined,
				form_name: form.name || undefined,
				form_destination: form.action || undefined,
				form_length: form.elements.length,
				page_path: route.path,
			});
		};

		// Track form submission
		const handleSubmit = (event: SubmitEvent) => {
			const form = event.target as HTMLFormElement;
			if (!form) return;

			gtag('event', 'form_submit', {
				form_id: form.id || undefined,
				form_name: form.name || undefined,
				form_destination: form.action || undefined,
				form_length: form.elements.length,
				page_path: route.path,
			});
		};

		document.addEventListener('focusin', handleFocusIn);
		document.addEventListener('submit', handleSubmit);

		return () => {
			document.removeEventListener('focusin', handleFocusIn);
			document.removeEventListener('submit', handleSubmit);
		};
	};

	/**
	 * Initialize all tracking for a page
	 */
	const initializeTracking = () => {
		// Cleanup previous tracking
		if (trackingState.scrollCleanup) {
			trackingState.scrollCleanup();
		}
		if (trackingState.timeCleanup) {
			trackingState.timeCleanup();
		}

		// Setup new tracking
		trackingState.scrollCleanup = setupScrollTracking();
		trackingState.timeCleanup = setupTimeTracking();
	};

	// Setup click and form tracking once on app mount
	let clickCleanup: (() => void) | null = null;
	let formCleanup: (() => void) | null = null;

	nuxtApp.hook('app:mounted', () => {
		clickCleanup = setupClickTracking();
		formCleanup = setupFormTracking();
		initializeTracking();

		// Identify user if already logged in
		identifyUser();
	});

	// Track page views and reinitialize tracking on route change
	router.afterEach((to, from) => {
		// Don't track on initial load (handled by app:mounted)
		if (!from.name) return;

		// Build page view params with optional user info
		const pageViewParams: Record<string, string | undefined> = {
			page_title: document.title,
			page_location: window.location.href,
			page_path: to.path,
			page_referrer: from.fullPath,
		};

		// Add user info if logged in
		if (loggedIn.value && user.value) {
			pageViewParams.user_id = user.value.id;
			pageViewParams.user_email = user.value.email;
		}

		// Track page view
		gtag('event', 'page_view', pageViewParams);

		// Track navigation flow
		gtag('event', 'navigation', {
			from_page: from.path,
			to_page: to.path,
			navigation_method: 'route_change',
			user_id: loggedIn.value && user.value ? user.value.id : undefined,
		});

		// Reinitialize scroll and time tracking for new page
		nextTick(() => {
			initializeTracking();
		});
	});

	// Cleanup on app unmount (if needed)
	nuxtApp.hook('app:beforeMount', () => {
		// Future cleanup if needed
	});

	// Provide analytics utilities
	return {
		provide: {
			analytics: {
				trackEvent: (eventName: string, params?: Record<string, unknown>) => {
					const {gtag} = useGtag();
					const route = useRoute();
					gtag('event', eventName, {
						page_path: route.path,
						...params,
					});
				},
				setUserProperties: (properties: Record<string, string | number | boolean>) => {
					const {gtag} = useGtag();
					gtag('set', 'user_properties', properties);
				},
				setUserId: (userId: string) => {
					const {gtag} = useGtag();
					gtag('set', {user_id: userId});
				},
			},
		},
	};
});
