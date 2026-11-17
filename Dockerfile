# 정적 파일을 nginx 로 서빙. /api·/auth 라우팅은 EKS Ingress 가 담당한다(nginx 는 정적 파일만).
# 환경값은 컨테이너 기동 시 docker/40-runtime-config.sh 가 config.json 으로 만든다 → 이미지 하나로 모든 환경 배포.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
