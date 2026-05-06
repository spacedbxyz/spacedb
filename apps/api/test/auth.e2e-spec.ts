import request from 'supertest';

import {
  bearerHeader,
  extractRefreshCookie,
  registerUser,
} from './setup/auth-helpers';
import { createTestApp, type TestApp } from './setup/test-app';

describe('Auth (e2e)', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  it('register → login → me round-trip', async () => {
    const reg = await registerUser(ctx.http, {
      email: 'a@b.com',
      password: 'longenoughpw',
      displayName: 'A',
    });
    expect(reg.session.accessToken).toBeTruthy();

    const me = await request(ctx.http)
      .get('/auth/me')
      .set(bearerHeader(reg.bearer))
      .expect(200);
    expect((me.body as { id: string }).id).toBe(reg.session.user.id);
  });

  it('rejects unauthenticated /auth/me and bad credentials', async () => {
    await request(ctx.http).get('/auth/me').expect(401);

    await registerUser(ctx.http, {
      email: 'a@b.com',
      password: 'longenoughpw',
      displayName: 'A',
    });
    await request(ctx.http)
      .post('/auth/login')
      .send({ email: 'a@b.com', password: 'wrongpw1' })
      .expect(401);
  });

  it('refresh rotates tokens and reuse of an old refresh is rejected', async () => {
    const reg = await registerUser(ctx.http, {
      email: 'a@b.com',
      password: 'longenoughpw',
      displayName: 'A',
    });
    const rotated = await request(ctx.http)
      .post('/auth/refresh')
      .set('Cookie', reg.refreshCookie)
      .expect(200);
    expect(extractRefreshCookie(rotated)).not.toBe(reg.refreshCookie);

    await request(ctx.http)
      .post('/auth/refresh')
      .set('Cookie', reg.refreshCookie)
      .expect(401);
  });

  it('logout invalidates the refresh cookie', async () => {
    const reg = await registerUser(ctx.http, {
      email: 'a@b.com',
      password: 'longenoughpw',
      displayName: 'A',
    });
    await request(ctx.http)
      .post('/auth/logout')
      .set('Cookie', reg.refreshCookie)
      .expect(200);
    await request(ctx.http)
      .post('/auth/refresh')
      .set('Cookie', reg.refreshCookie)
      .expect(401);
  });
});
