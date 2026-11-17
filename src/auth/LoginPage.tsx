import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/http';
import { isExpired } from '../api/session';
import { runtimeConfig } from '../config/runtimeConfig';
import { useAuth } from './AuthProvider';

// Okta 연결 전까지는 임시 로그인. Okta 를 붙이면 OKTA 버튼(PKCE 리다이렉트)만 추가하면 된다.
export function LoginPage() {
  const { loginTemp } = useAuth();
  const config = runtimeConfig();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginTemp(loginId, config.tempLoginPasswordRequired ? password : undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.');
    }
  };

  return (
    <main className="center">
      <div className="intro">
        <div className="ic">🗂️</div>
        <div className="eb">aibms · New MIS</div>
        <h1>사번으로 로그인</h1>
        <p className="lead">
          {config.loginMethods.includes('TEMP') ? (
            <>
              <b>사번</b>(또는 이메일형 ID)과 <b>비밀번호</b>를 입력합니다.
            </>
          ) : (
            <>Okta 로 로그인합니다.</>
          )}
        </p>
        {isExpired() && (
          <div role="status" className="banner err">
            ⚠ 사용 시간이 만료되어 다시 로그인이 필요합니다.
          </div>
        )}
        {config.loginMethods.includes('OKTA') && (
          <button type="button" className="btn" disabled title="Okta 앱 등록 후 연결" style={{ marginBottom: 12 }}>
            Okta로 로그인 <span className="tbd">Okta 앱 등록 후 연결</span>
          </button>
        )}
        {config.loginMethods.includes('TEMP') && (
          <form onSubmit={onSubmit}>
            <label className="field">
              <span>사번</span>
              <input className="inp" value={loginId} onChange={(e) => setLoginId(e.target.value)} required autoFocus />
            </label>
            {config.tempLoginPasswordRequired && (
              <label className="field">
                <span>비밀번호</span>
                <input
                  className="inp"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            )}
            {error && (
              <div role="alert" className="banner err">
                ⚠ {error}
              </div>
            )}
            <button type="submit" className="btn pri">
              로그인 →
            </button>
          </form>
        )}
        {config.environment === 'local' && (
          <div className="proc-note">
            💡 로컬 테스트 계정 <b>T00001</b>(ADMIN)·T00002·T00003, 공용 비밀번호 <b>1111</b>
            <br />
            권한 확인용: <b>T10002</b>(SYS_MNGR) · <b>T10003</b>(PMO) · <b>T10004</b>(HR_ESMT_CHRGR) · <b>T10099</b>(역할 없음) …
            T10001~T10012 역할별
          </div>
        )}
      </div>
    </main>
  );
}
