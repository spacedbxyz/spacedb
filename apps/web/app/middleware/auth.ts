export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth();
  if (auth.isAuthenticated.value) return;
  return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
});
