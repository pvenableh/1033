/**
 * GET /api/websocket/token
 *
 * Returns a token for WebSocket authentication.
 * This keeps the static token on the server side while allowing
 * authenticated WebSocket connections from the client.
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

  // Return the static token for WebSocket authentication
  // This is safe because the endpoint is authenticated
  const config = useRuntimeConfig();

  return {
    token: config.staticToken,
  };
});
