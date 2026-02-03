/**
 * Analytics Directives Plugin
 * Provides Vue directives for declarative analytics tracking
 *
 * Usage:
 * - v-track-click="'button_name'" - Simple click tracking
 * - v-track-click="{event: 'cta_click', label: 'Sign Up'}" - Custom event tracking
 * - v-track-view - Track when element comes into viewport
 * - v-track-hover - Track hover interactions
 */

interface TrackClickBinding {
	event?: string;
	label?: string;
	category?: string;
	value?: number;
	[key: string]: unknown;
}

export default defineNuxtPlugin((nuxtApp) => {
	const {gtag} = useGtag();

	/**
	 * v-track-click directive
	 * Tracks click events on elements
	 *
	 * Examples:
	 * <button v-track-click="'submit_form'">Submit</button>
	 * <button v-track-click="{event: 'cta_click', label: 'Get Started', category: 'homepage'}">Get Started</button>
	 */
	nuxtApp.vueApp.directive('track-click', {
		mounted(el: HTMLElement, binding) {
			const route = useRoute();
			const value = binding.value;

			const handleClick = () => {
				let eventName = 'click';
				let eventParams: Record<string, unknown> = {
					page_path: route.path,
					element_text: el.textContent?.trim().substring(0, 100) || '',
				};

				if (typeof value === 'string') {
					eventParams.click_label = value;
				} else if (typeof value === 'object' && value !== null) {
					const {event, ...params} = value as TrackClickBinding;
					if (event) {
						eventName = event;
					}
					eventParams = {...eventParams, ...params};
				}

				gtag('event', eventName, eventParams);
			};

			el.addEventListener('click', handleClick);

			// Store handler for cleanup
			(el as HTMLElement & {_trackClickHandler: () => void})._trackClickHandler = handleClick;
		},
		unmounted(el: HTMLElement) {
			const handler = (el as HTMLElement & {_trackClickHandler?: () => void})._trackClickHandler;
			if (handler) {
				el.removeEventListener('click', handler);
			}
		},
	});

	/**
	 * v-track-view directive
	 * Tracks when an element enters the viewport (Intersection Observer)
	 *
	 * Examples:
	 * <section v-track-view="'hero_section'">...</section>
	 * <div v-track-view="{content_id: 'feature-1', content_type: 'feature'}">...</div>
	 */
	nuxtApp.vueApp.directive('track-view', {
		mounted(el: HTMLElement, binding) {
			const route = useRoute();
			const value = binding.value;
			let hasTracked = false;

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && !hasTracked) {
							hasTracked = true;

							let eventParams: Record<string, unknown> = {
								page_path: route.path,
							};

							if (typeof value === 'string') {
								eventParams.content_id = value;
							} else if (typeof value === 'object' && value !== null) {
								eventParams = {...eventParams, ...value};
							}

							gtag('event', 'view_item', eventParams);

							// Unobserve after tracking
							observer.unobserve(el);
						}
					});
				},
				{
					threshold: 0.5, // 50% of element must be visible
				}
			);

			observer.observe(el);

			// Store observer for cleanup
			(el as HTMLElement & {_trackViewObserver: IntersectionObserver})._trackViewObserver = observer;
		},
		unmounted(el: HTMLElement) {
			const observer = (el as HTMLElement & {_trackViewObserver?: IntersectionObserver})._trackViewObserver;
			if (observer) {
				observer.disconnect();
			}
		},
	});

	/**
	 * v-track-hover directive
	 * Tracks hover/focus interactions on elements
	 *
	 * Examples:
	 * <div v-track-hover="'product_card'">...</div>
	 */
	nuxtApp.vueApp.directive('track-hover', {
		mounted(el: HTMLElement, binding) {
			const route = useRoute();
			const value = binding.value;
			let hoverStartTime = 0;
			let hasTracked = false;

			const handleMouseEnter = () => {
				hoverStartTime = Date.now();
			};

			const handleMouseLeave = () => {
				if (hasTracked) return;

				const hoverDuration = Date.now() - hoverStartTime;

				// Only track if hover was longer than 500ms (intentional)
				if (hoverDuration > 500) {
					hasTracked = true;

					let eventParams: Record<string, unknown> = {
						page_path: route.path,
						hover_duration_ms: hoverDuration,
					};

					if (typeof value === 'string') {
						eventParams.hover_target = value;
					} else if (typeof value === 'object' && value !== null) {
						eventParams = {...eventParams, ...value};
					}

					gtag('event', 'element_hover', eventParams);
				}
			};

			el.addEventListener('mouseenter', handleMouseEnter);
			el.addEventListener('mouseleave', handleMouseLeave);

			// Store handlers for cleanup
			(
				el as HTMLElement & {
					_trackHoverEnter: () => void;
					_trackHoverLeave: () => void;
				}
			)._trackHoverEnter = handleMouseEnter;
			(
				el as HTMLElement & {
					_trackHoverEnter: () => void;
					_trackHoverLeave: () => void;
				}
			)._trackHoverLeave = handleMouseLeave;
		},
		unmounted(el: HTMLElement) {
			const enterHandler = (
				el as HTMLElement & {
					_trackHoverEnter?: () => void;
				}
			)._trackHoverEnter;
			const leaveHandler = (
				el as HTMLElement & {
					_trackHoverLeave?: () => void;
				}
			)._trackHoverLeave;

			if (enterHandler) {
				el.removeEventListener('mouseenter', enterHandler);
			}
			if (leaveHandler) {
				el.removeEventListener('mouseleave', leaveHandler);
			}
		},
	});

	/**
	 * v-track-visibility directive
	 * Tracks visibility percentage of an element (good for tracking content engagement)
	 *
	 * Examples:
	 * <article v-track-visibility="'blog_post'">...</article>
	 */
	nuxtApp.vueApp.directive('track-visibility', {
		mounted(el: HTMLElement, binding) {
			const route = useRoute();
			const value = binding.value;
			const trackedThresholds = new Set<number>();

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						const visibilityPercent = Math.round(entry.intersectionRatio * 100);

						// Track at 25%, 50%, 75%, 100% thresholds
						[25, 50, 75, 100].forEach((threshold) => {
							if (visibilityPercent >= threshold && !trackedThresholds.has(threshold)) {
								trackedThresholds.add(threshold);

								let eventParams: Record<string, unknown> = {
									page_path: route.path,
									visibility_percent: threshold,
								};

								if (typeof value === 'string') {
									eventParams.content_id = value;
								} else if (typeof value === 'object' && value !== null) {
									eventParams = {...eventParams, ...value};
								}

								gtag('event', 'content_visibility', eventParams);
							}
						});
					});
				},
				{
					threshold: [0, 0.25, 0.5, 0.75, 1.0],
				}
			);

			observer.observe(el);

			// Store observer for cleanup
			(el as HTMLElement & {_trackVisibilityObserver: IntersectionObserver})._trackVisibilityObserver = observer;
		},
		unmounted(el: HTMLElement) {
			const observer = (el as HTMLElement & {_trackVisibilityObserver?: IntersectionObserver})
				._trackVisibilityObserver;
			if (observer) {
				observer.disconnect();
			}
		},
	});
});
