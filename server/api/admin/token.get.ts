/**
 * GET /api/admin/token
 *
 * Returns the admin token for authenticated admin users.
 * Used for admin-only operations like financial imports.
 */
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

  const config = useRuntimeConfig();

  return {
    token: config.staticToken,
    directusUrl: config.public.directusUrl,
  };
});
