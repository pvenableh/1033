/**
 * useDirectusFiles composable
 *
 * File management operations using @directus/sdk directly.
 * Supports upload, download, update, and delete operations.
 */
import {
  createDirectus,
  rest,
  staticToken,
  uploadFiles,
  importFile,
  readFile,
  readFiles,
  updateFile,
  updateFiles,
  deleteFile,
  deleteFiles,
  type Query,
} from '@directus/sdk';

export interface DirectusFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string | null;
  type: string;
  folder: string | null;
  uploaded_by: string;
  uploaded_on: string;
  modified_by: string | null;
  modified_on: string;
  charset: string | null;
  filesize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  embed: string | null;
  description: string | null;
  location: string | null;
  tags: string[] | null;
  metadata: Record<string, any> | null;
}

export interface FileUploadOptions {
  folder?: string;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ImageTransform {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'inside' | 'outside';
  quality?: number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  withoutEnlargement?: boolean;
}

export function useDirectusFiles() {
  const config = useRuntimeConfig();
  const { getClient: getAuthClient } = useCustomAuth();

  /**
   * Get the static token client
   */
  function getStaticClient() {
    const url = config.public.directusUrl || config.public.adminUrl;
    const token = config.public.staticToken;
    return createDirectus(url).with(rest()).with(staticToken(token));
  }

  /**
   * Get the authenticated client
   */
  function getUserClient() {
    return getAuthClient();
  }

  // ==================== UPLOAD OPERATIONS ====================

  /**
   * Upload a single file
   */
  async function upload(
    file: File,
    options?: FileUploadOptions & { useStaticToken?: boolean }
  ): Promise<DirectusFile> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();

    const formData = new FormData();
    formData.append('file', file);

    if (options?.folder) formData.append('folder', options.folder);
    if (options?.title) formData.append('title', options.title);
    if (options?.description) formData.append('description', options.description);
    if (options?.tags) formData.append('tags', JSON.stringify(options.tags));
    if (options?.metadata) formData.append('metadata', JSON.stringify(options.metadata));

    return await client.request(uploadFiles(formData));
  }

  /**
   * Upload multiple files
   */
  async function uploadMany(
    files: File[],
    options?: FileUploadOptions & { useStaticToken?: boolean }
  ): Promise<DirectusFile[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file', file);
    });

    if (options?.folder) formData.append('folder', options.folder);

    return await client.request(uploadFiles(formData));
  }

  /**
   * Import a file from a URL
   */
  async function importFromUrl(
    url: string,
    options?: FileUploadOptions & { useStaticToken?: boolean }
  ): Promise<DirectusFile> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();

    const data: Record<string, any> = { url };
    if (options?.folder) data.folder = options.folder;
    if (options?.title) data.title = options.title;
    if (options?.description) data.description = options.description;
    if (options?.tags) data.tags = options.tags;
    if (options?.metadata) data.metadata = options.metadata;

    return await client.request(importFile(url, data));
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Get a single file by ID
   */
  async function findOne(
    id: string,
    query?: Query<any, DirectusFile>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFile> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(readFile(id, query as any));
  }

  /**
   * Get multiple files
   */
  async function findMany(
    query?: Query<any, DirectusFile>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFile[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(readFiles(query as any));
  }

  /**
   * Get files by folder
   */
  async function findByFolder(
    folderId: string | null,
    query?: Query<any, DirectusFile>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFile[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(
      readFiles({
        ...query,
        filter: {
          ...((query as any)?.filter || {}),
          folder: folderId ? { _eq: folderId } : { _null: true },
        },
      } as any)
    );
  }

  /**
   * Search files by filename or title
   */
  async function search(
    searchTerm: string,
    query?: Query<any, DirectusFile>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFile[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(
      readFiles({
        ...query,
        filter: {
          _or: [
            { filename_download: { _icontains: searchTerm } },
            { title: { _icontains: searchTerm } },
            { description: { _icontains: searchTerm } },
          ],
        },
      } as any)
    );
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a single file's metadata
   */
  async function update(
    id: string,
    data: Partial<DirectusFile>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFile> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(updateFile(id, data as any));
  }

  /**
   * Update multiple files
   */
  async function updateMany(
    ids: string[],
    data: Partial<DirectusFile>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFile[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(updateFiles(ids, data as any));
  }

  /**
   * Move file to a different folder
   */
  async function moveToFolder(
    fileId: string,
    folderId: string | null,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFile> {
    return await update(fileId, { folder: folderId }, options);
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete a single file
   */
  async function remove(
    id: string,
    options?: { useStaticToken?: boolean }
  ): Promise<void> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    await client.request(deleteFile(id));
  }

  /**
   * Delete multiple files
   */
  async function removeMany(
    ids: string[],
    options?: { useStaticToken?: boolean }
  ): Promise<void> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    await client.request(deleteFiles(ids));
  }

  // ==================== URL HELPERS ====================

  /**
   * Get the URL for a file asset
   */
  function getUrl(fileId: string): string {
    const baseUrl = config.public.assetsUrl || `${config.public.directusUrl}/assets/`;
    return `${baseUrl}${fileId}`;
  }

  /**
   * Get the URL for an image with transformations
   */
  function getImageUrl(fileId: string, transforms?: ImageTransform): string {
    const baseUrl = config.public.assetsUrl || `${config.public.directusUrl}/assets/`;
    let url = `${baseUrl}${fileId}`;

    if (transforms) {
      const params = new URLSearchParams();
      if (transforms.width) params.append('width', String(transforms.width));
      if (transforms.height) params.append('height', String(transforms.height));
      if (transforms.fit) params.append('fit', transforms.fit);
      if (transforms.quality) params.append('quality', String(transforms.quality));
      if (transforms.format) params.append('format', transforms.format);
      if (transforms.withoutEnlargement) params.append('withoutEnlargement', 'true');

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Get thumbnail URL (convenience method)
   */
  function getThumbnailUrl(fileId: string, size: number = 200): string {
    return getImageUrl(fileId, {
      width: size,
      height: size,
      fit: 'cover',
      format: 'auto',
    });
  }

  /**
   * Get download URL with authentication token
   */
  function getDownloadUrl(fileId: string, download: boolean = true): string {
    const baseUrl = getUrl(fileId);
    return download ? `${baseUrl}?download=true` : baseUrl;
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Check if a file is an image
   */
  function isImage(file: DirectusFile): boolean {
    return file.type?.startsWith('image/') || false;
  }

  /**
   * Check if a file is a video
   */
  function isVideo(file: DirectusFile): boolean {
    return file.type?.startsWith('video/') || false;
  }

  /**
   * Check if a file is audio
   */
  function isAudio(file: DirectusFile): boolean {
    return file.type?.startsWith('audio/') || false;
  }

  /**
   * Check if a file is a document (PDF, DOC, etc.)
   */
  function isDocument(file: DirectusFile): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ];
    return documentTypes.includes(file.type);
  }

  /**
   * Format file size for display
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   */
  function getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  return {
    // Upload
    upload,
    uploadMany,
    importFromUrl,

    // Read
    findOne,
    findMany,
    findByFolder,
    search,

    // Update
    update,
    updateMany,
    moveToFolder,

    // Delete
    remove,
    removeMany,

    // URLs
    getUrl,
    getImageUrl,
    getThumbnailUrl,
    getDownloadUrl,

    // Utilities
    isImage,
    isVideo,
    isAudio,
    isDocument,
    formatFileSize,
    getExtension,
  };
}
