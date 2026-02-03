/**
 * Form Analytics Composable
 * Provides detailed form tracking with field-level analytics
 */

interface FormAnalyticsConfig {
	formId: string;
	formName?: string;
	trackFieldInteractions?: boolean;
	trackValidationErrors?: boolean;
	trackAbandonmentOnUnload?: boolean;
}

interface FieldInteraction {
	fieldName: string;
	fieldType: string;
	focusTime: number;
	blurTime?: number;
	interactionCount: number;
	wasCompleted: boolean;
	hadError: boolean;
}

export default function useFormAnalytics(config: FormAnalyticsConfig) {
	const {gtag} = useGtag();
	const route = useRoute();

	// Form state tracking
	const formState = reactive({
		startTime: 0,
		isStarted: false,
		isSubmitted: false,
		fieldInteractions: new Map<string, FieldInteraction>(),
		completedFields: new Set<string>(),
		errorFields: new Set<string>(),
		currentField: null as string | null,
	});

	/**
	 * Mark form as started (call on first interaction)
	 */
	const trackFormStart = () => {
		if (formState.isStarted) return;

		formState.isStarted = true;
		formState.startTime = Date.now();

		gtag('event', 'form_start', {
			form_id: config.formId,
			form_name: config.formName || config.formId,
			page_path: route.path,
		});
	};

	/**
	 * Track field focus
	 */
	const trackFieldFocus = (fieldName: string, fieldType: string = 'text') => {
		if (!formState.isStarted) {
			trackFormStart();
		}

		formState.currentField = fieldName;

		// Initialize or update field interaction
		if (!formState.fieldInteractions.has(fieldName)) {
			formState.fieldInteractions.set(fieldName, {
				fieldName,
				fieldType,
				focusTime: Date.now(),
				interactionCount: 1,
				wasCompleted: false,
				hadError: false,
			});
		} else {
			const interaction = formState.fieldInteractions.get(fieldName)!;
			interaction.focusTime = Date.now();
			interaction.interactionCount++;
		}

		if (config.trackFieldInteractions) {
			gtag('event', 'form_field_focus', {
				form_id: config.formId,
				form_name: config.formName || config.formId,
				field_name: fieldName,
				field_type: fieldType,
				page_path: route.path,
			});
		}
	};

	/**
	 * Track field blur (leaving a field)
	 */
	const trackFieldBlur = (fieldName: string, hasValue: boolean = false) => {
		const interaction = formState.fieldInteractions.get(fieldName);
		if (!interaction) return;

		interaction.blurTime = Date.now();
		const timeSpent = interaction.blurTime - interaction.focusTime;

		if (hasValue) {
			interaction.wasCompleted = true;
			formState.completedFields.add(fieldName);
		}

		formState.currentField = null;

		if (config.trackFieldInteractions) {
			gtag('event', 'form_field_blur', {
				form_id: config.formId,
				form_name: config.formName || config.formId,
				field_name: fieldName,
				time_spent_ms: timeSpent,
				was_completed: hasValue,
				page_path: route.path,
			});
		}
	};

	/**
	 * Track field validation error
	 */
	const trackFieldError = (fieldName: string, errorMessage: string) => {
		const interaction = formState.fieldInteractions.get(fieldName);
		if (interaction) {
			interaction.hadError = true;
		}
		formState.errorFields.add(fieldName);

		if (config.trackValidationErrors) {
			gtag('event', 'form_field_error', {
				form_id: config.formId,
				form_name: config.formName || config.formId,
				field_name: fieldName,
				error_message: errorMessage,
				page_path: route.path,
			});
		}
	};

	/**
	 * Track successful form submission
	 */
	const trackFormSubmit = (additionalParams?: Record<string, unknown>) => {
		formState.isSubmitted = true;
		const totalTime = Date.now() - formState.startTime;
		const totalFields = formState.fieldInteractions.size;
		const completedFieldsCount = formState.completedFields.size;
		const errorFieldsCount = formState.errorFields.size;

		gtag('event', 'form_submit', {
			form_id: config.formId,
			form_name: config.formName || config.formId,
			total_time_ms: totalTime,
			total_fields: totalFields,
			completed_fields: completedFieldsCount,
			error_fields: errorFieldsCount,
			completion_rate: totalFields > 0 ? Math.round((completedFieldsCount / totalFields) * 100) : 0,
			page_path: route.path,
			...additionalParams,
		});

		// Track conversion
		gtag('event', 'conversion', {
			conversion_name: `form_submit_${config.formId}`,
			form_id: config.formId,
			page_path: route.path,
		});
	};

	/**
	 * Track form abandonment
	 */
	const trackFormAbandon = (reason?: string) => {
		if (!formState.isStarted || formState.isSubmitted) return;

		const totalTime = Date.now() - formState.startTime;
		const totalFields = formState.fieldInteractions.size;
		const completedFieldsCount = formState.completedFields.size;

		gtag('event', 'form_abandon', {
			form_id: config.formId,
			form_name: config.formName || config.formId,
			total_time_ms: totalTime,
			total_fields: totalFields,
			completed_fields: completedFieldsCount,
			last_field: formState.currentField,
			abandon_reason: reason || 'unknown',
			completion_rate: totalFields > 0 ? Math.round((completedFieldsCount / totalFields) * 100) : 0,
			page_path: route.path,
		});
	};

	/**
	 * Track form step (for multi-step forms)
	 */
	const trackFormStep = (stepNumber: number, stepName?: string) => {
		gtag('event', 'form_step', {
			form_id: config.formId,
			form_name: config.formName || config.formId,
			step_number: stepNumber,
			step_name: stepName,
			page_path: route.path,
		});
	};

	/**
	 * Get current form analytics summary
	 */
	const getFormSummary = () => {
		const totalFields = formState.fieldInteractions.size;
		const completedFieldsCount = formState.completedFields.size;
		const errorFieldsCount = formState.errorFields.size;

		return {
			isStarted: formState.isStarted,
			isSubmitted: formState.isSubmitted,
			totalFields,
			completedFields: completedFieldsCount,
			errorFields: errorFieldsCount,
			completionRate: totalFields > 0 ? Math.round((completedFieldsCount / totalFields) * 100) : 0,
			timeSpent: formState.startTime > 0 ? Date.now() - formState.startTime : 0,
			fieldInteractions: Array.from(formState.fieldInteractions.values()),
		};
	};

	/**
	 * Reset form analytics (for form reset)
	 */
	const resetFormAnalytics = () => {
		formState.startTime = 0;
		formState.isStarted = false;
		formState.isSubmitted = false;
		formState.fieldInteractions.clear();
		formState.completedFields.clear();
		formState.errorFields.clear();
		formState.currentField = null;
	};

	// Setup abandonment tracking on page unload
	if (config.trackAbandonmentOnUnload && import.meta.client) {
		const handleBeforeUnload = () => {
			if (formState.isStarted && !formState.isSubmitted) {
				trackFormAbandon('page_unload');
			}
		};

		onMounted(() => {
			window.addEventListener('beforeunload', handleBeforeUnload);
		});

		onUnmounted(() => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		});
	}

	// Track abandonment on component unmount
	onUnmounted(() => {
		if (formState.isStarted && !formState.isSubmitted) {
			trackFormAbandon('component_unmount');
		}
	});

	return {
		// State
		formState: readonly(formState),

		// Methods
		trackFormStart,
		trackFieldFocus,
		trackFieldBlur,
		trackFieldError,
		trackFormSubmit,
		trackFormAbandon,
		trackFormStep,
		getFormSummary,
		resetFormAnalytics,
	};
}
