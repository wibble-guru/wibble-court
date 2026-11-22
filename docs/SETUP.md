# 세팅 가이드

위블 법정 (wibble-court) — 위블 사이트에 iframe 으로 들어가는 판단 성향 테스트 게임.

---

## 1. 스택

| 역할   | 선택                                            | 이유                                                                               |
| ------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| 빌드   | **Vite 8**                                      | 개발 서버가 즉시 뜨고, 결과물이 정적 파일 몇 개 (`base: './'` 로 서브 경로 배포)   |
| UI     | **React 19** + TypeScript 6.0                   | TS 7 은 typescript-eslint 미지원이라 6.0 고정                                      |
| 스타일 | 테마 토큰 CSS + **Tailwind CSS v4**             | 기존 CSS 는 그대로, 새 UI 는 Tailwind 클래스로. preflight 없이 써서 기존 모양 유지 |
| 상태   | **Zustand** (+ persist)                         | 약 1KB, 새로고침해도 이어하기. 필요해질 때 `src/store/` 에 추가                    |
| 연출   | CSS (opacity / transform)                       | 라이브러리 없이 GPU 합성                                                           |
| 린트   | **ESLint 10** + typescript-eslint + react-hooks | 훅 의존성, 안 쓰는 변수, 타입 import 실수 잡기. 포맷 규칙은 끄고 Prettier 에 맡김  |
| 포맷   | **Prettier**                                    | singleQuote, semi, trailingComma all, printWidth 100 + Tailwind 클래스 자동 정렬   |
| 이미지 | **sharp** (`pnpm images`)                       | PNG → WebP 자동 변환, 배경은 모바일 버전도 생성                                    |

> TypeScript 는 **6.0** 으로 고정했습니다 (`~6.0.3`). typescript-eslint 가 TS 6.0 까지 지원하기 때문입니다. TS 7 로 올릴 때는 typescript-eslint 지원 여부를 먼저 확인하세요.

---

## 2. 시작하기

```bash
# Node 20 이상, pnpm 11
pnpm install
pnpm dev          # http://localhost:5180
```

sharp 설치 스크립트가 막히면 `pnpm approve-builds` 로 허용합니다.

| 주소                              | 용도                                                                  |
| --------------------------------- | --------------------------------------------------------------------- |
| `http://localhost:5180/`          | 게임 단독 실행 (개발 서버에서만). `?theme=horror&slug=court` 로 흉내  |
| `http://localhost:5180/host.html` | 위블 사이트 흉내: 모바일·PC 16:9 iframe 두 개로 postMessage 규약 시험 |

### 명령어

| 명령                | 용도                                                  |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev`          | 개발 서버                                             |
| `pnpm build`        | 타입 검사 + 빌드                                      |
| `pnpm preview`      | 빌드 결과 확인 (운영 빌드라 단독으로 열면 막힌 화면)  |
| `pnpm typecheck`    | 타입 검사만                                           |
| `pnpm lint`         | ESLint 검사                                           |
| `pnpm lint:fix`     | ESLint 자동 수정                                      |
| `pnpm format`       | Prettier 전체 적용                                    |
| `pnpm format:check` | 포맷 검사 (PR 전)                                     |
| `pnpm images`       | `raw-assets/` 의 PNG 를 `public/assets/` WebP 로 변환 |

### VS Code

권장 확장(Prettier, ESLint, Tailwind CSS IntelliSense)이 `.vscode/extensions.json` 에 있습니다. 저장하면 자동으로 포맷됩니다.

---

## 3. 폴더 구조

```
wibble-court/
├─ src/
│  ├─ main.tsx              진입점
│  ├─ App.tsx               화면 흐름: 연결 → 타이틀 → 장면 → 판결
│  ├─ game/script.ts        장면·선택지·점수 → 결과 id
│  ├─ styles/index.css      Tailwind(theme + utilities) + 게임 레이아웃
│  └─ shared/               위블 게임 공통 (다른 게임에서도 그대로 쓰는 것)
│     ├─ bridge.ts          사이트 ↔ 게임 postMessage
│     ├─ gate/              막힌 화면 (Figma 394:991)
│     ├─ theme/             tokens.css (default / horror), fonts.css (SUIT)
│     └─ assets/            위블 로고·마스코트, 폰트
├─ public/assets/           bg · ui · icons · modal · fonts (WebP)
├─ raw-assets/              원본 PNG (깃 제외, pnpm images 입력)
├─ docs/
│  ├─ SETUP.md              이 문서
│  ├─ specs/                요구사항, 장면 명세
│  └─ plans/                작업 계획서 (이슈 1개 = 계획서 1개)
├─ scripts/                 setup-labels.sh, convert-images.mjs
├─ .github/                 이슈 템플릿 3종, PR 템플릿
├─ host.html                개발용 사이트 흉내 (빌드에 안 들어감)
└─ CLAUDE.md, .claude/      개인 하네스 (깃 제외)
```

**규칙**

- 위블 공통 디자인(테마 토큰, 폰트, 막힌 화면, 브리지)은 `src/shared/` 에 둡니다. `shared` 는 게임 코드를 import 하지 않습니다.
- 장면·선택지 내용은 `src/game/` 에만 둡니다. 컴포넌트에 대사를 직접 쓰지 않습니다.
- import 는 `@/` 별칭을 씁니다. 예: `import { sendResult } from '@/shared/bridge'`
- 테마 토큰은 CSS 변수(`var(--primary)`)로도, Tailwind 클래스(`bg-surface`, `text-primary`)로도 쓸 수 있습니다.

### 나중에 옮길 수 있는 구조 (제안)

게임 코드가 커지면 아래처럼 나눕니다.

| 지금                   | 옮길 곳                                                |
| ---------------------- | ------------------------------------------------------ |
| `src/App.tsx`          | `src/app/App.tsx` (SceneView 는 `src/features/scene/`) |
| `src/game/script.ts`   | `src/data/script.ts`                                   |
| App 의 `useState` 상태 | `src/store/game.ts` (Zustand + persist)                |

---

## 4. 위블 사이트 연동

1. 게임이 `ready` 를 300ms 마다 보냄 → 사이트가 `init { slug, theme }` 응답
2. 게임이 끝나면 `sendResult(resultId)` → 사이트가 `/t/{slug}/result/{resultId}` 로 이동

- 운영 빌드는 사이트 안에서만 실행됩니다. 8초 안에 `init` 이 없으면 막힌 화면을 보여 주고, 늦게 오면 이어서 시작합니다.
- 결과 id 는 콘텐츠 서버에 등록된 id 와 같아야 합니다 (`^[a-z0-9][a-z0-9_-]{0,63}$`).
- 운영 빌드에는 `VITE_ALLOWED_HOST_ORIGINS=https://<사이트 도메인>` 을 넣습니다.
- 배포 서버 응답 헤더: `Content-Security-Policy: frame-ancestors https://<사이트 도메인>` (`X-Frame-Options` 는 빼기).

---

## 5. 에셋 넣기

1. 원본 PNG 를 `raw-assets/bg`, `raw-assets/icons`, `raw-assets/modal`, `raw-assets/ui` 에 넣습니다.
2. `pnpm images` 를 실행하면 `public/assets/` 에 WebP 가 생깁니다.
   - 배경: `<이름>.webp`(1920px) + `<이름>@1280.webp`(모바일)
   - 아이콘, 모달: 무손실 WebP (픽셀이 깨지지 않음)
3. 위블 공통 자산(로고, 마스코트, SUIT 폰트)은 `src/shared/assets/` 에 있고 Vite 가 import 로 처리합니다.

---

## 6. 빠른 렌더링 규칙

1. 이미지는 전부 WebP. 배경은 장당 150~300KB 를 목표로 합니다.
2. 다음에 올 수 있는 장면의 이미지는 미리 받아 둡니다.
3. 애니메이션은 `opacity`, `transform` 만 씁니다.
4. Zustand 는 셀렉터로 필요한 값만 꺼냅니다: `useGame((s) => s.sceneId)`.
5. 픽셀 이미지에는 `className="pixelated"` 를 붙입니다.
6. 새 라이브러리는 추가하기 전에 번들 크기를 확인합니다 (JS gzip 50KB 이하 유지).

---

## 7. GitHub 세팅

### 7-1. 저장소

```bash
git add .
git commit -m "chore: 프로젝트 세팅 보강"
```

> `git add .` 를 해도 `CLAUDE.md`, `.claude/`, `raw-assets/` 는 `.gitignore` 때문에 올라가지 않습니다.
> 확인: `git status --ignored`

### 7-2. 라벨 만들기

```bash
bash scripts/setup-labels.sh
```

`type:` 8개, `priority:` 4개, `size:` 5개, `init:` 3개가 생성됩니다.

### 7-3. 저장소 설정 (GitHub 웹)

- Settings → General → Pull Requests: **Allow squash merging** 만 켜기
- Settings → Branches → `main` 보호 규칙: PR 필수, 리뷰 1명 이상

---

## 8. Git 규칙 (B1ND / Dodam 컨벤션)

출처: https://dodam-docs.b1nd.com/team

### 이슈

| 항목   | 규칙                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| 제목   | `[Feature] 배경 교차 페이드 전환 구현` — 타입 포함, 50자 이내, 마침표 없음                            |
| 본문   | 템플릿 사용 (작업 내용 / 작업 목적 / 체크리스트 / 참고 자료), **"-ㅂ니다" 체**, 템플릿 주석 삭제 금지 |
| 라벨   | `type:` · `priority:` · `size:` 에서 **각 1개씩**                                                     |
| 담당자 | 반드시 지정                                                                                           |
| 금지   | 모호한 제목("기능 추가"), 본문 없는 이슈, 라벨 없는 이슈, 한 이슈에 여러 작업                         |

### 브랜치

```
<type>/#<이슈번호>-<subject>
```

- type: `feature`, `fix`, `refactor`, `hotfix` (`release/v1.0.0` 은 `#` 대신 `v`)
- subject: **영어 kebab-case**, 대문자·공백·마침표 없음
- 브랜치 하나 = 이슈 하나. `main` 에서 분기 (1~2명 프로젝트라 `develop` 생략)
- 예: `feature/#3-scene-transition`, `fix/#12-dialogue-skip`

### 커밋

```
<type>: <subject>
```

| type       | 의미                     |
| ---------- | ------------------------ |
| `feat`     | 새 기능                  |
| `fix`      | 버그 수정                |
| `docs`     | 문서                     |
| `style`    | 코드 포맷 (UI 변경 아님) |
| `refactor` | 동작 변경 없는 구조 개선 |
| `chore`    | 빌드, 설정, 패키지       |
| `perf`     | 성능 개선                |
| `ci`       | CI/CD                    |
| `revert`   | 되돌리기                 |
| `merge`    | 브랜치 병합              |

- subject: 명사형, 50자 이내, 마침표·쉼표 없음, **이슈 번호 넣지 않음**
- 좋은 예: `feat: 배경 교차 페이드 전환 구현`, `perf: 배경 이미지 WebP 변환`
- 나쁜 예: `기능 추가`, `feat: 배경 수정했습니다.`, `feat: #3 배경`
- 기능 하나를 한 커밋에 몰지 말고 자주 커밋합니다. 되돌려도 프로그램이 동작하는 단위가 기준입니다.
- 서로 다른 변경은 나눠서 커밋합니다 (`git add -p`).

### PR

| 항목  | 규칙                                                                                        |
| ----- | ------------------------------------------------------------------------------------------- |
| 제목  | `[Feature] 배경 교차 페이드 전환 구현 (#3)` — 이슈 번호 필수, 50자 이내, 과거형·마침표 없음 |
| 본문  | 템플릿: 변경 내용 / 작업 내용 / 테스트 방법 / `Resolve #3` / 스크린샷 / 체크리스트          |
| 크기  | PR 하나 = 이슈 하나, 변경 파일 10개 이상이면 분리 검토, 30분 안에 리뷰 가능한 크기          |
| 리뷰  | 1명 이상, 리뷰 전 머지 금지                                                                 |
| 머지  | **Squash Merge**                                                                            |
| Draft | 피드백만 먼저 받을 때 사용, 본문에 피드백 받을 부분 명시                                    |

### 한 작업의 흐름

```bash
# 1) 이슈 생성 → 번호 확인 (예: #3)
# 2) 브랜치
git switch main && git pull
git switch -c feature/#3-scene-transition
# 3) 작업 + 자주 커밋
git commit -m "feat: 배경 레이어 교차 전환 구현"
# 4) PR 전 확인
pnpm lint && pnpm build && pnpm format:check
# 5) 푸시 + PR
git push -u origin feature/#3-scene-transition
gh pr create --base main --title "[Feature] 배경 교차 페이드 전환 구현 (#3)"
```

---

## 9. Claude Code 하네스

`CLAUDE.md` 와 `.claude/` 는 **개인 파일이라 깃허브에 올라가지 않습니다.**

### 작업 방식: 계획 → 문서 → 개발

1. **인터뷰:** 요청이 모호하면 Claude 가 질문으로 요구사항을 확정합니다.
2. **계획서:** `/plan <이슈번호 또는 설명>` → `docs/plans/` 에 계획서 작성
3. **승인:** 계획서를 읽고 승인해야 개발을 시작합니다.
4. **개발:** 단계별 구현, 단계마다 타입 검사
5. **검증:** lint + build + format:check + 화면 확인
6. **커밋 / PR:** `/commit`, `/pr`

### 커스텀 명령 (`.claude/commands/`)

| 명령            | 하는 일                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `/plan <작업>`  | 계획서 작성. 승인 전에는 코드 수정 안 함. UI 작업이면 프론트엔드 스킬 반영 |
| `/issue <작업>` | Dodam 규칙 이슈 초안 → 승인 후 `gh issue create` → 브랜치 생성             |
| `/commit`       | 포맷·린트·타입 검사 → 변경을 나눠서 규칙대로 커밋 (승인 후)                |
| `/pr`           | lint·build 확인 → 템플릿대로 PR 초안 → 승인 후 `gh pr create`              |

### 자동화 (`.claude/settings.json`)

- **훅:** Claude 가 파일을 수정할 때마다 그 파일에 Prettier 자동 적용 (`jq` 필요)
- **허용:** dev, build, typecheck, lint, format, git status/diff/log/switch/add
- **차단:** `git push --force`, `main` 직접 푸시
