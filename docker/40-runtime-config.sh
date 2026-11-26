#!/bin/sh
# 컨테이너 기동 시 환경변수 → /usr/share/nginx/html/config.json (deploy/overlays 에서 값 주입)
set -e
cat > /usr/share/nginx/html/config.json <<EOF
{
  "apiBaseUrl": "${API_BASE_URL:-}",
  "environment": "${APP_ENV:-dev}",
  "loginMethods": ${LOGIN_METHODS:-["TEMP"]},
  "tempLoginPasswordRequired": ${TEMP_LOGIN_PASSWORD_REQUIRED:-true},
  "okta": {
    "issuer": "${OKTA_ISSUER:-}",
    "clientId": "${OKTA_CLIENT_ID:-}",
    "redirectUri": "${OKTA_REDIRECT_URI:-}"
  }
}
EOF
