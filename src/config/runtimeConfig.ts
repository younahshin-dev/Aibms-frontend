// 환경값은 빌드 시점이 아니라 컨테이너 기동 시 주입되는 /config.json 에서 읽는다.
// (이미지 한 번 빌드 → dev·stag·prod 에 같은 이미지 배포. 환경별 빌드 금지)

export type Environment = 'local' | 'dev' | 'stag' | 'prod';
export type LoginMethod = 'TEMP' | 'OKTA';

export interface RuntimeConfig {
  /** 같은 도메인 경로 분리라 보통 빈 값 */
  apiBaseUrl: string;
  environment: Environment;
  loginMethods: LoginMethod[];
  tempLoginPasswordRequired: boolean;
  okta: { issuer: string; clientId: string; redirectUri: string };
}

let config: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const res = await fetch('/config.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`config.json 을 읽지 못했습니다 (HTTP ${res.status})`);
  }
  config = (await res.json()) as RuntimeConfig;
  return config;
}

export function runtimeConfig(): RuntimeConfig {
  if (!config) {
    throw new Error('runtime config 가 아직 로드되지 않았습니다');
  }
  return config;
}
