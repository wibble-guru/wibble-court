import type { SceneId } from '@/engine/types';

/**
 * 왼쪽 위 막대에 띄우는 장면 제목. 대본 장면 제목의 " — " 앞부분 그대로 (사용자 승인, 계획서 40).
 * 제작용 문구("+ 사고 기준 질문(QM)", "플레이어의 재판 기록을 반영하는 장면")는 띄우지 않는다.
 */
const MAIN_TITLE = {
  P00: '개정',
  A10: '첫 번째 이의',
  B20: '증인신문',
  C30: '통화 기록',
  D40: '보호받아야 할 증인인가, 검증되어야 할 증인인가',
  E50: '“약속대로 할게”',
  F60: '동기의 법정',
  M65: '중간 판단 기록',
  G70: '핵심 전제 붕괴',
  H80: '“이의 있습니다!”',
  I90: '재판장의 마지막 질문',
  J100: '최후 변론',
  J110: '판결',
} as const satisfies Partial<Record<SceneId, string>>;

type MainId = keyof typeof MAIN_TITLE;

/**
 * 갈래 장면(A11-B 등)은 갈라져 나온 본 장면의 제목을 그대로 둔다 — 갈래 제목은 고른 선택지를 드러낸다.
 * 엔딩(GUILTY-*, NOTGUILTY-*)도 판결을 드러내지 않게 "판결". QM 은 M65 생각 기록의 이어짐.
 */
export function sceneTitle(id: SceneId): string | null {
  if (id in MAIN_TITLE) return MAIN_TITLE[id as MainId];
  if (id === 'QM') return MAIN_TITLE.M65;
  if (id.startsWith('GUILTY-') || id.startsWith('NOTGUILTY-')) return MAIN_TITLE.J110;
  // A11-B → A10, G71-C → G70
  const branch = /^([A-Z])(\d+)1-[A-C]$/.exec(id);
  if (branch) {
    const parent = `${branch[1]}${branch[2]}0`;
    if (parent in MAIN_TITLE) return MAIN_TITLE[parent as MainId];
  }
  return null;
}
