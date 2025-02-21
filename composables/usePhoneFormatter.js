export function usePhoneFormatter() {
	/**
	 * Formats a phone number
	 * @param {string} value - The phone number to format
	 * @returns {string} - The formatted phone number
	 */
	const formatPhoneNumber = (value) => {
		if (!value) return '';

		// Remove all non-digit characters
		const cleaned = String(value).replace(/\D/g, '');

		// Limit to 10 digits
		const digits = cleaned.slice(0, 10);

		// Apply formatting based on length
		if (digits.length === 0) return '';
		if (digits.length < 4) return digits;
		if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
	};

	/**
	 * Creates an input handler for vee-validate phone field
	 * @param {object} field - vee-validate field object from useField
	 * @returns {Function} - Input handler function
	 */
	const createPhoneInputHandler = (field) => {
		return (event) => {
			if (!event || !event.target) return;

			// Get input value and cursor position
			const inputElement = event.target;
			const currentValue = String(inputElement.value || '');
			const cursorPos = inputElement.selectionStart || 0;

			// Count digits before cursor in the current value
			const digitsBefore = currentValue.slice(0, cursorPos).replace(/\D/g, '').length;

			// Format the phone number
			const formatted = formatPhoneNumber(currentValue);

			// Update the field value
			field.value = formatted;

			// Calculate new cursor position after formatting
			nextTick(() => {
				if (!inputElement) return;

				let newPosition = 0;
				let digitCount = 0;

				// Find position after the nth digit
				for (let i = 0; i < formatted.length; i++) {
					if (/\d/.test(formatted[i])) {
						digitCount++;
						if (digitCount > digitsBefore) break;
					}
					newPosition = i + 1;
				}

				// Set cursor position
				inputElement.setSelectionRange(newPosition, newPosition);
			});
		};
	};

	return {
		formatPhoneNumber,
		createPhoneInputHandler,
	};
}
