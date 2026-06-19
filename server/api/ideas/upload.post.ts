/**
 * POST /api/ideas/upload
 *
 * Public, unauthenticated image upload for the community-ideas form.
 * Hardened because it is a public write surface:
 *   - images only (jpeg/png/webp/gif/heic)
 *   - max 8 MB per file, max 5 files per request
 *   - forced into the "Community Ideas" folder (looked up by name)
 *   - rate-limited per IP
 *   - uses the admin token (public role can't upload)
 *
 * Returns an array of created file objects ({ id, ... }) to attach to the idea.
 */
import {
  useDirectusAdmin,
  uploadFiles as sdkUploadFiles,
  readFolders,
  createFolder,
} from '~/server/utils/directus';
import { rateLimit } from '~/server/utils/rateLimit';
import { getClientIp, hashIp } from '~/server/utils/voter';

const FOLDER_NAME = 'Community Ideas';
const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

// Cache the folder id across invocations within an instance.
let cachedFolderId: string | null = null;

async function getUploadFolderId(client: ReturnType<typeof useDirectusAdmin>): Promise<string | null> {
  if (cachedFolderId) return cachedFolderId;
  try {
    const folders = await client.request(readFolders({ filter: { name: { _eq: FOLDER_NAME } }, limit: 1 }));
    if (folders?.[0]?.id) {
      cachedFolderId = folders[0].id;
    } else {
      const created = await client.request(createFolder({ name: FOLDER_NAME }));
      cachedFolderId = created.id;
    }
  } catch (error: any) {
    console.error('Idea upload folder error:', error?.errors?.[0]?.message || error?.message);
  }
  return cachedFolderId;
}

export default defineEventHandler(async (event) => {
  // Rate limit: 20 uploaded files worth of requests / 10 min per IP.
  const ipHash = hashIp(getClientIp(event));
  const { allowed, retryAfter } = rateLimit(`upload:${ipHash}`, 20, 10 * 60 * 1000);
  if (!allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `Please wait ${retryAfter}s before uploading again.`,
    });
  }

  const formData = await readMultipartFormData(event);
  const files = (formData || []).filter((item) => item.name === 'file');

  if (files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'No files provided' });
  }
  if (files.length > MAX_FILES) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: `Too many files (max ${MAX_FILES}).`,
    });
  }

  for (const file of files) {
    if (!file.type || !ALLOWED_TYPES.has(file.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Only image files are allowed.',
      });
    }
    if (file.data && file.data.length > MAX_BYTES) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Each image must be 8 MB or smaller.',
      });
    }
  }

  try {
    const client = useDirectusAdmin();
    const folderId = await getUploadFolderId(client);

    const results = [];
    // Upload one at a time so each lands in the target folder reliably.
    for (const file of files) {
      if (!file.data || !file.filename || !file.type) continue;
      const directusFormData = new FormData();
      if (folderId) directusFormData.append('folder', folderId);
      const blob = new Blob([file.data], { type: file.type });
      directusFormData.append('file', blob, file.filename);
      const result = await client.request(sdkUploadFiles(directusFormData));
      results.push(result);
    }

    return results;
  } catch (error: any) {
    console.error('Idea upload error:', error?.errors?.[0]?.message || error?.message || error);
    if (error?.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to upload images.',
    });
  }
});
