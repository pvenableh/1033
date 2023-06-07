export default defineNuxtRouteMiddleware(async (to, _from) => {
  const user = useDirectusUser()
  const { token } = useDirectusToken();
  const { fetchUser } = useDirectusAuth()

  if (!user.value && !token.value) {
    return navigateTo('/')
  }

  await fetchUser()
})
