/**
 * 에셋 목록. 원본은 raw-assets/ → `pnpm images` → public/assets/ (WebP).
 * 배경은 큰 버전(원본 1672px) + `@1280` 두 벌이 있다.
 */

export type BgId =
  | 'T-00_title'
  | 'L-01_court'
  | 'R-01_recorder'
  | 'E-02_statements'
  | 'L-06_corridor'
  | 'L-04_officer-desk'
  | 'R-02_call-phone'
  | 'E-04_email-draft'
  | 'E-05_sealed-statement'
  | 'E-06_printed-capture'
  | 'E-14_investigation-docs'
  | 'L-08_judge-notebook'
  | 'E-09_found-2220'
  | 'L-09_verdict';

/** 타이틀 화면 배경 (index.html 에서 preload) */
export const TITLE_BG: BgId = 'T-00_title';
/** 시작 후 첫 장면 P00 배경 — 시작할 때 이것만은 꼭 받은 뒤 전환한다 */
export const FIRST_SCENE_BG: BgId = 'L-01_court';

/**
 * 타이틀을 보는 동안 뒤에서 미리 받을 배경 (첫 장면이 맨 앞). 본편 배경만 — scene-bg.test 가 장면 표와 같은지 확인.
 * 결과 이후 진실 공개에만 쓰는 배경은 여기·BgId 에 두지 않는다 (본편 번들에 이름도 남기지 않게, 6단계에서 별도 청크)
 */
export const PRELOAD_BGS: BgId[] = [
  FIRST_SCENE_BG,
  'R-01_recorder',
  'E-02_statements',
  'L-06_corridor',
  'L-04_officer-desk',
  'R-02_call-phone',
  'E-04_email-draft',
  'E-05_sealed-statement',
  'E-06_printed-capture',
  'E-14_investigation-docs',
  'L-08_judge-notebook',
  'E-09_found-2220',
  'L-09_verdict',
];

const BASE = import.meta.env.BASE_URL;

/** UI 조각 (UI 키트에서 잘라 낸 월계수) */
export const UI = {
  laurelLeft: `${BASE}assets/ui/laurel-left.webp`,
  laurelRight: `${BASE}assets/ui/laurel-right.webp`,
};

/** UI 키트 조각 (scripts/cut-ui-kit.mjs). CSS 는 border-image 로 늘려 쓴다 */
const KIT_PARTS = [
  'emblem',
  'bar',
  'tray',
  'slot',
  'dialog',
  'plate',
  'gem',
  'choice',
  'diamond',
] as const;
const kitSrc = (part: (typeof KIT_PARTS)[number]) => `${BASE}assets/ui/kit-${part}.webp`;
export const KIT = { emblem: kitSrc('emblem'), gem: kitSrc('gem') };

/**
 * 키트 조각을 CSS 변수(--kit-dialog 등)로. 플레이·진실 공개 화면의 main 에 건다.
 * CSS 안에 경로를 쓰면 상대 경로 빌드(base './')에서 어긋나서 여기서 넣는다
 */
export const KIT_VARS = Object.fromEntries(
  KIT_PARTS.map((part) => [`--kit-${part}`, `url("${kitSrc(part)}")`]),
);

/** 배경 큰 버전의 실제 폭 (원본이 1672px 라 1920 으로 키우지 않음) */
const LARGE_WIDTH = 1672;

/** 화면을 cover 로 채울 때 필요한 표시 폭: 16:9 보다 넓으면 화면 폭, 아니면 높이 × 16/9 */
export const BG_SIZES = '(min-aspect-ratio: 16/9) 100vw, 177.78vh';

export function bgSrcSet(id: BgId): string {
  return `${BASE}assets/bg/${id}@1280.webp 1280w, ${BASE}assets/bg/${id}.webp ${LARGE_WIDTH}w`;
}

/** 잘릴 때 남길 중심. 그림마다 인물·물건 위치가 달라 필요한 것만 적는다 */
const FOCUS: Partial<Record<BgId, string>> = {
  'T-00_title': '30% 50%', // 왼쪽의 인물 뒷모습
};

export function bgFocus(id: BgId): string {
  return FOCUS[id] ?? '50% 50%';
}

/**
 * 모바일 세로 화면 전용 그림 (`<id>-portrait.webp`, 9:16). 있는 배경만 적는다.
 * 가로 그림을 세로로 자르면 인물이 빠지는 장면을 위해 따로 그린 것. 값은 세로 그림에서 남길 중심.
 */
const PORTRAIT: Partial<Record<BgId, string>> = {
  'T-00_title': '45% 50%', // 주인공(왼쪽)과 경찰관(오른쪽)이 둘 다 보이게
};

/** 세로 그림으로 바꾸는 화면 조건. title.css 의 세로 레이아웃과 같은 기준 */
export const PORTRAIT_MEDIA = '(max-aspect-ratio: 4/5)';

export function bgPortrait(id: BgId): { src: string; focus: string } | null {
  const focus = PORTRAIT[id];
  return focus ? { src: `${BASE}assets/bg/${id}-portrait.webp`, focus } : null;
}

/** 증거 아이콘 (노션 증거물 아이템 시트에서 잘라 낸 픽셀 그림, 96px) — data/evidence.ts 가 증거 id 와 잇는다 */
export type IconId =
  | 'I-01_recorder'
  | 'I-02_statement'
  | 'I-03_call-phone'
  | 'I-04_voice-analysis'
  | 'I-05_laptop'
  | 'I-06_timeline'
  | 'I-07_sealed-envelope'
  | 'I-08_anon-phone'
  | 'I-09_usb'
  | 'I-10_message-phone';

export const iconSrc = (id: IconId) => `${BASE}assets/icons/${id}.webp`;

/** 메시지 증거 화면 (E50): 말풍선 2개짜리 폰 */
export const MODAL = { twoBubbles: `${BASE}assets/modal/M-01_two-bubbles.webp` };

const ICON_IDS: IconId[] = [
  'I-01_recorder',
  'I-02_statement',
  'I-03_call-phone',
  'I-04_voice-analysis',
  'I-05_laptop',
  'I-06_timeline',
  'I-07_sealed-envelope',
  'I-08_anon-phone',
  'I-09_usb',
  'I-10_message-phone',
];

export const UI_IMAGES = [
  UI.laurelLeft,
  UI.laurelRight,
  ...KIT_PARTS.map(kitSrc),
  ...ICON_IDS.map(iconSrc),
  MODAL.twoBubbles,
];
