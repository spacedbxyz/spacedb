import type { UserPublic } from '@spacedb/contract';

let inflight: Promise<boolean> | null = null;

export function useAuth() {
  const client = useNuxtApp().$client;
  const user = useState<UserPublic | null>('auth.user', () => null);
  const accessToken = useState<string | null>('auth.accessToken', () => null);

  async function login(email: string, password: string) {
    const r = await client.auth.login({ email, password });
    user.value = r.user;
    accessToken.value = r.accessToken;
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
  ) {
    const r = await client.auth.register({ email, password, displayName });
    user.value = r.user;
    accessToken.value = r.accessToken;
  }

  async function refresh(): Promise<boolean> {
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const r = await client.auth.refresh({});
        user.value = r.user;
        accessToken.value = r.accessToken;
        return true;
      } catch {
        user.value = null;
        accessToken.value = null;
        return false;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  }

  async function logout() {
    await client.auth.logout({});
    user.value = null;
    accessToken.value = null;
  }

  async function fetchMe(): Promise<boolean> {
    try {
      user.value = await client.auth.me();
      return true;
    } catch {
      return false;
    }
  }

  return { user, accessToken, login, register, refresh, logout, fetchMe };
}
