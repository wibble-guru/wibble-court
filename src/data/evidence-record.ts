/**
 * 증거 모달의 기록 (계획서 59). 증거 → 종류 + 대본 줄 참조(장면, 줄 번호).
 * 문장은 장면 데이터에서 꺼낸다 — 여기에 다시 쓰지 않는다 (창작 0, evidence-record.test 가 확인).
 * 지나온 장면의 줄만, 지금 장면은 지금 대사까지만 보인다.
 */
import type { EvidenceId, Line, SceneId, TrialSceneId } from '@/engine/types';
import { SCENES } from './scenes';

/** 대본에 없는 화면 문구 (계획서 59 승인) */
export const RECORD_KIND = {
  transcript: '녹취록',
  statement: '진술',
  report: '감정서',
  document: '문서',
  message: '메시지',
  timeline: '시간표',
} as const;
export const RECORD_NOTE = '지나온 심리에서 나온 부분만 보입니다.';

type Ref = readonly [TrialSceneId, number];

export const RECORDS: Record<EvidenceId, { kind: keyof typeof RECORD_KIND; refs: Ref[] }> = {
  'confession-audio': {
    kind: 'transcript',
    refs: [
      ['A10', 2],
      ['A11-A', 1],
      ['A11-A', 2],
      ['A11-B', 1],
      ['A11-B', 2],
    ],
  },
  'yura-statement': {
    kind: 'statement',
    refs: [
      ['B20', 2],
      ['B20', 6],
      ['B21-A', 1],
      ['B21-A', 3],
      ['B21-A', 5],
      ['B21-B', 2],
      ['B21-B', 5],
      ['B21-C', 4],
      ['F61-C', 3],
    ],
  },
  'call-2212': {
    kind: 'transcript',
    refs: [
      ['C30', 2],
      ['C30', 3],
      ['C30', 4],
      ['C30', 5],
      ['C30', 6], // 연출: 연결이 끊긴 뒤 2초간 침묵.
    ],
  },
  'voice-analysis': {
    kind: 'report',
    refs: [
      ['C31-A', 0],
      ['C31-A', 2],
      ['C31-A', 4],
    ],
  },
  'email-draft': {
    kind: 'document',
    refs: [
      ['C31-B', 0],
      ['C31-B', 2],
    ],
  },
  timeline: {
    kind: 'timeline',
    refs: [
      ['C31-C', 0],
      ['C31-C', 2],
      ['G70', 1],
      ['G70', 2],
      ['G70', 6],
    ],
  },
  'x-statement': {
    kind: 'statement',
    refs: [
      ['D40', 4],
      ['D40', 6],
      ['D41-A', 2],
      ['D41-A', 4],
      ['D41-B', 2],
    ],
  },
  'anon-messages': {
    kind: 'message',
    refs: [
      ['E50', 2],
      ['E50', 3],
      ['E51-B', 1],
      ['E51-B', 3],
    ],
  },
  'message-forensics': {
    kind: 'report',
    refs: [
      ['E51-A', 0],
      ['E51-A', 2],
    ],
  },
  'text-2154': {
    kind: 'message',
    refs: [
      ['F60', 2],
      ['F60', 3],
    ],
  },
};

/** 지금 장면과 그 장면에서 지금까지 나온 대본 줄 번호 (질문 단계면 장면 끝까지) */
export type RecordCursor = { sceneId: SceneId; upTo: number };

/** 이 증거에서 플레이어가 본 줄 */
export function recordLines(
  id: EvidenceId,
  visited: readonly SceneId[],
  cursor: RecordCursor | null,
): Line[] {
  return RECORDS[id].refs
    .filter(([scene, index]) =>
      // 지금 장면은 visited 에 들어 있어도 지금 줄까지만
      cursor !== null && cursor.sceneId === scene ? index <= cursor.upTo : visited.includes(scene),
    )
    .map(([scene, index]) => SCENES[scene]!.lines[index]!);
}
