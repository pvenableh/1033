/**
 * useDirectusFiles composable
 *
 * File management operations via server API endpoints.
 * Supports read, update, and delete operations.
 */

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
  const files = useDirectusItems<DirectusFile>('directus_files');

  // ==================== READ OPERATIONS ====================

  /**
   * Get a single file by ID
   */
  const findOne = async (
    id: string,
    query?: { fields?: string[]; deep?: Record<string, any> }
  ): Promise<DirectusFile> => {
    return await files.get(id, query);
  };

  /**
   * Get multiple files
   */
  const findMany = async (
    query?: {
      fields?: string[];
      filter?: Record<string, any>;
      sort?: string[];
      limit?: number;
      search?: string;
    }
  ): Promise<DirectusFile[]> => {
    return await files.list(query);
  };

  /**
   * Get files by folder
   */
  const findByFolder = async (
    folderId: string | null,
    query?: { fields?: string[]; sort?: string[]; limit?: number }
  ): Promise<DirectusFile[]> => {
    return await files.list({
      ...query,
      filter: {
        folder: folderId ? { _eq: folderId } : { _null: true },
      },
    });
  };

  /**
   * Search files by filename or title
   */
  const search = async (
    searchTerm: string,
    query?: { fields?: string[]; limit?: number }
  ): Promise<DirectusFile[]> => {
    return await files.list({
      ...query,
      search: searchTerm,
    });
  };

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a single file's metadata
   */
  const update = async (
    id: string,
    data: Partial<DirectusFile>
  ): Promise<DirectusFile> => {
    return await files.update(id, data);
  };

  /**
   * Move file to a different folder
   */
  const moveToFolder = async (
    fileId: string,
    folderId: string | null
  ): Promise<DirectusFile> => {
    return await update(fileId, { folder: folderId });
  };

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete a single file
   */
  const remove = async (id: string): Promise<boolean> => {
    return await files.remove(id);
  };

  /**
   * Delete multiple files
   */
  const removeMany = async (ids: string[]): Promise<boolean> => {
    return await files.remove(ids);
  };

  // ==================== URL HELPERS ====================

  /**
   * Get the URL for a file asset
   */
  const getUrl = (fileId: string): string => {
    const baseUrl = config.public.assetsUrl || `${config.public.directusUrl}/assets/`;
    return `${baseUrl}${fileId}`;
  };

  /**
   * Get the URL for an image with transformations
   */
  const getImageUrl = (fileId: string, transforms?: ImageTransform): string => {
    let url = getUrl(fileId);

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
  };

  /**
   * Get thumbnail URL (convenience method)
   */
  const getThumbnailUrl = (fileId: string, size: number = 200): string => {
    return getImageUrl(fileId, {
      width: size,
      height: size,
      fit: 'cover',
      format: 'auto',
    });
  };

  /**
   * Get download URL
   */
  const getDownloadUrl = (fileId: string, download: boolean = true): string => {
    const baseUrl = getUrl(fileId);
    return download ? `${baseUrl}?download=true` : baseUrl;
  };

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Check if a file is an image
   */
  const isImage = (file: DirectusFile): boolean => {
    return file.type?.startsWith('image/') || false;
  };

  /**
   * Check if a file is a video
   */
  const isVideo = (file: DirectusFile): boolean => {
    return file.type?.startsWith('video/') || false;
  };

  /**
   * Check if a file is audio
   */
  const isAudio = (file: DirectusFile): boolean => {
    return file.type?.startsWith('audio/') || false;
  };

  /**
   * Check if a file is a document
   */
  const isDocument = (file: DirectusFile): boolean => {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
    return documentTypes.includes(file.type);
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Get file extension from filename
   */
  const getExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // ==================== UPLOAD OPERATIONS ====================

  /**
   * Upload files to Directus
   * @param formData - FormData containing file(s) under 'file' key
   * @returns Uploaded file(s) - single file or array of files
   */
  const uploadFiles = async (formData: FormData): Promise<DirectusFile | DirectusFile[]> => {
    const response = await $fetch<DirectusFile | DirectusFile[]>('/api/directus/files/upload', {
      method: 'POST',
      body: formData,
    });
    return response;
  };

  /**
   * Update a file's metadata (alias for update, for API consistency)
   */
  const updateFile = async (
    id: string,
    data: Partial<DirectusFile>
  ): Promise<DirectusFile> => {
    return await update(id, data);
  };

  return {
    // Read
    findOne,
    findMany,
    findByFolder,
    search,

    // Update
    update,
    moveToFolder,
    updateFile,

    // Delete
    remove,
    removeMany,

    // Upload
    uploadFiles,

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
