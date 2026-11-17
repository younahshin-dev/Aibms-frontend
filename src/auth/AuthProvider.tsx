import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { apiFetch } from '../api/http';
import { getSession, setSession, subscribe, type LoginResponse } from '../api/session';

interface AuthApi {
  session: LoginResponse | null;
  loginTemp: (loginId: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

// 새로고침해도 localStorage 의 토큰으로 로그인 상태가 유지된다(ASIS 와 동일). 만료되면 첫 API 호출의 401 로 다시 로그인한다.
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSession);

  const api = useMemo<AuthApi>(
    () => ({
      session,
      loginTemp: async (loginId, password) => {
        const login = await apiFetch<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ method: 'TEMP', loginId, password }),
        });
        setSession(login);
      },
      logout: async () => {
        await apiFetch<void>('/auth/logout', { method: 'POST' }).catch(() => undefined);
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다');
  }
  return ctx;
}
