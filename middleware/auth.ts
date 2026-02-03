export default defineNuxtRouteMiddleware(async (to: {fullPath: string | number | boolean}) => {
	const { user, loggedIn, refreshUser } = useDirectusAuth();

	// If already logged in, user is authenticated
	if (loggedIn.value && user.value) {
		// Refresh user data on protected route navigation
		// This ensures user data stays fresh and validates the session
		const refreshedUser = await refreshUser();

		// If refresh returned null, the session has expired
		if (refreshedUser === null) {
			return navigateTo(`/auth/signin?redirect=${encodeURIComponent(String(to.fullPath))}`);
		}
		return;
	}

	// Not logged in, redirect to sign-in
	return navigateTo(`/auth/signin?redirect=${encodeURIComponent(String(to.fullPath))}`);
});
