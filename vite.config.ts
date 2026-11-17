import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 로컬 개발: /api, /auth 를 백엔드로 넘겨 브라우저가 같은 주소로 인식하게 한다.
// 운영(EKS Ingress 경로 분리)과 같은 구조라 쿠키·CORS 문제가 없다.
const backend = 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/auth': backend,
      '/.well-known': backend,
    },
  },
});
