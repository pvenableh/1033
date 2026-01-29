/**
 * POST /api/admin/attach-statement-pdf
 *
 * Uploads a PDF file to Directus and attaches it to a monthly_statement record.
 *
 * Accepts multipart/form-data:
 *   - file: PDF file
 *   - statement_id: ID of the monthly_statement record
 *
 * Requires admin/board member access.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	updateItem,
	uploadFiles as sdkUploadFiles,
} from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);

	if (!session?.user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			message: 'Authentication required',
		});
	}

	if (!hasAdminAccess(session)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Forbidden',
			message: 'Admin access required',
		});
	}

	try {
		const formData = await readMultipartFormData(event);

		if (!formData || formData.length === 0) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: 'No data provided',
			});
		}

		// Extract statement_id from form fields
		const statementIdField = formData.find((item) => item.name === 'statement_id');
		if (!statementIdField) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: 'statement_id is required',
			});
		}
		const statementId = statementIdField.data.toString('utf-8');

		// Extract file
		const fileField = formData.find((item) => item.name === 'file');
		if (!fileField || !fileField.data || !fileField.filename) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Bad Request',
				message: 'PDF file is required',
			});
		}

		const client = useDirectusAdmin();

		// Upload file to Directus in the bank statements folder
		const STATEMENTS_FOLDER = 'b538fbe2-698d-4131-9160-f049949c8a0b';
		const directusFormData = new FormData();
		const blob = new Blob([fileField.data], { type: fileField.type || 'application/pdf' });
		directusFormData.append('file', blob, fileField.filename);
		directusFormData.append('folder', STATEMENTS_FOLDER);

		const uploadResult = await client.request(sdkUploadFiles(directusFormData));
		const fileId = uploadResult?.id;

		if (!fileId) {
			throw new Error('File upload returned no ID');
		}

		// Attach to the monthly_statement
		await client.request(
			updateItem('monthly_statements', statementId, {
				pdf_statement: fileId,
			})
		);

		return {
			success: true,
			file_id: fileId,
			statement_id: statementId,
			filename: fileField.filename,
		};
	} catch (err: any) {
		console.error('Attach PDF error:', err);

		if (err.statusCode) throw err;

		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: `Failed to attach PDF: ${err.message}`,
		});
	}
});
