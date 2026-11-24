/**
 * 심리 성향 채점 (대본 5.2 확정 채점표, 5.8 의사 코드).
 * 입력은 answers 만 — 판결·확신도·진실 확인 여부는 타입상 들어올 수 없다 (5.2, 7.3).
 */
import type { Answers } from './types';

export type Axis = 'O' | 'L' | 'C' | 'P';
export const AXES: Axis[] = ['O', 'L', 'C', 'P'];

type Points = Partial<Record<Axis, number>>;
type ScoredKey = Exclude<keyof Answers, 'q7_priority'>; // Q7 은 엔딩 분기만, 점수 0

/** 5.2 표 그대로 */
const SCORE: Record<ScoredKey, Record<string, Points>> = {
  q1_audio: { A: { O: 1, P: 1 }, B: { P: 2 }, C: { O: 1, P: 1 } },
  q2_memory: { A: { C: 1, P: 1 }, B: { O: 1, L: 1 }, C: { O: 2 } },
  q3_call: { A: { O: 2 }, B: { C: 2 }, C: { O: 1, L: 1 } },
  q4_witness: { A: { O: 1, P: 1 }, B: { P: 2 }, C: { O: 1, P: 1 } },
  q5_sms: { A: { O: 2 }, B: { C: 2 }, C: { L: 2 } },
  q6_motive: { A: { L: 1, C: 1 }, B: { C: 2 }, C: { O: 2 } },
  q8_inference: { A: { L: 1, C: 1 }, B: { L: 2 }, C: { L: 1, P: 1 } },
  q9_last_question: { A: { C: 2 }, B: { L: 2 }, C: { L: 1, P: 1 } },
  qm_basis: { A: { O: 2 }, B: { L: 2 }, C: { C: 2 }, D: { P: 2 } },
  qg_reconsider: { A: { O: 2 }, B: { L: 2 }, C: { C: 2 }, D: { P: 2 } },
  qj_persuasion: { A: { O: 2 }, B: { L: 2 }, C: { C: 2 }, D: { P: 2 } },
  // Q10-3 자기보고: 보조 점수
  final_reason: { A: { L: 1 }, B: { C: 1 }, C: { O: 1 }, D: { O: 1 }, E: { P: 1 }, F: { L: 1 } },
};

/** 5.2 규칙 2 의 질문별 최대 가능 합. 표가 바뀌면 같이 바뀌는지 테스트가 확인 */
export const MAX: Record<Axis, number> = { O: 17, L: 16, C: 17, P: 14 };

/** 동률일 때 우선할 판단 기준 질문 (5.2 규칙 7) */
const CRITERIA: ScoredKey[] = ['qm_basis', 'qg_reconsider', 'qj_persuasion'];
const CRITERIA_AXIS: Record<string, Axis> = { A: 'O', B: 'L', C: 'C', D: 'P' };

export type Analysis = {
  raw: Record<Axis, number>;
  relative: Record<Axis, number>;
  /** 그 축에 점수를 준 질문 수 (5.8 evidence_scenes) */
  scenes: Record<Axis, number>;
  primary: Axis;
  secondary: Axis;
  blended: boolean;
  status: 'READY' | 'INSUFFICIENT';
};

export function analyze(answers: Partial<Answers>): Analysis {
  const raw: Record<Axis, number> = { O: 0, L: 0, C: 0, P: 0 };
  const scenes: Record<Axis, number> = { O: 0, L: 0, C: 0, P: 0 };
  for (const [key, mapping] of Object.entries(SCORE) as [ScoredKey, Record<string, Points>][]) {
    const chosen = answers[key];
    if (!chosen) continue;
    for (const [axis, pts] of Object.entries(mapping[chosen] ?? {}) as [Axis, number][]) {
      raw[axis] += pts;
      scenes[axis] += 1;
    }
  }
  const relative = Object.fromEntries(AXES.map((a) => [a, raw[a] / MAX[a]])) as Record<
    Axis,
    number
  >;

  const criteria: Record<Axis, number> = { O: 0, L: 0, C: 0, P: 0 };
  for (const key of CRITERIA) {
    const chosen = answers[key];
    if (chosen) criteria[CRITERIA_AXIS[chosen]] += 1;
  }
  const ranked = [...AXES].sort(
    (a, b) =>
      relative[b] - relative[a] || criteria[b] - criteria[a] || AXES.indexOf(a) - AXES.indexOf(b),
  );
  const [primary, secondary] = ranked;
  const status = relative[primary] < 0.3 || scenes[primary] < 3 ? 'INSUFFICIENT' : 'READY';
  const blended = status === 'READY' && relative[primary] - relative[secondary] < 0.08;
  return { raw, relative, scenes, primary, secondary, blended, status };
}

/** 결과 id (사용자 승인 형식). 복합은 O → L → C → P 순서로 고정 */
export function resultId(a: Analysis): string {
  if (a.status === 'INSUFFICIENT') return 'court-mixed';
  if (!a.blended) return `court-${a.primary.toLowerCase()}`;
  const pair = [a.primary, a.secondary].sort((x, y) => AXES.indexOf(x) - AXES.indexOf(y));
  return `court-${pair.join('').toLowerCase()}`;
}

/** 계산용 — 표의 각 질문에서 축별 최대 점수를 더한 값 (MAX 검증용) */
export function computedMax(): Record<Axis, number> {
  const max: Record<Axis, number> = { O: 0, L: 0, C: 0, P: 0 };
  for (const mapping of Object.values(SCORE)) {
    for (const axis of AXES)
      max[axis] += Math.max(0, ...Object.values(mapping).map((p) => p[axis] ?? 0));
  }
  return max;
}
