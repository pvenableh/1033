/**
 * useDirectusFolders composable
 *
 * Folder management via server API endpoints.
 * Supports creating, reading, updating, and deleting folders.
 */

export interface DirectusFolder {
  id: string;
  name: string;
  parent: string | null;
}

export interface FolderTree extends DirectusFolder {
  children: FolderTree[];
}

export function useDirectusFolders() {
  const folders = useDirectusItems<DirectusFolder>('directus_folders');

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a new folder
   */
  const create = async (
    name: string,
    parentId?: string | null
  ): Promise<DirectusFolder> => {
    return await folders.create({
      name,
      parent: parentId || null,
    });
  };

  /**
   * Create a folder path (creates nested folders if they don't exist)
   */
  const createPath = async (path: string): Promise<DirectusFolder> => {
    const parts = path.split('/').filter(Boolean);
    let parentId: string | null = null;
    let lastFolder: DirectusFolder | null = null;

    for (const name of parts) {
      const existing = await findByName(name, parentId);

      if (existing) {
        parentId = existing.id;
        lastFolder = existing;
      } else {
        lastFolder = await create(name, parentId);
        parentId = lastFolder.id;
      }
    }

    if (!lastFolder) {
      throw new Error('Failed to create folder path');
    }

    return lastFolder;
  };

  // ==================== READ OPERATIONS ====================

  /**
   * Get a single folder by ID
   */
  const findOne = async (
    id: string,
    query?: { fields?: string[] }
  ): Promise<DirectusFolder> => {
    return await folders.get(id, query);
  };

  /**
   * Get all folders
   */
  const findMany = async (
    query?: {
      fields?: string[];
      filter?: Record<string, any>;
      sort?: string[];
      limit?: number;
    }
  ): Promise<DirectusFolder[]> => {
    return await folders.list(query);
  };

  /**
   * Get root folders (folders without parent)
   */
  const getRootFolders = async (): Promise<DirectusFolder[]> => {
    return await folders.list({
      filter: { parent: { _null: true } },
      sort: ['name'],
    });
  };

  /**
   * Get child folders of a parent folder
   */
  const getChildren = async (parentId: string): Promise<DirectusFolder[]> => {
    return await folders.list({
      filter: { parent: { _eq: parentId } },
      sort: ['name'],
    });
  };

  /**
   * Find a folder by name within a parent
   */
  const findByName = async (
    name: string,
    parentId?: string | null
  ): Promise<DirectusFolder | null> => {
    const result = await folders.list({
      filter: {
        name: { _eq: name },
        parent: parentId ? { _eq: parentId } : { _null: true },
      },
      limit: 1,
    });
    return result?.[0] || null;
  };

  /**
   * Get folder tree structure
   */
  const getTree = async (): Promise<FolderTree[]> => {
    const allFolders = await findMany({ limit: -1 });

    const folderMap = new Map<string, FolderTree>();
    const rootFolders: FolderTree[] = [];

    allFolders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    allFolders.forEach((folder) => {
      const node = folderMap.get(folder.id)!;
      if (folder.parent) {
        const parent = folderMap.get(folder.parent);
        if (parent) {
          parent.children.push(node);
        } else {
          rootFolders.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    const sortChildren = (items: FolderTree[]): void => {
      items.sort((a, b) => a.name.localeCompare(b.name));
      items.forEach((f) => sortChildren(f.children));
    };
    sortChildren(rootFolders);

    return rootFolders;
  };

  /**
   * Get folder path as array of folders from root to target
   */
  const getPath = async (folderId: string): Promise<DirectusFolder[]> => {
    const path: DirectusFolder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await findOne(currentId);
      path.unshift(folder);
      currentId = folder.parent;
    }

    return path;
  };

  /**
   * Get folder path as string
   */
  const getPathString = async (folderId: string): Promise<string> => {
    const path = await getPath(folderId);
    return path.map((f) => f.name).join('/');
  };

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a folder
   */
  const update = async (
    id: string,
    data: Partial<DirectusFolder>
  ): Promise<DirectusFolder> => {
    return await folders.update(id, data);
  };

  /**
   * Rename a folder
   */
  const rename = async (id: string, newName: string): Promise<DirectusFolder> => {
    return await update(id, { name: newName });
  };

  /**
   * Move a folder to a new parent
   */
  const move = async (
    id: string,
    newParentId: string | null
  ): Promise<DirectusFolder> => {
    return await update(id, { parent: newParentId });
  };

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete a folder (must be empty)
   */
  const remove = async (id: string): Promise<boolean> => {
    return await folders.remove(id);
  };

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Check if a folder has children
   */
  const hasChildren = async (folderId: string): Promise<boolean> => {
    const children = await getChildren(folderId);
    return children.length > 0;
  };

  /**
   * Check if a folder has files
   */
  const hasFiles = async (folderId: string): Promise<boolean> => {
    const { findByFolder } = useDirectusFiles();
    const filesList = await findByFolder(folderId, { limit: 1 });
    return filesList.length > 0;
  };

  /**
   * Check if a folder is empty
   */
  const isEmpty = async (folderId: string): Promise<boolean> => {
    const [hasChildFolders, hasChildFiles] = await Promise.all([
      hasChildren(folderId),
      hasFiles(folderId),
    ]);
    return !hasChildFolders && !hasChildFiles;
  };

  /**
   * Flatten folder tree to array
   */
  const flattenTree = (tree: FolderTree[]): DirectusFolder[] => {
    const result: DirectusFolder[] = [];

    const traverse = (items: FolderTree[]) => {
      items.forEach((folder) => {
        result.push({ id: folder.id, name: folder.name, parent: folder.parent });
        traverse(folder.children);
      });
    };

    traverse(tree);
    return result;
  };

  return {
    // Create
    create,
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
    rename,
    move,

    // Delete
    remove,

    // Utilities
    hasChildren,
    hasFiles,
    isEmpty,
    flattenTree,
  };
}
