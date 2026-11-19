import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // 게임은 서브 경로(https://games.wibble.guru/court/)에 올라갈 수 있으니 상대 경로로 빌드
  base: "./",
  server: {
    port: 5180,
    host: true, // 같은 와이파이의 휴대폰에서 http://<맥 IP>:5180 으로 테스트
  },
});
