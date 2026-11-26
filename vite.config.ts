/// <reference types="node" />
/// <reference types="vitest/config" />
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { wibble } from '@wibble-guru/boilerplate/vite';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // wibble(): 상대 경로 빌드(base './'), 휴대폰 접속용 server.host, 호스트 시뮬레이터 /host.html
  plugins: [preact(), tailwindcss(), wibble({ slug: 'court', port: 5180 })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'], // 테스트는 tests/ 에만 둔다 (src/ 와 같은 폴더 모양)
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0, // 이미지는 인라인하지 않고 파일로 캐시
  },
});
