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
  | 'L-07_edit-room'
  | 'L-08_judge-notebook'
  | 'E-09_found-2220'
  | 'L-09_verdict'
  | 'L-12_dark-court'
  | 'E-11_cctv'
  | 'E-12_edit-copy';

/** 타이틀 화면 배경 (index.html 에서 preload) */
export const TITLE_BG: BgId = 'T-00_title';
/** 시작 후 첫 장면 P00 배경 — 시작할 때 이것만은 꼭 받은 뒤 전환한다 */
export const FIRST_SCENE_BG: BgId = 'L-01_court';

/** 타이틀을 보는 동안 뒤에서 미리 받을 배경 (첫 장면이 맨 앞) */
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
  'L-07_edit-room',
  'L-08_judge-notebook',
  'E-09_found-2220',
  'L-09_verdict',
  'L-12_dark-court',
  'E-11_cctv',
  'E-12_edit-copy',
];

const BASE = import.meta.env.BASE_URL;

/** UI 조각 (UI 키트에서 잘라 낸 월계수) */
export const UI = {
  laurelLeft: `${BASE}assets/ui/laurel-left.webp`,
  laurelRight: `${BASE}assets/ui/laurel-right.webp`,
};

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

export const UI_IMAGES = [UI.laurelLeft, UI.laurelRight];
