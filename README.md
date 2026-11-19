# 위블 법정 (wibble-court)

위블 사이트에 iframe으로 들어가는 게임. Vite + React + TypeScript, pnpm.

## 시작하기

```bash
pnpm install
pnpm dev          # http://localhost:5180
```

| 주소 | 용도 |
|---|---|
| `http://localhost:5180/` | 게임 단독 실행. `?theme=horror&slug=court`로 사이트 값을 흉내 낼 수 있음 |
| `http://localhost:5180/host.html` | 위블 사이트 흉내: 모바일·PC 16:9 iframe 두 개로 postMessage 규약을 시험 (개발 서버 전용, 빌드에 안 들어감) |

같은 와이파이의 휴대폰에서는 `http://<맥 IP>:5180`으로 열면 됩니다.

```bash
pnpm build        # 타입 검사 + dist/ 생성 (정적 파일, 어디든 올리면 됨)
pnpm preview
```

## 사이트 연동

`src/bridge.ts`가 위블 사이트(`src/lib/game-bridge.ts`, `docs/api.md` "게임 연동")와 같은 규약을 구현합니다.

1. 게임이 `ready`를 300ms마다 보냄 → 사이트가 `init { slug, theme }` 응답
2. 게임이 끝나면 `sendResult(resultId)` → 사이트가 `/t/{slug}/result/{resultId}`로 이동

- 결과 id는 콘텐츠 서버에 등록된 결과 id와 같아야 합니다 (`^[a-z0-9][a-z0-9_-]{0,63}$`).
- 운영 빌드에는 `VITE_ALLOWED_HOST_ORIGINS=https://<사이트 도메인>`을 넣어 다른 페이지의 `init`을 무시하세요.
- 배포 서버 응답 헤더: `Content-Security-Policy: frame-ancestors https://<사이트 도메인>` (`X-Frame-Options`는 빼기).

## 구조

```
src/
  bridge.ts        사이트 ↔ 게임 postMessage (게임 쪽)
  game/script.ts   장면·선택지·점수 → 결과 id (지금은 샘플 데이터)
  App.tsx          화면 흐름: 연결 → 타이틀 → 장면 → 판결
  styles.css       테마 토큰(default / horror), 세로·가로(16:9) 레이아웃
host.html          개발용 사이트 흉내
```
