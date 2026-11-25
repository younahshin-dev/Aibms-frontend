# aibms-frontend — AI 에이전트 작업 규칙

Cursor·Claude Code 등 AI 에이전트가 이 레포에서 작업할 때 지키는 규칙입니다.
세부 규칙은 `.cursor/rules/*.mdc` 에 있고, 원본 근거는 이 레포의 `README.md` 입니다.
규칙과 README 가 다르면 README 가 맞습니다. 규칙을 바꿀 때는 README 를 먼저 고치고 규칙 파일을 맞춥니다.

## aibms 레포 구성
| 레포 | 내용 |
|---|---|
| `aibms-frontend` | React 18 + TypeScript + Vite |
| `aibms-backend` | Java 25, Spring Boot 4.2, Maven 멀티모듈 (MyBatis, Flyway) |
| `aibms-aiagent` | Python AI Agent (백엔드와 별도 Pod·이미지) |

배포 설정(Kustomize·ArgoCD)은 별도 레포 없이 각 레포의 `deploy/` 에 있다. 환경은 `deploy/overlays/` 폴더로 구분한다.

로컬에서 함께 띄울 때는 레포 3개를 같은 상위 폴더에 나란히 clone 한다 (`aibms-backend/docker-compose.yml`, `aibms-backend/deploy/overlays/local/minikube-up.ps1` 이 `../aibms-*` 경로를 씀).

이 레포: 화면. API 타입은 백엔드 OpenAPI 로 생성 (`npm run gen:api`).

## 꼭 지킬 것
1. 사용자에게 보이는 글(답변·주석·커밋 메시지·API 문서)은 한국어로 쓴다.
2. 추측하지 않는다. ASIS 동작은 소스에서 확인한 것만 사실로 쓰고 `파일:라인` 근거를 단다. 확인 못 한 것은 "확인 못 함"이라고 적는다.
3. 비밀값(비밀번호·키·토큰)을 코드·설정·커밋에 넣지 않는다. 환경변수로 받고 비밀값을 쓰는 레포(aibms-backend·aibms-aiagent)의 `deploy/secrets/*.example.yaml` 에 키 이름만 추가한다.
4. 바꾼 뒤에는 검증한다: `npm run build`. 실패를 숨기지 않는다.
5. 커밋·푸시는 사람이 요청할 때만 한다. 작업은 각자 `feature/<name>` 브랜치 하나에서 하고 `develop` 으로 PR(Squash and merge)한다. `main`·`develop` 에 직접 커밋하지 않는다. 커밋 메시지는 `<type>: <summary> (#issue)` (`BRANCHING.md`).
