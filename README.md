# 위블 법정 (wibble-court)

위블 사이트에 iframe으로 들어가는 게임. Vite + Preact + TypeScript, pnpm.
사이트 연동·막힌 화면·공통 스타일·호스트 시뮬레이터는 [`@wibble-guru/boilerplate`](https://www.npmjs.com/package/@wibble-guru/boilerplate)를 쓴다.

## 시작하기

```bash
pnpm install
pnpm dev          # http://localhost:5180
```

| 주소                              | 용도                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `http://localhost:5180/`          | 게임 단독 실행 (개발 서버에서만 가능). `?theme=horror&slug=court`로 사이트 값을 흉내 낼 수 있음            |
| `http://localhost:5180/host.html` | 위블 사이트 흉내: 모바일·PC 16:9 iframe 두 개로 postMessage 규약을 시험 (개발 서버 전용, 빌드에 안 들어감) |

같은 와이파이의 휴대폰에서는 `http://<맥 IP>:5180`으로 열면 됩니다.

```bash
pnpm build        # 타입 검사 + dist/ 생성 (정적 파일, 어디든 올리면 됨)
pnpm preview      # 운영 빌드라 단독으로 열면 막힌 화면이 나옵니다
```

## 사이트 연동

`@wibble-guru/boilerplate`가 위블 사이트(`src/lib/game-bridge.ts`, `docs/api.md` "게임 연동")와 같은 규약을 구현합니다. 이 게임의 설정은 `src/wibble.ts`(`defineWibbleGame`)와 `vite.config.ts`(`wibble({ slug, port })`)에 있습니다.

1. 게임이 `ready`를 300ms마다 보냄 → 사이트가 `init { slug, theme }` 응답
2. 게임이 끝나면 `game.sendResult(resultId, result)` → 사이트가 `/t/{slug}/result/{playId}?r={resultId}&title=…`로 이동

- **운영 빌드는 사이트 안에서만 실행됩니다.** 주소를 직접 열거나, 다른 페이지가 iframe으로 띄워서 8초 안에 `init`이 오지 않으면 게임 대신 "위블에서 플레이하기" 안내(`VITE_SITE_URL`, 기본 https://wibble.guru)를 보여 줍니다. 사이트가 늦게 떠서 그 뒤에 `init`이 오면 그대로 이어서 시작합니다.
- 사이트는 결과를 서버에 저장하지 않습니다. `result`(제목·설명·해시태그 …)를 결과 페이지 주소에 실어 보여 주므로, 결과 내용은 `src/game/script.ts`의 `RESULTS`에 둡니다. 결과 id 형식은 `^[a-z0-9][a-z0-9_-]{0,63}$`입니다.
- 운영 빌드에는 `VITE_ALLOWED_HOST_ORIGINS=https://<사이트 도메인>`을 넣어 다른 페이지의 `init`을 무시하세요.
- 배포 서버 응답 헤더: `Content-Security-Policy: frame-ancestors https://<사이트 도메인>` (`X-Frame-Options`는 빼기).

## 구조

```
src/
  main.tsx             WibbleFrame(연결 → 막힌 화면 / 게임) + 공통 base.css
  wibble.ts            사이트 연동 설정 (slug, 단독 실행 기본 테마)
  App.tsx              화면 흐름: 타이틀 → 장면 → 판결
  game/script.ts       장면·선택지·점수 → 결과 id + 결과 페이지 내용 (지금은 샘플 데이터)
  styles/index.css     Tailwind(theme+utilities) + 세로·가로(16:9) 게임 레이아웃
  styles/tokens.css    게임 테마 토큰 (default / horror)
```

훅은 `preact/hooks`에서 가져온다. `react`를 import하는 라이브러리(zustand 등)는 `@preact/preset-vite`가 `preact/compat`으로 연결한다.
