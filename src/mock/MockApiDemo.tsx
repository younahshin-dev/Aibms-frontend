// 목업 API(/api/v1/project/projects) 연동 확인 화면.
// 버튼마다 소통규약 7·8장의 응답 형식(목록·단건·400·404·409·422·500)을 하나씩 일으키고,
// 오른쪽 로그 패널에 호출 기록과 traceId 를 남긴다. 같은 traceId 로 백엔드 로그를 찾을 수 있다.

import { useEffect, useState } from 'react';
import { ApiError, apiFetch, onApiLog, type ApiLogEntry } from '../api/http';
import { getSession, hasPermission } from '../api/session';

/** GET /auth/me 응답: 서버가 토큰에서 읽은 값 */
interface Me {
  employeeNo: string;
  roles: string[];
  permissions: string[];
}

interface Project {
  id: number;
  projectCode: string;
  name: string;
  status: string;
  startDate: string;
  contractAmount: number;
  exchangeRate: string;
  version: number;
  updatedAt: string;
}

/** 목록 응답 (소통규약 7.2, ASIS 형식): _embedded 아래 리소스 이름 키 + page */
interface ProjectPage {
  _embedded: { projects: Project[] };
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

const BASE = '/api/v1/project/projects';
const STATUS: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS: { label: '수행중', cls: 'b-ok' },
  CLOSED: { label: '종료', cls: 'b-wait' },
};

export function MockApiDemo() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string; traceId?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  // 화면 권한 체크: 로그인 응답의 permissions 로 버튼을 막는다 (서버 검사와 별개)
  const canForceClose = hasPermission('CLS_FORCE');
  const myPermissions = getSession()?.permissions ?? [];

  useEffect(() => onApiLog((e) => setLogs((prev) => [e, ...prev].slice(0, 50))), []);
  useEffect(() => {
    void load();
  }, []);

  async function run(action: () => Promise<void>, okText?: string) {
    setNotice(null);
    setFieldErrors({});
    try {
      await action();
      if (okText) setNotice({ kind: 'ok', text: okText });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      // 소통규약 7.4: 화면 문구는 message 우선, 500 은 traceId 도 함께
      setNotice({ kind: 'err', text: `${e.status} ${e.code} — ${e.message}`, traceId: e.status >= 500 ? e.traceId : undefined });
      setFieldErrors(Object.fromEntries(e.fieldErrors.map((f) => [f.field, f.message])));
    }
  }

  const load = () => run(refreshList);

  const select = (id: number) =>
    run(async () => {
      const p = await apiFetch<Project>(`${BASE}/${id}`);
      setSelected(p);
      setName(p.name);
      setAmount(String(p.contractAmount));
    });

  const save = (version: number, label: string) =>
    run(async () => {
      if (!selected) return;
      const p = await apiFetch<Project>(`${BASE}/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, contractAmount: amount === '' ? null : Number(amount), version }),
      });
      setSelected(p);
      await refreshList();
    }, label);

  const close = () =>
    run(async () => {
      if (!selected) return;
      const p = await apiFetch<Project>(`${BASE}/${selected.id}/close`, { method: 'POST' });
      setSelected(p);
      await refreshList();
    }, '종료했습니다.');

  /** 서버가 보는 내 권한 (토큰 클레임) — 화면이 저장한 값과 비교 */
  const loadMe = () => run(async () => setMe(await apiFetch<Me>('/auth/me')));

  async function refreshList() {
    const res = await apiFetch<ProjectPage>(`${BASE}?page=0&size=20`);
    setProjects(res._embedded?.projects ?? []);
    setTotal(res.page.totalElements);
  }

  return (
    <>
      <div className="eb">MOCK API · 소통규약 7·8장</div>
      <h1 className="scr-title">목업 API로 화면 연동을 확인합니다</h1>
      <p className="scr-sub">
        버튼마다 <b>정상·400·404·409·422·500</b> 응답을 하나씩 일으키고, 오른쪽 로그에 <b>traceId</b> 를 남깁니다.
      </p>

      <div className="card">
        <div className="flowd">
          <div className="fn">
            <b>화면 버튼</b>
            <span>apiFetch 공통 모듈</span>
          </div>
          <div className="fa">→</div>
          <div className="fn">
            <b>nginx</b>
            <span>/api · /auth 프록시</span>
          </div>
          <div className="fa">→</div>
          <div className="fn srv">
            <b>백엔드</b>
            <span>MockProjectController</span>
          </div>
          <div className="fa">→</div>
          <div className="fn ai">
            <b>응답 + X-Request-Id</b>
            <span>화면 로그 · 서버 로그 같은 값</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="sec">
          ⓪ 내 권한 <small>화면: 로그인 응답(localStorage) · 서버: GET /auth/me (토큰)</small>
        </div>
        <div className="proc-note" style={{ marginTop: 0 }}>
          🖥 화면이 가진 권한 코드 ({myPermissions.length}개):{' '}
          {myPermissions.length === 0 ? <b>없음</b> : myPermissions.map((p) => <span key={p} className="badge b-esv">{p}</span>)}
        </div>
        <div className="btns" style={{ margin: '10px 0' }}>
          <button className="btn sm" onClick={() => void loadMe()}>
            서버가 보는 내 권한 조회 (GET /auth/me)
          </button>
        </div>
        {me && (
          <div className="proc-note">
            🗄 서버: {me.employeeNo} · 역할 {me.roles.join(', ') || '없음'} · 권한{' '}
            {me.permissions.length === 0 ? <b>없음</b> : me.permissions.map((p) => <span key={p} className="badge b-ok">{p}</span>)}
          </div>
        )}
      </div>

      <div className="g2">
        <div>
          <div className="card">
            <div className="sec">
              ① 프로젝트 목록 <small>목업 데이터 · 전체 {total}건 · 줄을 누르면 상세 조회</small>
            </div>
            <div className="btns" style={{ marginBottom: 10 }}>
              <button className="btn sm" onClick={() => void load()}>
                ↻ 목록 다시 조회
              </button>
              <button className="btn sm" onClick={() => void select(9999)}>
                없는 ID 조회 <span className="badge b-err">404</span>
              </button>
              <button
                className="btn sm"
                onClick={() => void run(() => apiFetch<void>('/api/v1/project/mock/error', { method: 'POST' }))}
              >
                서버 오류 <span className="badge b-err">500</span>
              </button>
            </div>
            <table className="t">
              <thead>
                <tr>
                  <th>코드</th>
                  <th>프로젝트명</th>
                  <th>상태</th>
                  <th className="num">계약금액</th>
                  <th>ver</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} onClick={() => void select(p.id)} className={selected?.id === p.id ? 'on' : undefined}>
                    <td className="mono">{p.projectCode}</td>
                    <td className="pname">{p.name}</td>
                    <td>
                      <span className={`badge ${STATUS[p.status]?.cls ?? 'b-wait'}`}>{STATUS[p.status]?.label ?? p.status}</span>
                    </td>
                    <td className="num">{p.contractAmount.toLocaleString()}</td>
                    <td>{p.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="card">
              <div className="sec">
                ② 상세 · 수정 <small>
                  {selected.projectCode} · version {selected.version} · 환율 {selected.exchangeRate}(문자열)
                </small>
              </div>
              <label className="field">
                <span>프로젝트명</span>
                <input className={`inp${fieldErrors.name ? ' bad' : ''}`} value={name} onChange={(e) => setName(e.target.value)} />
                {fieldErrors.name && <span className="ferr">{fieldErrors.name}</span>}
              </label>
              <label className="field">
                <span>계약금액 (원화 정수 = 숫자)</span>
                <input
                  className={`inp${fieldErrors.contractAmount ? ' bad' : ''}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {fieldErrors.contractAmount && <span className="ferr">{fieldErrors.contractAmount}</span>}
              </label>
              <div className="btns">
                <button className="btn esv" onClick={() => void save(selected.version, '저장했습니다.')}>
                  💾 저장 (PUT)
                </button>
                <button className="btn" onClick={() => void save(selected.version - 1, '')}>
                  옛 version 으로 저장 <span className="badge b-err">409</span>
                </button>
                <button
                  className="btn"
                  disabled={!canForceClose}
                  title={canForceClose ? undefined : '강제종료 권한(CLS_FORCE)이 없습니다'}
                  onClick={() => void close()}
                >
                  종료 (POST …/close) <span className="badge b-err">이미 종료면 422</span>
                </button>
                {!canForceClose && (
                  <button className="btn" onClick={() => void close()}>
                    권한 없이 종료 호출 <span className="badge b-err">서버 403</span>
                  </button>
                )}
              </div>
              <div className="proc-note">
                🔐 종료 = 강제종료 권한 <b>CLS_FORCE</b> (가안: SYS_MNGR·PMO·ADMIN).{' '}
                {canForceClose
                  ? '권한이 있어 버튼이 켜져 있습니다.'
                  : '화면은 버튼을 막았고, 옆 버튼으로 API 를 직접 부르면 서버가 403 ACCESS_DENIED 로 막습니다.'}
              </div>
              <div className="proc-note">
                💡 이름을 비우거나 금액을 음수로 저장하면 <b>400 VALIDATION_ERROR</b> — 오류가 해당 칸 아래에 표시됩니다(규약 7.4).
              </div>
            </div>
          )}

          {notice && (
            <div role="status" className={`banner ${notice.kind}`}>
              {notice.kind === 'ok' ? '✅' : '⚠'} {notice.text}
              {notice.traceId && <span className="badge b-ai">traceId {notice.traceId}</span>}
            </div>
          )}
        </div>

        <div className="card">
          <div className="sec">
            ③ API 호출 로그 <small>최근 50건 · 누르면 응답 본문</small>
          </div>
          <div className="proc-note" style={{ marginTop: 0, marginBottom: 10 }}>
            🧾 백엔드에서 같은 요청 찾기: <code>docker compose logs backend | findstr &lt;traceId&gt;</code>
          </div>
          <div className="log">
            {logs.length === 0 && <div className="empty">아직 호출 기록이 없습니다.</div>}
            {logs.map((l, i) => (
              <div key={i} className={`log-item ${l.status >= 400 ? 'err' : 'ok'}`} onClick={() => setOpen(open === i ? null : i)}>
                <div className="log-top">
                  <span className="at">{l.at}</span>
                  <span className={`badge ${l.status >= 400 ? 'b-err' : 'b-ok'}`}>{l.status}</span>
                  <span className="badge b-esv">{l.method}</span>
                  <span className="path">{l.path}</span>
                  <span className="ms">{l.ms}ms</span>
                </div>
                <div className="log-trace">
                  traceId={l.traceId ?? '-'} {l.code && <span className="badge b-err">{l.code}</span>}
                </div>
                {open === i && (
                  <div className="codebox">
                    <pre>{JSON.stringify(l.body, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
