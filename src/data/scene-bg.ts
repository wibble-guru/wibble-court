/**
 * 장면 → 배경 (로드맵 4a 표 + 승인된 제안. 계획서 22-scene-backgrounds.md).
 * 본편 장면만 있다 — RESULT·EPILOGUE·진실 공개 배경은 5·6단계에서 따로.
 * Record 타입이라 본편 장면이 하나라도 빠지면 타입 오류가 난다.
 */
import { ENDING_IDS } from '@/engine/endings';
import type { EndingId, Line, SceneId, TrialSceneId } from '@/engine/types';
import type { BgId } from './assets';
import { SCENES } from './scenes';

export type BgEffect = 'dim' | 'vignette';
export type Backdrop = { bg: BgId; effect?: BgEffect };

type MainSceneId = TrialSceneId | EndingId;

const COURT: Backdrop = { bg: 'L-01_court' };
const RECORDER: Backdrop = { bg: 'R-01_recorder' };
const STATEMENTS: Backdrop = { bg: 'E-02_statements' };
const PHONE: Backdrop = { bg: 'R-02_call-phone' };
const CAPTURE: Backdrop = { bg: 'E-06_printed-capture' };
const FOUND: Backdrop = { bg: 'E-09_found-2220' };
const NOTEBOOK: Backdrop = { bg: 'L-08_judge-notebook' };
const VERDICT: Backdrop = { bg: 'L-09_verdict', effect: 'vignette' };

const SCENE_BG: Record<MainSceneId, Backdrop> = {
  P00: COURT,
  A10: RECORDER,
  'A11-A': RECORDER,
  'A11-B': RECORDER,
  'A11-C': RECORDER,
  B20: STATEMENTS,
  'B21-A': { bg: 'L-06_corridor' },
  'B21-B': STATEMENTS,
  'B21-C': COURT,
  C30: { bg: 'L-04_officer-desk' }, // 녹음 속 강도현부터 휴대폰 (CUES)
  'C31-A': PHONE,
  'C31-B': { bg: 'E-04_email-draft' },
  'C31-C': COURT, // 22:20 발견 그림은 G70 반전에 아껴 둔다
  D40: { bg: 'E-05_sealed-statement' },
  'D41-A': COURT,
  'D41-B': COURT,
  'D41-C': COURT,
  E50: CAPTURE,
  'E51-A': CAPTURE,
  'E51-B': COURT,
  'E51-C': COURT,
  F60: { bg: 'E-14_investigation-docs' },
  // 편집실(L-07)은 쓰지 않는다 — F60 연출 "특정 편집자만을 유력 용의자처럼 비추지 않는다"
  'F61-A': COURT,
  'F61-B': COURT,
  'F61-C': COURT,
  M65: NOTEBOOK,
  QM: NOTEBOOK,
  G70: FOUND,
  'G71-A': FOUND,
  'G71-B': PHONE,
  'G71-C': CAPTURE,
  H80: COURT,
  'H81-A': COURT,
  'H81-B': COURT,
  'H81-C': COURT,
  I90: COURT,
  'I91-A': COURT,
  'I91-B': COURT,
  'I91-C': COURT,
  J100: COURT,
  J110: VERDICT,
  'GUILTY-A': VERDICT,
  'GUILTY-B': VERDICT,
  'GUILTY-C': VERDICT,
  'NOTGUILTY-A': VERDICT,
  'NOTGUILTY-B': VERDICT,
  'NOTGUILTY-C': VERDICT,
};

/**
 * 장면 중간에 배경이 바뀌는 곳: 이 발언자의 첫 대사부터 (질문 단계도 바뀐 배경).
 * C30 — 대본 연출 "법정 조명이 조금 어두워지고 통화 녹음 재생 화면이 켜진다"
 */
const CUES: Partial<Record<MainSceneId, { speaker: string; to: Backdrop }>> = {
  C30: { speaker: '녹음 속 강도현', to: { bg: 'R-02_call-phone', effect: 'dim' } },
};

function isMain(id: SceneId): id is MainSceneId {
  return id in SCENE_BG;
}

/**
 * 지금 보일 배경. lines = 이 장면에서 화면에 보이는 대사(runner.visibleLines), index = 지금 대사 번호.
 * 질문 단계면 index 를 lines.length 로 (대사가 다 지나간 뒤).
 */
export function backdropAt(sceneId: SceneId, lines: Line[], index: number): Backdrop {
  if (!isMain(sceneId)) return COURT;
  const cue = CUES[sceneId];
  if (cue) {
    const at = lines.findIndex((line) => line.speaker === cue.speaker);
    if (at >= 0 && index >= at) return cue.to;
  }
  return SCENE_BG[sceneId];
}

/** 이 장면 다음에 올 수 있는 장면들 (선택지의 next, 없으면 장면의 next, 판결이면 엔딩 전부) */
export function nextScenes(sceneId: SceneId): SceneId[] {
  const scene = SCENES[sceneId];
  if (!scene) return [];
  const next = new Set<SceneId>();
  for (const prompt of scene.prompts ?? []) {
    for (const field of prompt.fields) {
      if (field.kind === 'choice') field.options.forEach((o) => o.next && next.add(o.next));
    }
  }
  if (next.size === 0) {
    if (typeof scene.next === 'string') next.add(scene.next);
    else ENDING_IDS.forEach((id) => next.add(id));
  }
  return [...next];
}

/** 이 장면 안과 다음에 올 수 있는 장면들의 배경 (미리 받기용, 중복 없음) */
export function upcomingBackgrounds(sceneId: SceneId): BgId[] {
  if (!SCENES[sceneId] || !isMain(sceneId)) return [];
  const next = nextScenes(sceneId);
  const bgs = new Set<BgId>();
  const cue = CUES[sceneId];
  if (cue) bgs.add(cue.to.bg);
  for (const id of next) if (isMain(id)) bgs.add(SCENE_BG[id].bg);
  return [...bgs];
}

/** 본편 배경 전부 (타이틀 미리 받기용) */
export const MAIN_BACKGROUNDS: BgId[] = [
  ...new Set([
    ...Object.values(SCENE_BG).map((b) => b.bg),
    ...Object.values(CUES).map((c) => c!.to.bg),
  ]),
];
