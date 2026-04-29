export default defineEventHandler((event) => {
  const { apiBase } = useRuntimeConfig();
  const url = getRequestURL(event);
  const target = `${apiBase}${url.pathname.replace(/^\/api/, '') || '/'}${url.search}`;
  return proxyRequest(event, target, { fetch: globalThis.fetch });
});
