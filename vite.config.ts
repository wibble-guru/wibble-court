/// <reference types="node" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 게임은 서브 경로(https://games.wibble.guru/court/)에 올라갈 수 있으니 상대 경로로 빌드
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5180,
    host: true, // 같은 와이파이의 휴대폰에서 http://<맥 IP>:5180 으로 테스트
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0, // 이미지는 인라인하지 않고 파일로 캐시
  },
});
