// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  devServer: {
    host: process.env.WEB_HOST || '0.0.0.0',
    port: Number(process.env.WEB_PORT) || 3001,
  },
  runtimeConfig: {
    apiBase: process.env.WEB_API_BASE || 'http://localhost:3000',
  },
  vite: {
    optimizeDeps: {
      include: [
        '@orpc/client',
        '@orpc/openapi-client/fetch',
        '@orpc/contract',
        'zod',
      ],
    },
  },
  eslint: {
    config: {
      stylistic: false,
    },
  },
});
