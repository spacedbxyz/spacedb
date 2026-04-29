export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();
  if (auth.user.value) return;
  const refreshed = await auth.refresh();
  if (refreshed) {
    await auth.fetchMe();
    if (auth.user.value) return;
  }
  return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
});
