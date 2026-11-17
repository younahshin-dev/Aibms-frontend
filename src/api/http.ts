// API 호출·인증 헤더·에러 처리를 이 파일 한 곳에 모은다 (소통규약 6.2).
// - 모든 호출에 Authorization: Bearer {accessToken}, RefreshAuthorization: Bearer {refreshToken} (ASIS 와 동일)
// - 401 이면 저장된 토큰을 지우고 다시 로그인한다. 토큰 갱신(refresh)은 하지 않는다
// - 에러 응답 형식: { code, message, detail: { fieldErrors, request }, traceId }

import { runtimeConfig } from '../config/runtimeConfig';
import { getAccessToken, getRefreshToken, setSession } from './session';

export interface FieldErrorItem {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly traceId?: string,
    readonly fieldErrors: FieldErrorItem[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 화면 로그 패널·콘솔에 남기는 API 호출 기록 (traceId 로 백엔드 로그와 맞춰 본다) */
export interface ApiLogEntry {
  at: string;
  method: string;
  path: string;
  status: number;
  ms: number;
  traceId?: string;
  code?: string;
  body?: unknown;
}

type ApiLogListener = (entry: ApiLogEntry) => void;
const logListeners = new Set<ApiLogListener>();

export function onApiLog(listener: ApiLogListener): () => void {
  logListeners.add(listener);
  return () => logListeners.delete(listener);
}

function emitLog(entry: ApiLogEntry) {
  const line = `[api] ${entry.method} ${entry.path} → ${entry.status} (${entry.ms}ms) traceId=${entry.traceId ?? '-'}`;
  if (entry.status >= 400) console.warn(line, entry.code ?? '', entry.body);
  else console.info(line);
  logListeners.forEach((l) => l(entry));
}

/**
 * 토큰 오류(401) 처리: 저장된 토큰을 지우고 다시 로그인한다.
 * 운영(Okta)은 Okta 로그인으로 자동 이동해 재로그인한다 — Okta 앱 등록 후 연결.
 * local·dev·stag 는 로그인 화면으로 이동한다.
 */
function sessionExpired() {
  setSession(null, 'expired');
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (refreshToken) {
    headers.set('RefreshAuthorization', `Bearer ${refreshToken}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const started = performance.now();
  const res = await fetch(url(path), { ...init, headers });
  const log = (body?: unknown, code?: string) =>
    emitLog({
      at: new Date().toLocaleTimeString(),
      method: (init.method ?? 'GET').toUpperCase(),
      path,
      status: res.status,
      ms: Math.round(performance.now() - started),
      traceId: res.headers.get('X-Request-Id') ?? undefined,
      code,
      body,
    });
  if (res.ok) {
    if (res.status === 204) {
      log();
      return undefined as T;
    }
    const data = (await res.json()) as T;
    // 인증 응답에는 토큰이 있으므로 본문을 남기지 않는다 (소통규약 12장)
    log(path.startsWith('/auth/') ? '(인증 응답 본문 생략)' : data);
    return data;
  }

  const error = await toApiError(res);
  log({ code: error.code, message: error.message, fieldErrors: error.fieldErrors }, error.code);
  if (res.status === 401 && !path.startsWith('/auth/')) {
    sessionExpired();
  }
  throw error;
}

function url(path: string): string {
  return `${runtimeConfig().apiBaseUrl}${path}`;
}

async function toApiError(res: Response): Promise<ApiError> {
  const traceId = res.headers.get('X-Request-Id') ?? undefined;
  try {
    const body = await res.json();
    return new ApiError(
      res.status,
      body.code ?? `HTTP_${res.status}`,
      body.message ?? res.statusText,
      body.traceId ?? traceId,
      body.detail?.fieldErrors ?? [],
    );
  } catch {
    return new ApiError(res.status, `HTTP_${res.status}`, res.statusText, traceId);
  }
}
