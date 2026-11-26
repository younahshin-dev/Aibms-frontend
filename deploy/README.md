# 배포 설정 (Kustomize)

이 레포의 앱을 클러스터에 띄우는 설정이다. 별도 배포 레포(aibms-deploy)를 두지 않고 레포마다 자기 `deploy/` 를 갖는다.

```
base/               frontend · Ingress(/)
overlays/dev|stag|prod   이미지 태그·환경변수·도메인
overlays/local, local-dev   minikube
argocd/             ArgoCD Application
```

도메인(host)과 네임스페이스는 aibms-backend 레포 `deploy/overlays/*` 와 같아야 한다. 로컬 실행은 aibms-backend 레포 `deploy/overlays/local/README.md`.

런타임 설정(API 주소, 로그인 방식)은 ConfigMap `aibms-frontend-config` 이고 컨테이너 기동 때 `config.json` 이 된다. ConfigMap 만 바뀌면 Pod 는 재시작되지 않으므로 `kubectl rollout restart deploy/aibms-frontend` 가 필요하다.


## 흐름
CI → 이미지 → `deploy/overlays/<환경>` 의 이미지 태그 갱신(커밋/PR) → ArgoCD 가 `main` 의 `deploy/overlays/<환경>` 을 반영
- 태그 갱신 커밋으로 앱 빌드가 다시 돌지 않게 워크플로에서 `deploy/` 변경은 빌드 대상에서 뺐다
- `overlays/prod` 수정 권한은 브랜치 보호·CODEOWNERS 로 막는다 (아직 설정하지 않음)

## 확인
```bash
kubectl kustomize deploy/overlays/dev
```

## 자리 표시 값
`<AWS_ACCOUNT_ID>`, `example.invalid`, `<GIT_URL>`, `<DB_HOST>` — 실제 클러스터에 배포할 때 채움
