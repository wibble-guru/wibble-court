import type { Prompt } from '@/engine/types';

/**
 * 생각 기록 질문 — 대본 1부 `[생각 기록]`: 공개 판결이 아닌 재판장 개인의 판단 체크, 검사·변호인에게 노출되지 않음.
 * 이 질문들은 법정 선택지가 아니라 기록장(L-08) 화면으로 묻는다. 나머지(Q1 ~ Q9)는 법정 질문.
 */
const THOUGHT_PROMPTS = new Set([
  'Q0',
  'M65',
  'QM',
  'QG',
  'QJ',
  'Q10-1',
  'Q10-2',
  'Q10-3',
  'Q10-4',
]);

export function isThoughtPrompt(prompt: Prompt): boolean {
  return THOUGHT_PROMPTS.has(prompt.id);
}

/** 되돌릴 수 없는 최종 판결은 고른 뒤 한 번 더 확정받는다 (판결 대사를 보이고 [기록하기]) */
export function needsConfirm(prompt: Prompt): boolean {
  return prompt.fields.some((field) => field.target === 'verdict');
}
