/**
 * Role-based access control middleware
 *
 * This middleware checks if the authenticated user has the required role
 * to access a specific route. It should be used after the auth middleware.
 *
 * Usage in pages:
 * definePageMeta({
 *   middleware: ['auth', 'role'],
 * });
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user } = useCustomAuth();
  const { canAccessNestedRoute, isPending, isActive, getUnauthorizedRedirect } = useRoles();

  // If no user, let auth middleware handle it
  if (!user.value) {
    return;
  }

  // Check if account is active
  if (!isActive.value) {
    return navigateTo('/auth/signin?error=account_inactive');
  }

  // Check if user is pending approval
  if (isPending.value && to.path !== '/pending' && !to.path.startsWith('/auth')) {
    return navigateTo('/pending');
  }

  // Check route access
  const accessCheck = canAccessNestedRoute(to.path);

  if (!accessCheck.hasAccess) {
    // Get appropriate redirect
    const redirect = getUnauthorizedRedirect();

    // Add error message for user feedback
    const errorQuery = accessCheck.reason
      ? `?error=unauthorized&message=${encodeURIComponent(accessCheck.reason)}`
      : '?error=unauthorized';

    return navigateTo(redirect + (redirect.includes('?') ? '&' : '') + errorQuery.slice(1));
  }
});
