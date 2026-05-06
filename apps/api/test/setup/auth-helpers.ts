import type { Server } from 'node:http';
import request from 'supertest';

import type { SessionOutput } from '@spacedb/contract';

export const bearerHeader = (token: string) => ({
  authorization: `Bearer ${token}`,
});

export const extractRefreshCookie = (res: request.Response): string => {
  const setCookie = res.headers['set-cookie'] as string | string[] | undefined;
  const cookies: string[] = Array.isArray(setCookie)
    ? setCookie
    : setCookie
      ? [setCookie]
      : [];
  const refresh = cookies.find((c) => c.startsWith('spacedb_refresh='));
  if (!refresh) throw new Error('refresh cookie not set');
  return refresh.split(';')[0];
};

export interface RegisteredUser {
  session: SessionOutput;
  refreshCookie: string;
  bearer: string;
}

export async function registerUser(
  http: Server,
  input: { email: string; password: string; displayName: string },
): Promise<RegisteredUser> {
  const res = await request(http)
    .post('/auth/register')
    .send(input)
    .expect(200);
  const session = res.body as SessionOutput;
  return {
    session,
    refreshCookie: extractRefreshCookie(res),
    bearer: session.accessToken,
  };
}
