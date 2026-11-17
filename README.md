# aibms-frontend

React 18 + TypeScript + Vite 프론트 **껍데기**입니다. 아키텍처 프레임 설계 및 고도화용.
브랜치 전략: `BRANCHING.md`

## 규칙 (소통규약 v1.5 — 토큰 처리는 ASIS 와 동일)
1. 로그인 응답 전체(accessToken·refreshToken 포함)를 localStorage 한 키(`aibms-login`, `src/api/session.ts`)에 저장
2. API 호출·인증 헤더·에러 처리는 `src/api/http.ts` 한 곳에서만 — 모든 호출에 `Authorization`·`RefreshAuthorization` 헤더
3. 401 이면 저장된 토큰을 지우고 다시 로그인(갱신하지 않음). 운영(Okta)은 Okta 자동 재로그인 — Okta 앱 등록 후 연결
4. 목록 응답은 `_embedded.{리소스}` + `page`, 에러는 `{code, message, detail.fieldErrors, traceId}`
5. API 타입은 OpenAPI 로 생성 (`npm run gen:api`)
6. 환경값은 런타임 `config.json` — 환경별로 따로 빌드하지 않는다
7. dev·stag "임시 로그인 환경" 배너 표시

## 로컬 실행
```bash
npm install
npm run dev          # http://localhost:5173, /api·/auth 는 localhost:8080 으로 프록시
```

## 배포
- `Dockerfile`: 빌드 → nginx 정적 서빙(8080)
- 기동 시 `docker/40-runtime-config.sh` 가 환경변수로 `config.json` 생성 (`API_BASE_URL`, `APP_ENV`, `LOGIN_METHODS`, `TEMP_LOGIN_PASSWORD_REQUIRED`, `OKTA_*`)
- CI: `.github/workflows/frontend.yml`

## 확인 필요
- 빌드 검증 전: 첫 `npm install && npm run build` 결과 확인, `package-lock.json` 커밋
