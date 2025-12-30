export default defineNuxtRouteMiddleware(async (to: {fullPath: string | number | boolean}) => {
	const { user, loggedIn, refreshUser } = useDirectusAuth();

	// If already logged in, user is authenticated
	if (loggedIn.value && user.value) {
		// Optionally refresh user data on each protected route navigation
		// This ensures user data stays fresh
		try {
			await refreshUser();
		} catch (error) {
			// If refresh fails, user might have an invalid session
			console.warn('Failed to refresh user data:', error);
			// Continue anyway - the session might still be valid
		}
		return;
	}

	// Not logged in, redirect to sign-in
	return navigateTo(`/auth/signin?redirect=${encodeURIComponent(String(to.fullPath))}`);
});
