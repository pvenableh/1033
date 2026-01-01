/**
 * POST /api/directus/files/upload
 *
 * Upload files to Directus.
 * Accepts multipart/form-data with files under 'file' key.
 * Requires user authentication.
 */
import { getUserDirectus, uploadFiles as sdkUploadFiles } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  // Verify user is authenticated
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  try {
    // Get authenticated Directus client
    const client = await getUserDirectus(event);

    // Parse multipart form data
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'No files provided',
      });
    }

    // Build FormData for Directus SDK
    const directusFormData = new FormData();
    const files = formData.filter((item) => item.name === 'file');

    if (files.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'No files found in request',
      });
    }

    // Add each file to FormData
    for (const file of files) {
      if (file.data && file.filename && file.type) {
        const blob = new Blob([file.data], { type: file.type });
        directusFormData.append('file', blob, file.filename);
      }
    }

    // Upload to Directus
    const result = await client.request(sdkUploadFiles(directusFormData));

    return result;
  } catch (error: any) {
    console.error('File upload error:', error);

    // Re-throw if already a proper error
    if (error.statusCode) {
      throw error;
    }

    // Handle Directus errors
    if (error?.errors?.[0]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: error.errors[0].message,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to upload files',
    });
  }
});
