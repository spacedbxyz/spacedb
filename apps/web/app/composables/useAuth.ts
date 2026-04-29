import type { UserPublic } from '@spacedb/contract';

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  accessTokenExpiresAt: number | null;
}

const REFRESH_SKEW_MS = 30_000;

let inflightRefresh: Promise<boolean> | null = null;

export function useAuth() {
  const state = useState<AuthState>('auth', () => ({
    user: null,
    accessToken: null,
    accessTokenExpiresAt: null,
  }));

  const client = () => useNuxtApp().$client;

  const isAuthenticated = computed(() => state.value.user !== null);
  const user = computed(() => state.value.user);
  const accessToken = computed(() => state.value.accessToken);

  function setSession(session: {
    user: UserPublic;
    accessToken: string;
    expiresIn: number;
  }): void {
    state.value = {
      user: session.user,
      accessToken: session.accessToken,
      accessTokenExpiresAt: Date.now() + session.expiresIn * 1000,
    };
  }

  function clearSession(): void {
    state.value = {
      user: null,
      accessToken: null,
      accessTokenExpiresAt: null,
    };
  }

  function isAccessTokenFresh(): boolean {
    const exp = state.value.accessTokenExpiresAt;
    return exp !== null && exp - Date.now() > REFRESH_SKEW_MS;
  }

  async function login(email: string, password: string): Promise<void> {
    setSession(await client().auth.login({ email, password }));
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<void> {
    setSession(await client().auth.register({ email, password, displayName }));
  }

  function refresh(): Promise<boolean> {
    if (inflightRefresh) return inflightRefresh;
    inflightRefresh = client()
      .auth.refresh({})
      .then(
        (session) => {
          setSession(session);
          return true;
        },
        () => {
          clearSession();
          return false;
        },
      )
      .finally(() => {
        inflightRefresh = null;
      });
    return inflightRefresh;
  }

  async function logout(): Promise<void> {
    await client()
      .auth.logout({})
      .catch(() => null);
    clearSession();
  }

  async function fetchMe(): Promise<boolean> {
    const me = await client()
      .auth.me()
      .catch(() => null);
    if (!me) return false;
    state.value = { ...state.value, user: me };
    return true;
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    isAccessTokenFresh,
    login,
    register,
    refresh,
    logout,
    fetchMe,
    setSession,
    clearSession,
  };
}
