import { runtimeConfig } from '../config/runtimeConfig';

/** local·dev·stag(그리고 prod 에서 아이디·비밀번호 로그인을 켠 경우)에는 항상 환경을 표시한다 */
export function EnvBanner() {
  const config = runtimeConfig();
  const tempLogin = config.loginMethods.includes('TEMP');
  if (config.environment === 'prod' && !tempLogin) {
    return null;
  }
  return (
    <div role="status" className="banner op">
      🟠 <b>{config.environment.toUpperCase()} 환경</b>
      {tempLogin ? ' · 임시 로그인 환경' : ''}
    </div>
  );
}
