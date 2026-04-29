import { appendResponseHeader, parseCookies } from 'h3';

import type { SessionOutput } from '@spacedb/contract';

const REFRESH_COOKIE_NAME = 'spacedb_refresh';

export default defineNuxtPlugin({
  name: 'auth.init',
  dependsOn: ['orpc.server'],
  parallel: false,
  async setup(nuxtApp) {
    const event = nuxtApp.ssrContext?.event;
    if (!event) return;
    const refreshCookie = parseCookies(event)[REFRESH_COOKIE_NAME];
    if (!refreshCookie) return;

    const { apiBase } = useRuntimeConfig();
    const res = await $fetch
      .raw<SessionOutput>(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { cookie: `${REFRESH_COOKIE_NAME}=${refreshCookie}` },
      })
      .catch(() => null);
    if (!res) return;

    for (const cookie of res.headers.getSetCookie?.() ?? []) {
      appendResponseHeader(event, 'set-cookie', cookie);
    }
    if (res._data) useAuth().setSession(res._data);
  },
});
