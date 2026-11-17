import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginPage } from './auth/LoginPage';
import { EnvBanner } from './components/Banners';
import { MockApiDemo } from './mock/MockApiDemo';

// 껍데기: 업무 화면 자리. 지금은 목업 API 연동 확인 화면을 띄운다.
export function App() {
  return (
    <AuthProvider>
      <EnvBanner />
      <Shell />
    </AuthProvider>
  );
}

function Shell() {
  const { session, logout } = useAuth();
  if (!session) {
    return <LoginPage />;
  }
  const member = session.user.memberRef.value;
  return (
    <>
      <header className="topbar">
        <span className="brand">
          <span className="ic">📊</span>aibms · New MIS
        </span>
        <span className="sp" />
        <span className="who">
          <b>{member.name}</b> ({session.user.loginId}) · {session.displayRoles}
        </span>
        <button type="button" className="btn sm" onClick={() => void logout()}>
          로그아웃
        </button>
      </header>
      <div className="sysbar">
        <span className="badge b-esv">목업 API</span>
        <span className="tag">화면 → API → 백엔드 로그를 traceId 하나로 따라간다</span>
        <span className="legend">
          <span className="lg esv">
            <i />
            화면(프론트)
          </span>
          <span className="lg srv">
            <i />
            서버(백엔드)
          </span>
          <span className="lg ai">
            <i />
            traceId
          </span>
        </span>
      </div>
      <main className="wrap">
        <MockApiDemo />
      </main>
    </>
  );
}
