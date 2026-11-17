# 브랜치 전략 (연습용)

앱 레포(aibms-frontend · aibms-backend · aibms-aiagent)는 모두 아래 규칙을 씁니다.
배포 레포(aibms-deploy)는 `main` 하나만 쓰고, 환경 차이는 `overlays/dev|stag|prod` 폴더로 구분합니다.

## 브랜치
| 브랜치 | 용도 | 어디서 만들고 어디로 합치나 | 배포 |
|---|---|---|---|
| `main` | 운영에 나간 상태 | release/*, hotfix/* 를 merge | — (태그로 배포) |
| `develop` | 다음 릴리스 통합 | feature/* 를 PR 로 merge | dev 자동 |
| `feature/<이슈>-<요약>` | 기능 개발 | develop 에서 생성 → develop 으로 PR | — |
| `release/<버전>` | 릴리스 준비·검증 | develop 에서 생성 → main·develop 으로 merge | stag |
| `hotfix/<버전>` | 운영 긴급 수정 | main 에서 생성 → main·develop 으로 merge | 태그 후 prod |
| 태그 `v<버전>` | 운영 릴리스 | main 의 merge 커밋에 태그 | prod (승인) |


## 흐름 연습 순서
```bash
# 1. 기능 개발
git switch develop
git switch -c feature/1-login-page
# ... 커밋 ...
git push -u origin feature/1-login-page      # → develop 으로 PR (CI: 빌드·테스트)
# PR merge → develop push → CI: 빌드 → dev 배포(시뮬레이션)

# 2. 릴리스
git switch develop && git pull
git switch -c release/0.1.0
git push -u origin release/0.1.0             # → CI: stag 배포(시뮬레이션)
# 검증 중 수정은 release/0.1.0 에 커밋

# 3. 운영 반영
git switch main && git merge --no-ff release/0.1.0
git tag v0.1.0 && git push origin main v0.1.0   # → CI: prod 배포(Environment 승인)
git switch develop && git merge --no-ff release/0.1.0 && git push

# 4. 긴급 수정
git switch main && git switch -c hotfix/0.1.1
# ... 수정 ...
git switch main && git merge --no-ff hotfix/0.1.1 && git tag v0.1.1 && git push origin main v0.1.1
git switch develop && git merge --no-ff hotfix/0.1.1 && git push
```

## 저장소 설정 (GitHub 기준)
- Branch protection: `main`, `develop` 직접 push 금지, PR + CI 통과 필수
- 기본 브랜치(Default branch)는 `develop` 권장 — `git push` 가 알려 주는 PR 링크와 PR 화면의 base 가 기본 브랜치로 잡힌다
- `main` 필수 검사에 `pr-base-guard` 추가: main 으로 오는 PR 은 `develop`·`release/*`·`hotfix/*` 에서만 통과 (`.github/workflows/pr-base-guard.yml`)
- PR 링크는 base 를 적어서 연다: `https://github.com/{owner}/{repo}/compare/develop...{브랜치}?expand=1`
- Environments: `dev`, `stag`, `prod` 생성, `prod` 에 승인 규칙(Required reviewers) — 저장소 공개 범위·플랜에 따라 제공 여부가 다를 수 있음
- 커밋 메시지 예: `feat: 로그인 화면`, `fix: refresh 재시도 누락`, `chore: 의존성 갱신`
