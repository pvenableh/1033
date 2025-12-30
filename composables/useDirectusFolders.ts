/**
 * useDirectusFolders composable
 *
 * Folder management using @directus/sdk directly.
 * Supports creating, reading, updating, and deleting folders.
 */
import {
  createDirectus,
  rest,
  staticToken,
  createFolder,
  createFolders,
  readFolder,
  readFolders,
  updateFolder,
  updateFolders,
  deleteFolder,
  deleteFolders,
  type Query,
} from '@directus/sdk';

export interface DirectusFolder {
  id: string;
  name: string;
  parent: string | null;
}

export interface FolderTree extends DirectusFolder {
  children: FolderTree[];
}

export function useDirectusFolders() {
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

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a new folder
   */
  async function create(
    name: string,
    parentId?: string | null,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(
      createFolder({
        name,
        parent: parentId || null,
      } as any)
    );
  }

  /**
   * Create multiple folders
   */
  async function createMany(
    folders: Array<{ name: string; parent?: string | null }>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(
      createFolders(
        folders.map((f) => ({
          name: f.name,
          parent: f.parent || null,
        })) as any[]
      )
    );
  }

  /**
   * Create a folder path (creates nested folders if they don't exist)
   */
  async function createPath(
    path: string,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder> {
    const parts = path.split('/').filter(Boolean);
    let parentId: string | null = null;
    let lastFolder: DirectusFolder | null = null;

    for (const name of parts) {
      // Check if folder exists
      const existing = await findByName(name, parentId, options);

      if (existing) {
        parentId = existing.id;
        lastFolder = existing;
      } else {
        // Create the folder
        lastFolder = await create(name, parentId, options);
        parentId = lastFolder.id;
      }
    }

    if (!lastFolder) {
      throw new Error('Failed to create folder path');
    }

    return lastFolder;
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Get a single folder by ID
   */
  async function findOne(
    id: string,
    query?: Query<any, DirectusFolder>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(readFolder(id, query as any));
  }

  /**
   * Get all folders
   */
  async function findMany(
    query?: Query<any, DirectusFolder>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(readFolders(query as any));
  }

  /**
   * Get root folders (folders without parent)
   */
  async function getRootFolders(
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(
      readFolders({
        filter: {
          parent: { _null: true },
        },
        sort: ['name'],
      } as any)
    );
  }

  /**
   * Get child folders of a parent folder
   */
  async function getChildren(
    parentId: string,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(
      readFolders({
        filter: {
          parent: { _eq: parentId },
        },
        sort: ['name'],
      } as any)
    );
  }

  /**
   * Find a folder by name within a parent
   */
  async function findByName(
    name: string,
    parentId?: string | null,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder | null> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    const folders = await client.request(
      readFolders({
        filter: {
          name: { _eq: name },
          parent: parentId ? { _eq: parentId } : { _null: true },
        },
        limit: 1,
      } as any)
    );
    return folders?.[0] || null;
  }

  /**
   * Get folder tree structure
   */
  async function getTree(
    options?: { useStaticToken?: boolean }
  ): Promise<FolderTree[]> {
    const allFolders = await findMany({ limit: -1 }, options);

    // Build tree structure
    const folderMap = new Map<string, FolderTree>();
    const rootFolders: FolderTree[] = [];

    // First pass: create all folder nodes
    allFolders.forEach((folder) => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
      });
    });

    // Second pass: build tree
    allFolders.forEach((folder) => {
      const node = folderMap.get(folder.id)!;
      if (folder.parent) {
        const parent = folderMap.get(folder.parent);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent doesn't exist, treat as root
          rootFolders.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    // Sort children alphabetically
    const sortChildren = (folders: FolderTree[]): void => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach((f) => sortChildren(f.children));
    };
    sortChildren(rootFolders);

    return rootFolders;
  }

  /**
   * Get folder path as array of folders from root to target
   */
  async function getPath(
    folderId: string,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder[]> {
    const path: DirectusFolder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await findOne(currentId, undefined, options);
      path.unshift(folder);
      currentId = folder.parent;
    }

    return path;
  }

  /**
   * Get folder path as string (e.g., "Documents/Projects/2024")
   */
  async function getPathString(
    folderId: string,
    options?: { useStaticToken?: boolean }
  ): Promise<string> {
    const path = await getPath(folderId, options);
    return path.map((f) => f.name).join('/');
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a folder
   */
  async function update(
    id: string,
    data: Partial<DirectusFolder>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(updateFolder(id, data as any));
  }

  /**
   * Update multiple folders
   */
  async function updateMany(
    ids: string[],
    data: Partial<DirectusFolder>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(updateFolders(ids, data as any));
  }

  /**
   * Rename a folder
   */
  async function rename(
    id: string,
    newName: string,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder> {
    return await update(id, { name: newName }, options);
  }

  /**
   * Move a folder to a new parent
   */
  async function move(
    id: string,
    newParentId: string | null,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusFolder> {
    return await update(id, { parent: newParentId }, options);
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete a folder (must be empty)
   */
  async function remove(
    id: string,
    options?: { useStaticToken?: boolean }
  ): Promise<void> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    await client.request(deleteFolder(id));
  }

  /**
   * Delete multiple folders
   */
  async function removeMany(
    ids: string[],
    options?: { useStaticToken?: boolean }
  ): Promise<void> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    await client.request(deleteFolders(ids));
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Check if a folder has children
   */
  async function hasChildren(
    folderId: string,
    options?: { useStaticToken?: boolean }
  ): Promise<boolean> {
    const children = await getChildren(folderId, options);
    return children.length > 0;
  }

  /**
   * Check if a folder has files
   */
  async function hasFiles(
    folderId: string,
    options?: { useStaticToken?: boolean }
  ): Promise<boolean> {
    const { findByFolder } = useDirectusFiles();
    const files = await findByFolder(folderId, { limit: 1 }, options);
    return files.length > 0;
  }

  /**
   * Check if a folder is empty (no children or files)
   */
  async function isEmpty(
    folderId: string,
    options?: { useStaticToken?: boolean }
  ): Promise<boolean> {
    const [hasChildFolders, hasChildFiles] = await Promise.all([
      hasChildren(folderId, options),
      hasFiles(folderId, options),
    ]);
    return !hasChildFolders && !hasChildFiles;
  }

  /**
   * Flatten folder tree to array
   */
  function flattenTree(tree: FolderTree[]): DirectusFolder[] {
    const result: DirectusFolder[] = [];

    const traverse = (folders: FolderTree[]) => {
      folders.forEach((folder) => {
        result.push({
          id: folder.id,
          name: folder.name,
          parent: folder.parent,
        });
        traverse(folder.children);
      });
    };

    traverse(tree);
    return result;
  }

  return {
    // Create
    create,
    createMany,
    createPath,

    // Read
    findOne,
    findMany,
    getRootFolders,
    getChildren,
    findByName,
    getTree,
    getPath,
    getPathString,

    // Update
    update,
    updateMany,
    rename,
    move,

    // Delete
    remove,
    removeMany,

    // Utilities
    hasChildren,
    hasFiles,
    isEmpty,
    flattenTree,
  };
}
