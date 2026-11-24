import { describe, expect, it } from 'vitest';
import { SCENES } from '@/data/scenes';
import { isThoughtPrompt, needsConfirm } from './thought';

const prompts = Object.values(SCENES).flatMap((scene) => scene?.prompts ?? []);

describe('생각 기록 질문', () => {
  it('데이터의 질문이 생각 기록 9개와 법정 질문 9개로 나뉜다', () => {
    expect(prompts.filter(isThoughtPrompt).map((p) => p.id)).toEqual([
      'Q0', 'M65', 'QM', 'QG', 'QJ', 'Q10-1', 'Q10-2', 'Q10-3', 'Q10-4',
    ]); // prettier-ignore
    expect(prompts.filter((p) => !isThoughtPrompt(p)).map((p) => p.id)).toEqual([
      'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9',
    ]); // prettier-ignore
  });

  it('판결(Q10-1)만 한 번 더 확정받는다', () => {
    expect(prompts.filter(needsConfirm).map((p) => p.id)).toEqual(['Q10-1']);
  });
});
