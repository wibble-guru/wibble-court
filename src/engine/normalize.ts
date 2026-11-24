import type { Answers, Judgment, TargetKey } from './types';

/**
 * 대본 안에서 같은 항목이 다른 이름으로 불리는 경우를 한 이름으로 모은다 (5.8 "필드 오류 방지").
 * 답을 저장할 때는 반드시 이 함수를 거친다.
 */
const ALIASES: Record<string, TargetKey> = {
  q0_confidence: 'confidence_start',
  'q10-3': 'final_reason',
  q10_final_reason: 'final_reason',
  decisive_reason: 'final_reason',
};

const ANSWER_KEYS = new Set<string>([
  'q1_audio',
  'q2_memory',
  'q3_call',
  'q4_witness',
  'q5_sms',
  'q6_motive',
  'q7_priority',
  'q8_inference',
  'q9_last_question',
  'qm_basis',
  'qg_reconsider',
  'qj_persuasion',
  'final_reason',
] satisfies (keyof Answers)[]);

const JUDGMENT_KEYS = new Set<string>([
  'impression_start',
  'confidence_start',
  'impression_mid',
  'guilt_probability_mid',
  'confidence_mid',
  'anchor_mid',
  'verdict',
  'confidence_final',
  'remaining_question',
] satisfies (keyof Judgment)[]);

/** 입력 이름 → 대본 5.8 기준 이름과 저장 위치. 모르는 이름이면 null */
export function normalizeKey(
  name: string,
): { key: TargetKey; group: 'answers' | 'judgment' } | null {
  const key = ALIASES[name] ?? name;
  if (ANSWER_KEYS.has(key)) return { key: key as TargetKey, group: 'answers' };
  if (JUDGMENT_KEYS.has(key)) return { key: key as TargetKey, group: 'judgment' };
  return null;
}
