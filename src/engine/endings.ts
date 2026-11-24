import type { EndingId, StoryState } from './types';

/**
 * 판결 엔딩 (4부). J110 의 판결(Q10-1) × 보충 심리 우선순위(Q7 → G71-A/B/C) 로 정한다.
 * Q7: A 사망 추정 시간 범위 / B 통화 음성 / C 익명 메시지 경위.
 */
export function resolveEnding(state: StoryState): EndingId {
  const { verdict } = state.judgment;
  const priority = state.answers.q7_priority;
  if (!verdict || !priority) {
    throw new Error('엔딩을 정하려면 판결(Q10-1)과 Q7 답이 필요합니다');
  }
  return `${verdict === 'GUILTY' ? 'GUILTY' : 'NOTGUILTY'}-${priority}`;
}

export const ENDING_IDS: EndingId[] = [
  'GUILTY-A',
  'GUILTY-B',
  'GUILTY-C',
  'NOTGUILTY-A',
  'NOTGUILTY-B',
  'NOTGUILTY-C',
];
