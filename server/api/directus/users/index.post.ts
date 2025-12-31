/**
 * POST /api/directus/users
 *
 * User operations (admin only).
 * Supports: list, check-email, create, update
 */
import { useDirectusAdmin, readUsers, createUser, updateUser } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Check if user has admin access
  const isAdmin = session.user.role?.admin_access === true;
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Admin access required',
    });
  }

  const body = await readBody(event);

  if (!body.operation || typeof body.operation !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Operation is required',
    });
  }

  const client = useDirectusAdmin();

  try {
    switch (body.operation) {
      case 'list': {
        const query = body.query || {};
        const users = await client.request(
          readUsers({
            fields: query.fields || ['id', 'email', 'first_name', 'last_name', 'status', 'role'],
            filter: query.filter,
            sort: query.sort,
            limit: query.limit,
            offset: query.offset,
          } as any)
        );
        return users;
      }

      case 'check-email': {
        if (!body.email || typeof body.email !== 'string') {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Email is required',
          });
        }

        const users = await client.request(
          readUsers({
            filter: { email: { _eq: body.email } },
            fields: ['id', 'email', 'status'],
            limit: 1,
          } as any)
        );

        if (users && users.length > 0) {
          return {
            exists: true,
            user: users[0],
          };
        }

        return { exists: false };
      }

      case 'create': {
        if (!body.data) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'User data is required',
          });
        }

        const user = await client.request(createUser(body.data));
        return user;
      }

      case 'update': {
        if (!body.id) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'User ID is required',
          });
        }

        if (!body.data) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Update data is required',
          });
        }

        const updatedUser = await client.request(updateUser(body.id, body.data));
        return updatedUser;
      }

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: `Unknown operation: ${body.operation}`,
        });
    }
  } catch (error: any) {
    console.error('Users operation error:', error);

    if (error.statusCode) {
      throw error;
    }

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
