export default defineNuxtPlugin({
  name: 'auth.init',
  dependsOn: ['orpc.client'],
  parallel: false,
  async setup() {
    const auth = useAuth();
    if (auth.isAuthenticated.value) return;
    await auth.refresh();
  },
});
