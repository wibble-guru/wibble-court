import { afterEach, describe, expect, it, vi } from 'vitest';
import { matches } from '@/engine/conditions';
import {
  answer,
  canEnter,
  checkGraph,
  enterScene,
  initialState,
  leaveScene,
  missingFields,
  nextSceneId,
  type AnswerInput,
} from '@/engine/engine';
import { ENDING_IDS, resolveEnding } from '@/engine/endings';
import { normalizeKey } from '@/engine/normalize';
import type { ABC, Option, Scene, SceneId, SceneMap, StoryState } from '@/engine/types';

/*
 * 대본 구조를 흉내 낸 가짜 장면 (문장은 테스트용). 실제 대본 데이터는 2단계에서 들어온다.
 * P00(Q0) → A10(Q1 3지 분기) → A11-A/B/C → D40(조건부 대사 + QM 4지 합류) → G70(Q7 분기) → G71-A/B/C → J110(Q10) → 엔딩
 */
const abc = (prefix: string, next: (k: ABC) => SceneId | undefined): Option[] =>
  (['A', 'B', 'C'] as const).map((key) => ({ key, label: `${prefix}-${key}`, next: next(key) }));

const policy = { A: 'PUBLIC', B: 'PROTECTED', C: 'DEFER' } as const;
const priority = { A: 'DEATH_WINDOW', B: 'VOICE', C: 'MESSAGE_TRACE' } as const;

const SCENES: SceneMap = {
  P00: {
    id: 'P00',
    title: '개정',
    lines: [{ speaker: '재판장', text: '시작합니다.' }],
    prompts: [
      {
        id: 'Q0',
        title: '최초 생각',
        fields: [
          { kind: 'choice', target: 'impression_start', options: abc('Q0', () => undefined) },
          { kind: 'slider', target: 'confidence_start', initial: 50 },
        ],
      },
    ],
    next: 'A10',
  },
  A10: {
    id: 'A10',
    title: '첫 번째 이의',
    lines: [
      { speaker: '검사', text: '재생하겠습니다.' },
      { speaker: '변호인', text: '이의 있습니다.' },
    ],
    prompts: [
      {
        id: 'Q1',
        title: '녹음',
        fields: [
          {
            kind: 'choice',
            target: 'q1_audio',
            options: (['A', 'B', 'C'] as const).map((key) => ({
              key,
              label: `Q1-${key}`,
              judgeLine: `판사-${key}`,
              next: `A11-${key}` as const,
            })),
          },
        ],
      },
    ],
    gain: ['confession-audio'],
    next: 'B20', // 선택지 next 가 우선이라 쓰이지 않아야 한다
  },
  ...Object.fromEntries(
    (['A', 'B', 'C'] as const).map((key) => [
      `A11-${key}`,
      {
        id: `A11-${key}`,
        title: `A11-${key}`,
        appearsIf: { key: 'q1_audio', eq: key },
        lines: [{ speaker: '검사', text: `A11-${key} 대사` }],
        mutation: { audio_policy: policy[key] },
        next: 'D40',
      } satisfies Scene,
    ]),
  ),
  D40: {
    id: 'D40',
    title: '익명 증인',
    lines: [
      { speaker: '변호인', text: '공개됨', when: { key: 'audio_policy', eq: 'PUBLIC' } },
      { speaker: '검사', text: '보호됨', when: { key: 'audio_policy', eq: 'PROTECTED' } },
      { speaker: '변호인', text: '보류됨', when: { key: 'audio_policy', eq: 'DEFER' } },
      { speaker: '변호인', text: '공통 대사' },
    ],
    prompts: [
      {
        id: 'QM',
        title: '판단 기준',
        fields: [
          {
            kind: 'choice',
            target: 'qm_basis',
            options: (['A', 'B', 'C', 'D'] as const).map((key) => ({ key, label: `QM-${key}` })),
          },
        ],
      },
    ],
    gain: ['x-statement'],
    next: 'G70',
  },
  G70: {
    id: 'G70',
    title: '전제 붕괴',
    lines: [
      { speaker: '재판장', text: '앞서 확인함', when: { key: 'time_reveal_early', eq: true } },
      {
        speaker: '재판장',
        text: '정정하십시오',
        when: { not: { key: 'time_reveal_early', eq: true } },
      },
    ],
    prompts: [
      {
        id: 'Q7',
        title: '보충 심리',
        fields: [
          {
            kind: 'choice',
            target: 'q7_priority',
            options: (['A', 'B', 'C'] as const).map((key) => ({
              key,
              label: `Q7-${key}`,
              next: `G71-${key}` as const,
              mutation: { priority_evidence: priority[key] },
            })),
          },
        ],
      },
    ],
    next: 'H80',
  },
  ...Object.fromEntries(
    (['A', 'B', 'C'] as const).map((key) => [
      `G71-${key}`,
      {
        id: `G71-${key}`,
        title: `G71-${key}`,
        lines: [{ speaker: '감정인', text: `G71-${key}` }],
        gain: key === 'B' ? ['voice-analysis'] : [],
        next: 'J110',
      } satisfies Scene,
    ]),
  ),
  J110: {
    id: 'J110',
    title: '판결',
    lines: [],
    prompts: [
      {
        id: 'Q10-1',
        title: '최종 판결',
        fields: [
          {
            kind: 'choice',
            target: 'verdict',
            options: [
              { key: 'A', label: '유죄', value: 'GUILTY' },
              { key: 'B', label: '무죄', value: 'NOT_GUILTY' },
            ],
          },
        ],
      },
      {
        id: 'Q10-2',
        title: '확신도',
        fields: [{ kind: 'slider', target: 'confidence_final', initial: 50 }],
      },
      {
        id: 'Q10-4',
        title: '남은 의문',
        fields: [
          {
            kind: 'choice',
            target: 'remaining_question',
            options: (['A', 'B', 'C', 'D', 'E', 'F'] as const).map((key) => ({ key, label: key })),
          },
        ],
      },
    ],
    next: { ending: true },
  },
  ...Object.fromEntries(
    ENDING_IDS.map((id) => [id, { id, title: id, lines: [], next: 'RESULT' } satisfies Scene]),
  ),
  RESULT: { id: 'RESULT', title: '결과', lines: [], next: 'END' },
  END: { id: 'END', title: '끝', lines: [], next: 'END' },
};

type Path = { q1: ABC; q7: ABC; verdict: 'GUILTY' | 'NOT_GUILTY'; qm?: 'A' | 'B' | 'C' | 'D' };

/** 한 경로를 처음부터 엔딩까지 진행한다. 지나간 장면 id 와 각 장면에서 보인 대사를 기록 */
function play(path: Path) {
  const inputs: Record<string, AnswerInput> = {
    Q0: { impression_start: 'B', confidence_start: 50 },
    Q1: { q1_audio: path.q1 },
    QM: { qm_basis: path.qm ?? 'A' },
    Q7: { q7_priority: path.q7 },
    'Q10-1': { verdict: path.verdict },
    'Q10-2': { confidence_final: 70 },
    'Q10-4': { remaining_question: 'F' },
  };
  let state = initialState();
  let id: SceneId = 'P00';
  const route: SceneId[] = [];
  const shown: Partial<Record<SceneId, string[]>> = {};
  while (id !== 'RESULT') {
    const scene = SCENES[id]!;
    expect(canEnter(scene, state)).toBe(true);
    shown[id] = enterScene(scene, state).map((l) => l.text);
    for (const prompt of scene.prompts ?? []) {
      const result = answer(state, prompt, inputs[prompt.id]);
      if (!result.ok) throw new Error(`${prompt.id} 누락: ${result.missing}`);
      state = result.state;
    }
    state = leaveScene(state, scene);
    route.push(id);
    id = nextSceneId(scene, state);
  }
  return { state, route, shown };
}

describe('조건', () => {
  it('all / any / not 조합과 아직 정해지지 않은 값', () => {
    const state: StoryState = { ...initialState(), evidence: { time_reveal_early: true } };
    expect(matches({ key: 'time_reveal_early', eq: true }, state)).toBe(true);
    expect(matches({ key: 'audio_policy', eq: 'PUBLIC' }, state)).toBe(false);
    expect(matches({ not: { key: 'audio_policy', eq: 'PUBLIC' } }, state)).toBe(true);
    expect(
      matches(
        {
          all: [
            { key: 'time_reveal_early', eq: true },
            { key: 'q1_audio', eq: 'A' },
          ],
        },
        state,
      ),
    ).toBe(false);
    expect(
      matches(
        {
          any: [
            { key: 'time_reveal_early', eq: true },
            { key: 'q1_audio', eq: 'A' },
          ],
        },
        state,
      ),
    ).toBe(true);
  });
});

describe('진행', () => {
  it('3지 분기가 각 분기 장면을 거쳐 같은 장면으로 합류한다', () => {
    for (const q1 of ['A', 'B', 'C'] as const) {
      const { route } = play({ q1, q7: 'A', verdict: 'GUILTY' });
      expect(route.slice(0, 4)).toEqual(['P00', 'A10', `A11-${q1}`, 'D40']);
    }
  });

  it('조건부 대사는 이전 선택에 따라 장면에 들어가기 전에 정해진다', () => {
    expect(play({ q1: 'A', q7: 'A', verdict: 'GUILTY' }).shown.D40).toEqual([
      '공개됨',
      '공통 대사',
    ]);
    expect(play({ q1: 'B', q7: 'A', verdict: 'GUILTY' }).shown.D40).toEqual([
      '보호됨',
      '공통 대사',
    ]);
    expect(play({ q1: 'C', q7: 'A', verdict: 'GUILTY' }).shown.D40).toEqual([
      '보류됨',
      '공통 대사',
    ]);
    expect(play({ q1: 'A', q7: 'A', verdict: 'GUILTY' }).shown.G70).toEqual(['정정하십시오']);
  });

  it('4지선다는 어느 것을 골라도 같은 다음 장면이다', () => {
    const next = (['A', 'B', 'C', 'D'] as const).map(
      (qm) => play({ q1: 'A', q7: 'A', verdict: 'GUILTY', qm }).route[4],
    );
    expect(new Set(next)).toEqual(new Set(['G70']));
  });

  it('분기 장면은 그 선택을 한 경로에서만 들어올 수 있다', () => {
    const state = { ...initialState(), answers: { q1_audio: 'A' as const } };
    expect(canEnter(SCENES['A11-A']!, state)).toBe(true);
    expect(canEnter(SCENES['A11-B']!, state)).toBe(false);
  });

  it('저장 값은 장면을 떠날 때 반영되고, 고른 경로의 증거만 쌓인다', () => {
    const scene = SCENES['A11-B']!;
    const before = { ...initialState(), answers: { q1_audio: 'B' as const } };
    expect(enterScene(scene, before)).toHaveLength(1);
    expect(before.evidence.audio_policy).toBeUndefined();
    expect(leaveScene(before, scene).evidence.audio_policy).toBe('PROTECTED');

    const a = play({ q1: 'A', q7: 'A', verdict: 'GUILTY' }).state;
    const b = play({ q1: 'A', q7: 'B', verdict: 'GUILTY' }).state;
    expect(a.acquired).toEqual(['confession-audio', 'x-statement']);
    expect(b.acquired).toEqual(['confession-audio', 'x-statement', 'voice-analysis']);
    expect(b.evidence.priority_evidence).toBe('VOICE');
  });

  it('방문 기록은 중복 없이 순서대로 남는다', () => {
    const { state, route } = play({ q1: 'C', q7: 'C', verdict: 'NOT_GUILTY' });
    expect(state.visited).toEqual(route);
    const again = leaveScene(state, SCENES.P00!);
    expect(again.visited).toEqual(route);
  });
});

describe('질문', () => {
  const q0 = SCENES.P00!.prompts![0];
  const q104 = SCENES.J110!.prompts![2];

  it('빠진 항목이 있으면 다음으로 못 가고 상태도 그대로다', () => {
    const state = initialState();
    expect(missingFields(q0, { impression_start: 'A' })).toEqual(['confidence_start']);
    expect(missingFields(q104, {})).toEqual(['remaining_question']);
    expect(missingFields(q104, { remaining_question: 'Z' })).toEqual(['remaining_question']);
    const result = answer(state, q104, {});
    expect(result.ok).toBe(false);
    expect(state.judgment).toEqual({});
  });

  it('슬라이더 값은 0~100 정수로 저장된다', () => {
    const result = answer(initialState(), q0, { impression_start: 'A', confidence_start: 140.6 });
    expect(result.ok && result.state.judgment.confidence_start).toBe(100);
  });

  it('대본에서 이름이 다른 항목은 하나로 모인다 (5.8 필드 오류 방지)', () => {
    expect(normalizeKey('q0_confidence')).toEqual({ key: 'confidence_start', group: 'judgment' });
    expect(normalizeKey('decisive_reason')).toEqual({ key: 'final_reason', group: 'answers' });
    expect(normalizeKey('q10-3')).toEqual({ key: 'final_reason', group: 'answers' });
    expect(normalizeKey('q10_final_reason')).toEqual({ key: 'final_reason', group: 'answers' });
    expect(normalizeKey('verdict')).toEqual({ key: 'verdict', group: 'judgment' });
    expect(normalizeKey('unknown')).toBeNull();
  });
});

describe('엔딩', () => {
  it('판결 × Q7 로 엔딩 6개가 모두 맞게 정해진다', () => {
    for (const verdict of ['GUILTY', 'NOT_GUILTY'] as const) {
      for (const q7 of ['A', 'B', 'C'] as const) {
        const { route } = play({ q1: 'B', q7, verdict });
        expect(route.at(-1)).toBe(`${verdict === 'GUILTY' ? 'GUILTY' : 'NOTGUILTY'}-${q7}`);
      }
    }
  });

  it('판결이나 Q7 이 없으면 엔딩을 정하지 않는다', () => {
    expect(() => resolveEnding(initialState())).toThrow();
  });

  it('판결만 바꿔도 채점 입력(answers)은 같다 (7.3)', () => {
    const guilty = play({ q1: 'A', q7: 'B', verdict: 'GUILTY' }).state;
    const notGuilty = play({ q1: 'A', q7: 'B', verdict: 'NOT_GUILTY' }).state;
    expect(guilty.answers).toEqual(notGuilty.answers);
    expect(guilty.answers).not.toHaveProperty('verdict');
    expect(guilty.judgment.verdict).not.toBe(notGuilty.judgment.verdict);
  });
});

describe('연결 검사', () => {
  it('정상 데이터에는 문제가 없다', () => {
    expect(checkGraph(SCENES, 'P00')).toEqual({ missing: [], unreachable: [] });
  });

  it('없는 next 와 도달할 수 없는 장면을 찾아낸다', () => {
    const broken: SceneMap = {
      ...SCENES,
      D40: { ...SCENES.D40!, next: 'F60' },
      B20: { id: 'B20', title: '고립', lines: [], next: 'C30' },
    };
    const { missing, unreachable } = checkGraph(broken, 'P00');
    expect(missing).toEqual([{ from: 'D40', to: 'F60' }]);
    expect(unreachable).toEqual(expect.arrayContaining(['B20', 'G70', 'J110']));
  });
});

describe('저장소', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('localStorage 가 예외를 던져도 진행과 저장 호출이 멈추지 않는다', async () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    vi.stubGlobal('window', {
      localStorage: { getItem: blocked, setItem: blocked, removeItem: blocked },
    });
    const { useStory } = await import('@/store/story');
    expect(useStory.getState().save).toBeNull();
    const save = {
      cursor: { sceneId: 'A10' as const, at: 'line' as const, index: 1 },
      story: initialState(),
    };
    expect(() => useStory.getState().saveStory(save)).not.toThrow();
    expect(useStory.getState().save).toEqual(save);
    useStory.getState().clearStory();
    expect(useStory.getState().save).toBeNull();
  });

  it('저장된 진행을 다시 읽어 온다', async () => {
    const data = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => data.set(k, v),
        removeItem: (k: string) => data.delete(k),
      },
    });
    const first = await import('@/store/story');
    const save = {
      cursor: { sceneId: 'D40' as const, at: 'prompt' as const, index: 0 },
      story: initialState(),
    };
    first.useStory.getState().saveStory(save);
    expect(data.has('wibble-court:story')).toBe(true);

    vi.resetModules();
    const second = await import('@/store/story');
    await second.useStory.persist.rehydrate();
    expect(second.useStory.getState().save).toEqual(save);
  });
});
