/**
 * useDirectusCrud composable
 *
 * Custom CRUD operations composable using @directus/sdk directly.
 * Provides type-safe operations for Directus collections.
 */
import {
  createDirectus,
  rest,
  staticToken,
  createItem,
  createItems,
  readItem,
  readItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  aggregate,
  type DirectusClient,
  type RestClient,
  type StaticTokenClient,
  type Query,
} from '@directus/sdk';

// Client instance with static token (for server-side or public operations)
let staticClient: DirectusClient<any> & RestClient<any> & StaticTokenClient<any> | null = null;

// Client instance with user auth (for user-specific operations)
let authClient: DirectusClient<any> & RestClient<any> | null = null;

export function useDirectusCrud() {
  const config = useRuntimeConfig();
  const { getClient: getAuthClient, getAccessToken } = useCustomAuth();

  /**
   * Get the static token client (for server operations)
   */
  function getStaticClient() {
    if (!staticClient) {
      const url = config.public.directusUrl || config.public.adminUrl;
      const token = config.public.staticToken;

      staticClient = createDirectus(url)
        .with(rest())
        .with(staticToken(token));
    }
    return staticClient;
  }

  /**
   * Get the authenticated client (uses current user's token)
   */
  function getUserClient() {
    return getAuthClient();
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a single item in a collection
   */
  async function create<T = any>(
    collection: string,
    data: Partial<T>,
    options?: { useStaticToken?: boolean }
  ): Promise<T> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(createItem(collection, data as any));
  }

  /**
   * Create multiple items in a collection
   */
  async function createMany<T = any>(
    collection: string,
    data: Partial<T>[],
    options?: { useStaticToken?: boolean }
  ): Promise<T[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(createItems(collection, data as any[]));
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Read a single item by ID
   */
  async function findOne<T = any>(
    collection: string,
    id: string | number,
    query?: Query<any, T>,
    options?: { useStaticToken?: boolean }
  ): Promise<T> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(readItem(collection, id, query as any));
  }

  /**
   * Read multiple items from a collection
   */
  async function findMany<T = any>(
    collection: string,
    query?: Query<any, T>,
    options?: { useStaticToken?: boolean }
  ): Promise<T[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(readItems(collection, query as any));
  }

  /**
   * Find first item matching a filter
   */
  async function findFirst<T = any>(
    collection: string,
    query?: Query<any, T>,
    options?: { useStaticToken?: boolean }
  ): Promise<T | null> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    const items = await client.request(
      readItems(collection, { ...query, limit: 1 } as any)
    );
    return items?.[0] || null;
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a single item by ID
   */
  async function update<T = any>(
    collection: string,
    id: string | number,
    data: Partial<T>,
    options?: { useStaticToken?: boolean }
  ): Promise<T> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(updateItem(collection, id, data as any));
  }

  /**
   * Update multiple items matching a filter
   */
  async function updateMany<T = any>(
    collection: string,
    ids: (string | number)[],
    data: Partial<T>,
    options?: { useStaticToken?: boolean }
  ): Promise<T[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(updateItems(collection, ids, data as any));
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete a single item by ID
   */
  async function remove(
    collection: string,
    id: string | number,
    options?: { useStaticToken?: boolean }
  ): Promise<void> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    await client.request(deleteItem(collection, id));
  }

  /**
   * Delete multiple items by IDs
   */
  async function removeMany(
    collection: string,
    ids: (string | number)[],
    options?: { useStaticToken?: boolean }
  ): Promise<void> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    await client.request(deleteItems(collection, ids));
  }

  // ==================== AGGREGATE OPERATIONS ====================

  /**
   * Count items in a collection
   */
  async function count(
    collection: string,
    query?: { filter?: Record<string, any> },
    options?: { useStaticToken?: boolean }
  ): Promise<number> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    const result = await client.request(
      aggregate(collection, {
        aggregate: { count: '*' },
        query: query as any,
      })
    );
    return parseInt(result?.[0]?.count || '0', 10);
  }

  /**
   * Aggregate data from a collection
   */
  async function aggregateData<T = any>(
    collection: string,
    aggregateOptions: {
      aggregate: Record<string, string>;
      groupBy?: string[];
      query?: Query<any, T>;
    },
    options?: { useStaticToken?: boolean }
  ): Promise<any[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(aggregate(collection, aggregateOptions as any));
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Build a filter object for common operations
   */
  function buildFilter(conditions: Record<string, any>): Record<string, any> {
    const filter: Record<string, any> = {};

    for (const [key, value] of Object.entries(conditions)) {
      if (value === null) {
        filter[key] = { _null: true };
      } else if (value === undefined) {
        continue;
      } else if (Array.isArray(value)) {
        filter[key] = { _in: value };
      } else if (typeof value === 'object') {
        filter[key] = value;
      } else {
        filter[key] = { _eq: value };
      }
    }

    return filter;
  }

  /**
   * Get the Directus assets URL for a file
   */
  function getAssetUrl(fileId: string, transforms?: Record<string, any>): string {
    const baseUrl = config.public.assetsUrl || `${config.public.directusUrl}/assets/`;
    let url = `${baseUrl}${fileId}`;

    if (transforms) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(transforms)) {
        params.append(key, String(value));
      }
      url += `?${params.toString()}`;
    }

    return url;
  }

  return {
    // Clients
    getStaticClient,
    getUserClient,

    // CRUD Operations
    create,
    createMany,
    findOne,
    findMany,
    findFirst,
    update,
    updateMany,
    remove,
    removeMany,

    // Aggregates
    count,
    aggregateData,

    // Utilities
    buildFilter,
    getAssetUrl,
  };
}
