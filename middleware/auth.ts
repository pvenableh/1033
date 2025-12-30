export default defineNuxtRouteMiddleware(async (to: {fullPath: string | number | boolean}) => {
	const {user, checkAuth, fetchUser, refresh} = useCustomAuth();

	// If we already have a user, try to refresh the token
	if (user.value) {
		try {
			await refresh();
			await fetchUser();
		} catch (error) {
			// Token refresh failed, redirect to sign-in
			return navigateTo(`/auth/signin?redirect=${encodeURIComponent(String(to.fullPath))}`);
		}
	} else {
		// No user in state, try to restore session from cookies
		try {
			const isAuthed = await checkAuth();
			if (!isAuthed) {
				return navigateTo(`/auth/signin?redirect=${encodeURIComponent(String(to.fullPath))}`);
			}
		} catch (error) {
			return navigateTo(`/auth/signin?redirect=${encodeURIComponent(String(to.fullPath))}`);
		}
	}

	// Final check - redirect if still no user
	if (!user.value) {
		return navigateTo(`/auth/signin?redirect=${encodeURIComponent(String(to.fullPath))}`);
	}
});
