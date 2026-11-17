// 토큰 보관 규칙 (소통규약 6.2, ASIS 와 동일):
// 로그인 응답 전체(accessToken·refreshToken 포함)를 localStorage 한 키에 저장한다.
// 토큰이 만료되면 갱신하지 않고 다시 로그인한다.

/** localStorage 키. aibms 의 키 이름은 협의 후 정한다 (ASIS 는 skcc-mis-user) */
export const STORAGE_KEY = 'aibms-login';

export interface Member {
  id: number;
  employeeNo: string;
  name: string;
  email?: string;
  orgCode?: string;
}

/** 로그인 응답 (ASIS LoginResDto 형식). 권한 정보는 TOBE 권한 체계 확정 후 바뀔 수 있다 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  displayRoles: string;
  user: { loginId: string; memberRef: { ref: number; value: Member } };
  userRoleMaps: { role: { ref?: number; identity: string; value: { name: string } } }[];
  /** 역할로 받은 권한 코드 (가안, ASIS 응답에는 없음). 옛 로그인 정보에는 없을 수 있다 */
  permissions?: string[];
  rolePermissionMaps: { menuPermissions: unknown[]; pagePermissions: unknown[]; tabPermissions: unknown[] };
  mode: 'ON' | 'OFF';
}

type Listener = () => void;

const listeners = new Set<Listener>();
let current: LoginResponse | null = read();
/** 토큰 오류로 로그아웃된 경우 로그인 화면에 안내 문구를 띄운다 */
let expired = false;

function read(): LoginResponse | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoginResponse) : null;
  } catch {
    return null;
  }
}

export function getSession(): LoginResponse | null {
  return current;
}

export function getAccessToken(): string | null {
  return current?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return current?.refreshToken ?? null;
}

// ───────────── 화면 권한 체크 (버튼 표시·활성용)
// 로그인 응답에 저장된 값으로만 판단한다. 실제 차단은 서버(@PreAuthorize)가 한다 — 화면을 우회해 API 를 불러도 403.
// ASIS 의 isExistUserRoleMap(identity) (mixins/index.ts:319-348) 에 해당한다.

/** 권한 코드 보유 여부 (예: hasPermission('CLS_FORCE')) */
export function hasPermission(code: string): boolean {
  return current?.permissions?.includes(code) ?? false;
}

/** 역할 보유 여부 (예: hasRole('SYS_MNGR')). 버튼 판단은 역할보다 권한 코드를 쓴다 */
export function hasRole(identity: string): boolean {
  return current?.userRoleMaps?.some((m) => m.role.identity === identity) ?? false;
}

export function isExpired(): boolean {
  return expired;
}

export function setSession(login: LoginResponse | null, reason?: 'expired'): void {
  current = login;
  expired = reason === 'expired';
  try {
    if (login) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(login));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 메모리 값만 쓴다
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
