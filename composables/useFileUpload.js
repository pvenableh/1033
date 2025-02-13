// composables/useFileUpload.js

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

const ALLOWED_DOCUMENT_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export function useFileUpload() {
	const validateFile = (file) => {
		const errors = [];

		// Check file size
		if (file.size > MAX_FILE_SIZE) {
			errors.push(`File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
		}

		// Check file type
		const isAllowedType = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES].includes(file.type);
		if (!isAllowedType) {
			errors.push(`File type "${file.type}" is not allowed`);
		}

		// Check for potential malicious files
		if (file.name.match(/\.(exe|sh|bat|cmd|php|pl|py|js|jsp|asp|html|htm)$/i)) {
			errors.push(`File "${file.name}" has a potentially dangerous extension`);
		}

		// Check for zip files
		if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.match(/\.zip$/i)) {
			errors.push(`Zip files are not allowed`);
		}

		// Additional security checks
		const sanitizedFilename = sanitizeFilename(file.name);
		if (sanitizedFilename !== file.name) {
			errors.push(`File name "${file.name}" contains invalid characters`);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	};

	const validateFiles = (files) => {
		const errors = [];

		// Check total number of files
		if (files.length > MAX_FILES) {
			errors.push(`Maximum ${MAX_FILES} files can be uploaded at once`);
			return { isValid: false, errors };
		}

		// Validate each file
		const fileValidations = Array.from(files).map(validateFile);
		const allErrors = fileValidations.flatMap((validation) => validation.errors);

		return {
			isValid: allErrors.length === 0,
			errors: allErrors,
		};
	};

	const sanitizeFilename = (filename) => {
		// Remove any path components
		const sanitized = filename.replace(/^.*[\\\/]/, '');

		// Remove special characters and spaces
		return sanitized.replace(/[^a-zA-Z0-9.-]/g, '_');
	};

	const processUpload = async (files, options = {}) => {
		const validation = validateFiles(files);
		if (!validation.isValid) {
			throw new Error(validation.errors.join('\n'));
		}

		const formData = new FormData();
		const processedFiles = [];

		for (const file of files) {
			// Sanitize filename
			const sanitizedName = sanitizeFilename(file.name);

			// Add additional virus scanning here if needed

			// Add to FormData with sanitized name
			formData.append('file', file, sanitizedName);

			// Store processed file info
			processedFiles.push({
				originalName: file.name,
				sanitizedName,
				type: file.type,
				size: file.size,
			});
		}

		return {
			formData,
			processedFiles,
		};
	};

	return {
		validateFile,
		validateFiles,
		processUpload,
		ALLOWED_IMAGE_TYPES,
		ALLOWED_DOCUMENT_TYPES,
		MAX_FILE_SIZE,
		MAX_FILES,
	};
}
