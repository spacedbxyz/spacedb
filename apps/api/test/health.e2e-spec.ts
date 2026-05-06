import request from 'supertest';

import { createTestApp, type TestApp } from './setup/test-app';

describe('Health (e2e)', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('responds to ping and readiness', async () => {
    await request(ctx.http).get('/health/ping').expect(200);
    const res = await request(ctx.http).get('/health/readiness');
    expect([200, 503]).toContain(res.status);
    const body = res.body as {
      info?: Record<string, { status: string }>;
      details?: Record<string, { status: string }>;
    };
    const checks = body.info ?? body.details ?? {};
    expect(checks.database?.status).toBe('up');
  });
});
