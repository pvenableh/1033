/**
 * useDirectusItems - Generic CRUD composable for any Directus collection
 *
 * Collection-agnostic composable that provides list, get, create, update,
 * delete, and aggregate operations for any Directus collection.
 *
 * Usage:
 * const posts = useDirectusItems('posts')
 * const items = await posts.list({ filter: { status: { _eq: 'published' } } })
 * const item = await posts.get('item-id')
 * const newItem = await posts.create({ title: 'Hello' })
 * const updated = await posts.update('item-id', { title: 'Updated' })
 * await posts.remove('item-id')
 */

export interface ItemsQuery {
  fields?: string[];
  filter?: Record<string, any>;
  sort?: string[];
  limit?: number;
  offset?: number;
  page?: number;
  search?: string;
  deep?: Record<string, any>;
  aggregate?: Record<string, string[]>;
  groupBy?: string[];
}

/**
 * Read a singleton collection
 * Standalone function that can be used without instantiating useDirectusItems with a collection
 */
export const readSingleton = async <T = any>(
  collection: string,
  query: Pick<ItemsQuery, 'fields' | 'deep'> = {}
): Promise<T> => {
  return await $fetch('/api/directus/items', {
    method: 'POST',
    body: {
      collection,
      operation: 'singleton',
      query,
    },
  });
};

export const useDirectusItems = <T = any>(
  collection?: string,
  options: { requireAuth?: boolean } = {}
) => {
  const { requireAuth = true } = options;
  const { loggedIn } = useUserSession();

  // If no collection provided, return utility functions like readSingleton
  if (!collection) {
    return {
      readSingleton,
    };
  }

  /**
   * List items from collection
   */
  const list = async (query: ItemsQuery = {}): Promise<T[]> => {
    if (requireAuth && !loggedIn.value) {
      throw new Error('Authentication required');
    }

    const result = await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection,
        operation: 'list',
        query,
      },
    });

    return result as T[];
  };

  /**
   * Get single item by ID
   */
  const get = async (
    id: string | number,
    query: Pick<ItemsQuery, 'fields' | 'deep'> = {}
  ): Promise<T> => {
    if (requireAuth && !loggedIn.value) {
      throw new Error('Authentication required');
    }

    return await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection,
        operation: 'get',
        id,
        query,
      },
    });
  };

  /**
   * Create new item
   */
  const create = async (
    data: Partial<T>,
    query: Pick<ItemsQuery, 'fields'> = {}
  ): Promise<T> => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    return await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection,
        operation: 'create',
        data,
        query,
      },
    });
  };

  /**
   * Create multiple items
   */
  const createMany = async (
    data: Partial<T>[],
    query: Pick<ItemsQuery, 'fields'> = {}
  ): Promise<T[]> => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    return await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection,
        operation: 'create',
        data,
        query,
      },
    });
  };

  /**
   * Update existing item
   */
  const update = async (
    id: string | number,
    data: Partial<T>,
    query: Pick<ItemsQuery, 'fields'> = {}
  ): Promise<T> => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    return await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection,
        operation: 'update',
        id,
        data,
        query,
      },
    });
  };

  /**
   * Update multiple items
   */
  const updateMany = async (
    ids: (string | number)[],
    data: Partial<T>,
    query: Pick<ItemsQuery, 'fields'> = {}
  ): Promise<T[]> => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    return await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection,
        operation: 'update',
        id: ids,
        data,
        query,
      },
    });
  };

  /**
   * Delete item(s)
   */
  const remove = async (
    id: string | number | (string | number)[]
  ): Promise<boolean> => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection,
        operation: 'delete',
        id,
      },
    });

    return true;
  };

  /**
   * Aggregate data
   */
  const aggregate = async (
    query: Pick<ItemsQuery, 'aggregate' | 'groupBy' | 'filter'>
  ) => {
    if (requireAuth && !loggedIn.value) {
      throw new Error('Authentication required');
    }

    return await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection,
        operation: 'aggregate',
        query,
      },
    });
  };

  /**
   * Count items
   */
  const count = async (filter?: Record<string, any>): Promise<number> => {
    const result = await aggregate({
      aggregate: { count: ['*'] },
      filter,
    });

    return (result as any)?.[0]?.count || 0;
  };

  /**
   * Find first item matching query
   */
  const findFirst = async (
    query: ItemsQuery = {}
  ): Promise<T | null> => {
    const items = await list({ ...query, limit: 1 });
    return items?.[0] || null;
  };

  /**
   * Check if item exists
   */
  const exists = async (
    id: string | number
  ): Promise<boolean> => {
    try {
      await get(id, { fields: ['id'] });
      return true;
    } catch {
      return false;
    }
  };

  return {
    list,
    get,
    create,
    createMany,
    update,
    updateMany,
    remove,
    delete: remove, // Alias
    aggregate,
    count,
    findFirst,
    exists,
    readSingleton,
  };
};
