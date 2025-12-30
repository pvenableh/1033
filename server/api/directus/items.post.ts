/**
 * POST /api/directus/items
 *
 * Generic CRUD operations for Directus collections.
 * Requires authentication for most operations.
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
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  aggregate,
} from '~/server/utils/directus';

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
  const accessToken = session?.directusTokens?.access_token;

  // Determine which client to use
  // For now, use admin client with static token
  // In production, you might want to use user's token for permission-aware operations
  const client = useDirectusAdmin();

  try {
    switch (body.operation) {
      case 'list': {
        const query = body.query || {};
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
        const result = await client.request(
          readItem(body.collection, body.id, {
            fields: query.fields,
            deep: query.deep,
          } as any)
        );
        return result;
      }

      case 'create': {
        if (!session?.user) {
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

        // Support single or multiple items
        if (Array.isArray(body.data)) {
          const result = await client.request(
            createItems(body.collection, body.data)
          );
          return result;
        } else {
          const result = await client.request(
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

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: `Unknown operation: ${body.operation}`,
        });
    }
  } catch (error: any) {
    console.error('Directus items error:', error);

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
      message: 'Operation failed',
    });
  }
});
