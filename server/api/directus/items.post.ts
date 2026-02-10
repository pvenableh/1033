/**
 * POST /api/directus/items
 *
 * Generic CRUD operations for Directus collections.
 * Uses getUserDirectus() for authenticated operations with automatic token refresh.
 *
 * Request body:
 * {
 *   collection: string,
 *   operation: 'list' | 'get' | 'create' | 'update' | 'delete' | 'aggregate',
 *   id?: string | number | (string | number)[],
 *   data?: object,
 *   query?: ItemsQuery
 * }
 */
import {
  useDirectusAdmin,
  getUserDirectus,
  getPublicDirectus,
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  aggregate,
  readNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
} from '~/server/utils/directus';
import { readSingleton, readNotification } from '@directus/sdk';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate required fields
  if (!body.collection || typeof body.collection !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Collection is required',
    });
  }

  if (!body.operation || typeof body.operation !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Operation is required',
    });
  }

  // Get session for authenticated requests
  const session = await getUserSession(event);

  // Determine which client to use based on operation and authentication
  // Read operations can use admin client for public data
  // Write operations require user authentication for permission-aware operations
  // System collections (directus_*) require user's client for proper context
  const isWriteOperation = ['create', 'update', 'delete'].includes(body.operation);
  const isReadOperation = ['list', 'get', 'aggregate', 'singleton'].includes(body.operation);
  const isSystemCollection = body.collection?.startsWith('directus_');
  const isPublicRequest = body.public === true;

  let client;
  let usedUserClient = false;
  if (isPublicRequest && isReadOperation && !isSystemCollection) {
    // Use public client (no authentication) for explicitly public read requests
    // This allows reading data from collections with public read permissions
    client = getPublicDirectus();
  } else if ((isWriteOperation || isSystemCollection) && session?.user) {
    // Use user's authenticated client for write operations and system collections (with auto token refresh)
    try {
      client = await getUserDirectus(event);
      usedUserClient = true;
    } catch (error: any) {
      // Don't fall back to admin - propagate auth errors properly
      if (error.statusCode === 401) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: 'Session expired. Please log in again.',
        });
      }
      throw error;
    }
  } else if (isSystemCollection && !session?.user) {
    // System collections require authentication
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required for system collections',
    });
  } else {
    // Use admin client for read operations on regular collections
    client = useDirectusAdmin();
  }

  // Check if this is the notifications collection (requires special SDK methods)
  const isNotificationsCollection = body.collection === 'directus_notifications';

  // Retry loop: if the Directus API returns 401 (token expired on the remote
  // side but not yet detected locally), refresh the token and retry once.
  for (let attempt = 0; attempt < 2; attempt++) {
  try {
    switch (body.operation) {
      case 'list': {
        const query = body.query || {};

        // Use readNotifications for directus_notifications collection
        if (isNotificationsCollection) {
          const result = await client.request(
            readNotifications({
              fields: query.fields,
              filter: query.filter,
              sort: query.sort,
              limit: query.limit,
              offset: query.offset,
              page: query.page,
              search: query.search,
              deep: query.deep,
            } as any)
          );
          return result;
        }

        const result = await client.request(
          readItems(body.collection, {
            fields: query.fields,
            filter: query.filter,
            sort: query.sort,
            limit: query.limit,
            offset: query.offset,
            page: query.page,
            search: query.search,
            deep: query.deep,
          } as any)
        );
        return result;
      }

      case 'get': {
        if (!body.id) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'ID is required for get operation',
          });
        }

        const query = body.query || {};

        // Use readNotification for directus_notifications collection
        if (isNotificationsCollection) {
          const result = await client.request(
            readNotification(body.id, {
              fields: query.fields,
              deep: query.deep,
            } as any)
          );
          return result;
        }

        const result = await client.request(
          readItem(body.collection, body.id, {
            fields: query.fields,
            deep: query.deep,
          } as any)
        );
        return result;
      }

      case 'create': {
        // Collections that allow public (unauthenticated) submissions
        const publicCollections = ['requests'];
        const isPublicSubmission = body.public === true && publicCollections.includes(body.collection);

        if (!session?.user && !isPublicSubmission) {
          throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Authentication required',
          });
        }

        if (!body.data) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Data is required for create operation',
          });
        }

        // Use admin client for public submissions
        const createClient = isPublicSubmission ? useDirectusAdmin() : client;

        // Use createNotification for directus_notifications collection
        if (isNotificationsCollection) {
          // Notifications don't support bulk create with createNotification
          if (Array.isArray(body.data)) {
            const results = [];
            for (const item of body.data) {
              const result = await createClient.request(createNotification(item));
              results.push(result);
            }
            return results;
          } else {
            const result = await createClient.request(createNotification(body.data));
            return result;
          }
        }

        // Support single or multiple items
        if (Array.isArray(body.data)) {
          const result = await createClient.request(
            createItems(body.collection, body.data)
          );
          return result;
        } else {
          const result = await createClient.request(
            createItem(body.collection, body.data)
          );
          return result;
        }
      }

      case 'update': {
        if (!session?.user) {
          throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Authentication required',
          });
        }

        if (!body.id) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'ID is required for update operation',
          });
        }

        if (!body.data) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Data is required for update operation',
          });
        }

        // Use updateNotification for directus_notifications collection
        if (isNotificationsCollection) {
          // Notifications don't support bulk update with updateNotification
          if (Array.isArray(body.id)) {
            const results = [];
            for (const id of body.id) {
              const result = await client.request(updateNotification(id, body.data));
              results.push(result);
            }
            return results;
          } else {
            const result = await client.request(updateNotification(body.id, body.data));
            return result;
          }
        }

        // Support single or multiple items
        if (Array.isArray(body.id)) {
          const result = await client.request(
            updateItems(body.collection, body.id, body.data)
          );
          return result;
        } else {
          const result = await client.request(
            updateItem(body.collection, body.id, body.data)
          );
          return result;
        }
      }

      case 'delete': {
        if (!session?.user) {
          throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Authentication required',
          });
        }

        if (!body.id) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'ID is required for delete operation',
          });
        }

        // Use deleteNotification for directus_notifications collection
        if (isNotificationsCollection) {
          // Notifications don't support bulk delete with deleteNotification
          if (Array.isArray(body.id)) {
            for (const id of body.id) {
              await client.request(deleteNotification(id));
            }
          } else {
            await client.request(deleteNotification(body.id));
          }
          return { success: true };
        }

        // Support single or multiple items
        if (Array.isArray(body.id)) {
          await client.request(deleteItems(body.collection, body.id));
        } else {
          await client.request(deleteItem(body.collection, body.id));
        }

        return { success: true };
      }

      case 'aggregate': {
        const query = body.query || {};

        if (!query.aggregate) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Aggregate query is required',
          });
        }

        const result = await client.request(
          aggregate(body.collection, {
            aggregate: query.aggregate,
            groupBy: query.groupBy,
            query: {
              filter: query.filter,
            },
          } as any)
        );
        return result;
      }

      case 'singleton': {
        const query = body.query || {};
        const result = await client.request(
          readSingleton(body.collection, {
            fields: query.fields,
            deep: query.deep,
          } as any)
        );
        return result;
      }

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: `Unknown operation: ${body.operation}`,
        });
    }
  } catch (error: any) {
    // On first attempt, if we got a 401 from Directus and used the user's
    // client, retry with a force-refreshed token before giving up.
    const is401 = error?.errors?.[0]?.message?.includes('Token expired') ||
                  error?.message?.includes('Token expired') ||
                  error?.response?.status === 401 ||
                  (error?.errors?.[0]?.extensions?.code === 'TOKEN_EXPIRED');

    if (attempt === 0 && is401 && usedUserClient && session?.user) {
      try {
        client = await getUserDirectus(event, true); // force refresh
        continue; // retry the operation
      } catch {
        // Refresh failed — fall through to normal error handling
      }
    }

    console.error('Directus items error:', error);

    // Re-throw if already a proper error
    if (error.statusCode) {
      throw error;
    }

    // Handle token expiration errors
    if (is401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Token expired.',
      });
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
      message: 'Operation failed',
    });
  }
  } // end retry loop
});
