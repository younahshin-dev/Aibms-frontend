// 이력 시험 화면 (local·dev·stag). 동작을 일으키고 DB 에 쌓인 이력을 바로 확인한다.
// 조회는 관리자(ADMIN)만 된다. 운영에는 이력 시험 API 가 없다.

import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiFetch } from '../api/http';
import { hasRole } from '../api/session';
import { recordMenuAccess } from './menuAccess';

type Row = Record<string, string | number | null>;

interface Recent {
  audits: Row[];
  menus: Row[];
  apis: Row[];
}

const MENUS = [
  { path: '/projects/list', label: '프로젝트 목록' },
  { path: '/budgets/total', label: '실행예산 총괄' },
  { path: '/admin/users', label: '사용자 관리' },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function HistoryTest() {
  const [recent, setRecent] = useState<Recent>({ audits: [], menus: [], apis: [] });
  const [menu, setMenu] = useState<string | null>(null);
  const [message, setMessage] = useState('버튼을 누르면 아래 표에 이력이 추가됩니다.');
  const [busy, setBusy] = useState(false);
  const admin = hasRole('ADMIN');

  const refresh = useCallback(async () => {
    if (!admin) return;
    try {
      setRecent(await apiFetch<Recent>('/api/v1/common/history-test'));
    } catch (e) {
      setMessage(e instanceof ApiError ? `이력 조회 실패: ${e.code} ${e.message}` : '이력 조회 실패');
    }
  }, [admin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      setMessage(`${label}: 성공`);
    } catch (e) {
      setMessage(`${label}: ${e instanceof ApiError ? `${e.status} ${e.code}` : '실패'}`);
    }
    // API 호출 이력은 서버가 응답 뒤에 따로 저장하므로 잠깐 기다린다
    await wait(400);
    await refresh();
    setBusy(false);
  };

  return (
    <>
      <section className="card">
        <h2 className="sec">1. 메뉴 접속 (menu_access_history)</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MENUS.map((m) => (
            <button
              key={m.path}
              type="button"
              className={menu === m.path ? 'btn pri' : 'btn'}
              disabled={busy}
              onClick={() => {
                setMenu(m.path);
                void run(`메뉴 ${m.label}`, () => recordMenuAccess(m.path));
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sec">2. API 호출 (api_access_history)</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => void run('조회', () => apiFetch('/api/v1/project/projects?page=0'))}
          >
            조회 (WRITE 설정이면 안 남음)
          </button>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() =>
              void run('프로젝트 등록', () =>
                apiFetch('/api/v1/project/projects', {
                  method: 'POST',
                  body: JSON.stringify({ name: '이력 시험', contractAmount: 1000 }),
                }),
              )
            }
          >
            등록 (남음)
          </button>
          <button
            type="button"
            className="btn warn"
            disabled={busy}
            onClick={() =>
              void run('잘못된 등록', () =>
                apiFetch('/api/v1/project/projects', { method: 'POST', body: JSON.stringify({}) }),
              )
            }
          >
            잘못된 등록 (400 으로 남음)
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="sec">3. 로그인 (audit_log)</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn warn"
            disabled={busy}
            onClick={() =>
              void run('틀린 비밀번호 로그인', () =>
                apiFetch('/auth/login', {
                  method: 'POST',
                  body: JSON.stringify({ method: 'TEMP', loginId: 'T00001', password: 'wrong' }),
                }),
              )
            }
          >
            틀린 비밀번호로 로그인 시도
          </button>
          <button
            type="button"
            className="btn warn"
            disabled={busy}
            onClick={() =>
              void run('없는 사번 로그인', () =>
                apiFetch('/auth/login', {
                  method: 'POST',
                  body: JSON.stringify({ method: 'TEMP', loginId: 'NO_USER', password: 'x' }),
                }),
              )
            }
          >
            없는 사번으로 로그인 시도
          </button>
          <span className="tag">로그인·로그아웃은 오른쪽 위 로그아웃 후 다시 로그인하면 남습니다</span>
        </div>
      </section>

      <p role="status" className="proc-note">
        {message}
      </p>
      {!admin && <p className="banner err">이력 조회는 관리자(T00001)로 로그인해야 합니다. 이력은 지금 계정으로도 쌓입니다.</p>}
      <button type="button" className="btn sm" disabled={busy || !admin} onClick={() => void refresh()}>
        새로고침
      </button>

      <Table title="로그인 · 권한 이력" rows={recent.audits} columns={['id', 'at', 'event', 'actor', 'reason', 'ip', 'detail']} />
      <Table title="메뉴 접속 이력" rows={recent.menus} columns={['id', 'at', 'actor', 'path', 'ip']} />
      <Table title="API 호출 이력" rows={recent.apis} columns={['id', 'at', 'actor', 'method', 'path', 'status', 'ms', 'ip']} />
    </>
  );
}

const LABELS: Record<string, string> = {
  id: 'No',
  at: '일시',
  event: '구분',
  actor: '사번',
  reason: '실패 사유',
  ip: 'IP',
  detail: '내용',
  path: '경로',
  method: '메서드',
  status: '결과',
  ms: 'ms',
};

function Table({ title, rows, columns }: { title: string; rows: Row[]; columns: string[] }) {
  return (
    <section className="card" style={{ marginTop: 14, overflowX: 'auto' }}>
      <h2 className="sec">
        {title} <small>최근 {rows.length}건</small>
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid var(--line)' }}>
                {LABELS[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)}>
              {columns.map((c) => (
                <td key={c} style={{ padding: 6, borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
                  {r[c] ?? ''}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: 6 }}>
                이력이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
