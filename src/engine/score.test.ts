import { describe, expect, it } from 'vitest';
import { analyze, computedMax, MAX, resultId } from './score';
import type { Answers } from './types';

/** 6부 예시의 `Q1=A, …, Q10-3=C` 표기를 answers 로 */
function parse(spec: string): Answers {
  const map: Record<string, keyof Answers> = {
    Q1: 'q1_audio', Q2: 'q2_memory', Q3: 'q3_call', Q4: 'q4_witness', Q5: 'q5_sms',
    Q6: 'q6_motive', Q7: 'q7_priority', Q8: 'q8_inference', Q9: 'q9_last_question',
    QM: 'qm_basis', QG: 'qg_reconsider', QJ: 'qj_persuasion', 'Q10-3': 'final_reason',
  }; // prettier-ignore
  return Object.fromEntries(
    spec.split(', ').map((pair) => {
      const [q, v] = pair.split('=');
      return [map[q], v];
    }),
  ) as Answers;
}

// 대본 6부 플레이 예시 그대로
const A = parse('Q1=A, Q2=C, Q3=A, Q4=A, Q5=A, Q6=C, Q7=B, Q8=C, Q9=C, QM=A, QG=A, QJ=A, Q10-3=C');
const B = parse('Q1=B, Q2=B, Q3=C, Q4=B, Q5=C, Q6=A, Q7=A, Q8=B, Q9=B, QM=B, QG=B, QJ=B, Q10-3=E');
const C = parse('Q1=B, Q2=A, Q3=B, Q4=B, Q5=B, Q6=B, Q7=C, Q8=A, Q9=A, QM=C, QG=C, QJ=C, Q10-3=B');
const D = parse('Q1=B, Q2=A, Q3=C, Q4=B, Q5=C, Q6=A, Q7=B, Q8=C, Q9=C, QM=D, QG=D, QJ=D, Q10-3=E');
const E = parse('Q1=A, Q2=B, Q3=A, Q4=A, Q5=C, Q6=C, Q7=C, Q8=B, Q9=B, QM=A, QG=B, QJ=A, Q10-3=F');

describe('성향 채점 (5.2, 5.8)', () => {
  it('MAX 는 표에서 계산한 값과 같다 (O17 L16 C17 P14)', () => {
    expect(computedMax()).toEqual(MAX);
  });

  it('6부 예시 A~D 는 단일 성향 O, L, C, P', () => {
    expect([A, B, C, D].map((x) => resultId(analyze(x)))).toEqual([
      'court-o',
      'court-l',
      'court-c',
      'court-p',
    ]);
  });

  it('6부 예시 E 는 O+L 복합', () => {
    const e = analyze(E);
    expect(e.status).toBe('READY');
    expect(e.blended).toBe(true);
    expect(new Set([e.primary, e.secondary])).toEqual(new Set(['O', 'L']));
    expect(resultId(e)).toBe('court-ol');
  });

  it('Q7 은 점수에 들어가지 않는다', () => {
    for (const q7 of ['A', 'B', 'C'] as const) {
      expect(analyze({ ...A, q7_priority: q7 }).raw).toEqual(analyze(A).raw);
    }
  });

  it('입력이 거의 없으면 판정 보류(court-mixed)', () => {
    expect(resultId(analyze({ q1_audio: 'B' }))).toBe('court-mixed');
  });

  it('동률이면 QM→QG→QJ 에서 더 자주 고른 축이 먼저', () => {
    // O(Q5-A)와 C(QG-C)가 2/17 로 같은 비율. 판단 기준 질문은 C 만 골랐으므로 O 보다 C 가 먼저
    const tie = analyze({ q5_sms: 'A', qg_reconsider: 'C' });
    expect(tie.relative.O).toBe(tie.relative.C);
    expect([tie.primary, tie.secondary]).toEqual(['C', 'O']);
  });
});
