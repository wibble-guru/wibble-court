import { describe, expect, it } from 'vitest';
import {
  answer,
  canEnter,
  checkGraph,
  enterScene,
  initialState,
  leaveScene,
  nextSceneId,
  type AnswerInput,
} from '@/engine/engine';
import type { ABC, Scene, SceneId, StoryState } from '@/engine/types';
import { SCENES, START_SCENE } from '.';

const LETTERS = ['A', 'B', 'C'] as const;
const QUESTIONS = ['q1_audio', 'q2_memory', 'q3_call', 'q4_witness', 'q5_sms', 'q6_motive'];

function scene(id: SceneId): Scene {
  const found = SCENES[id];
  if (!found) throw new Error(`없는 장면: ${id}`);
  return found;
}

/** Q1~Q6 선택(Q0 는 B·50)으로 P00 부터 M65 직전까지 진행 */
function play(picks: ABC[]): { state: StoryState; path: SceneId[]; lines: string[] } {
  const input: AnswerInput = {
    impression_start: 'B',
    confidence_start: 50,
    ...Object.fromEntries(QUESTIONS.map((q, i) => [q, picks[i]])),
  };
  let state = initialState();
  let id: SceneId = START_SCENE;
  const path: SceneId[] = [];
  const lines: string[] = [];
  while (SCENES[id]) {
    const current = scene(id);
    expect(canEnter(current, state), `${id} 에 들어올 수 없음`).toBe(true);
    lines.push(...enterScene(current, state).map((l) => l.text));
    for (const prompt of current.prompts ?? []) {
      const result = answer(state, prompt, input);
      if (!result.ok) throw new Error(`${id} ${prompt.id} 빠진 답: ${result.missing.join(',')}`);
      state = result.state;
    }
    state = leaveScene(state, current);
    path.push(id);
    id = nextSceneId(current, state);
  }
  expect(id).toBe('M65');
  return { state, path, lines };
}

const ALL_PICKS: ABC[][] = LETTERS.flatMap((a) =>
  LETTERS.flatMap((b) =>
    LETTERS.flatMap((c) =>
      LETTERS.flatMap((d) => LETTERS.flatMap((e) => LETTERS.map((f) => [a, b, c, d, e, f]))),
    ),
  ),
);

describe('대본 3부 P00 ~ F61', () => {
  it('22장면 + 분기 3개씩이 모두 들어 있다', () => {
    expect(Object.keys(SCENES)).toHaveLength(25);
  });

  it('연결 검사: 없는 장면은 M65(2b) 하나뿐, 못 가는 장면 없음', () => {
    const { missing, unreachable } = checkGraph(SCENES, START_SCENE);
    expect(new Set(missing.map((m) => m.to))).toEqual(new Set(['M65']));
    expect(unreachable).toEqual([]);
  });

  it('729 조합 모두 고른 분기 장면을 거쳐 F61 까지 간다', () => {
    expect(ALL_PICKS).toHaveLength(729);
    for (const picks of ALL_PICKS) {
      const { path, state } = play(picks);
      const branches = ['A11', 'B21', 'C31', 'D41', 'E51', 'F61'].map((p, i) => `${p}-${picks[i]}`);
      expect(path).toEqual([
        'P00',
        'A10',
        branches[0],
        'B20',
        branches[1],
        'C30',
        branches[2],
        'D40',
        branches[3],
        'E50',
        branches[4],
        'F60',
        branches[5],
      ]);
      expect(state.visited).toEqual(path);
    }
  });

  it('분기 장면은 고른 선택지에서만 들어올 수 있다', () => {
    const state = play(['B', 'B', 'B', 'B', 'B', 'B']).state;
    for (const p of ['A11', 'B21', 'C31', 'D41', 'E51', 'F61']) {
      expect(canEnter(scene(`${p}-A` as SceneId), state)).toBe(false);
      expect(canEnter(scene(`${p}-B` as SceneId), state)).toBe(true);
      expect(canEnter(scene(`${p}-C` as SceneId), state)).toBe(false);
    }
  });

  it('D40 앞 조건부 대사는 Q1 선택에 따라 하나만 나온다', () => {
    const conditional = scene('D40').lines.filter((l) => l.when);
    expect(conditional).toHaveLength(3);
    LETTERS.forEach((q1, i) => {
      const { lines } = play([q1, 'A', 'A', 'A', 'A', 'A']);
      const shown = conditional.filter((l) => lines.includes(l.text));
      expect(shown).toEqual([conditional[i]]);
    });
  });

  it('저장·획득 값이 대본과 같다', () => {
    expect(play(['A', 'A', 'A', 'A', 'A', 'A']).state.evidence).toEqual({
      audio_policy: 'PUBLIC',
      audio_context: 'HEARD',
      witness_exposure: 'HIGH',
      memory_policy: 'HEAR_CURRENT',
      call_fact: 'VOICE_SIMILAR_NOT_IDENTIFIED',
      time_reveal_early: false,
      witness_policy: 'BROAD_EXAM',
      x_statement: 'DIRECT_WORDS_ONLY',
      x_followup: 'REFUSED',
      sms_fact: 'DEVICE_TRACE_PRESENT',
      sms_context: 'LIMITED',
      motive_focus: 'SELF_INTEREST',
    });
    expect(play(['B', 'B', 'B', 'B', 'B', 'B']).state.evidence).toEqual({
      audio_policy: 'PROTECTED',
      audio_context: 'HEARD',
      witness_exposure: 'LOW',
      memory_policy: 'FIRST_STATEMENT',
      call_fact: 'RELATION_AMBIGUOUS',
      time_reveal_early: false,
      witness_policy: 'PROTECTED_EXAM',
      x_statement: 'OBSERVED_FEAR',
      x_followup: 'AVAILABLE',
      sms_fact: 'DEFENDANT_EXPLANATION',
      sms_context: 'EXPLORED',
      sms_sender: 'UNKNOWN',
      motive_focus: 'PERCEIVED_RISK',
    });
    expect(play(['C', 'C', 'C', 'C', 'C', 'C']).state.evidence).toEqual({
      audio_policy: 'DEFER',
      audio_context: 'NOT_YET_HEARD',
      witness_exposure: 'LOW',
      memory_policy: 'TRACE_CHANGE',
      call_fact: 'TIMELINE_AMBIGUOUS',
      time_reveal_early: true,
      witness_policy: 'DEFER_EXAM',
      x_statement: 'NOT_HEARD',
      x_followup: 'UNKNOWN',
      sms_fact: 'CONTACT_ONLY',
      sms_context: 'UNTESTED',
      motive_focus: 'TESTIMONY_LIMIT',
    });
  });

  it('고른 경로의 증거만 쌓인다 (7.4: Q3-A 경로에 이메일 초안 없음)', () => {
    const a = play(['A', 'A', 'A', 'A', 'A', 'A']).state.acquired;
    expect(a).toEqual([
      'confession-audio',
      'yura-statement',
      'call-2212',
      'voice-analysis',
      'x-statement',
      'anon-messages',
      'message-forensics',
      'text-2154',
    ]);
    for (const picks of ALL_PICKS) {
      const acquired = play(picks).state.acquired;
      expect(acquired.includes('email-draft')).toBe(picks[2] === 'B');
      expect(acquired.includes('voice-analysis')).toBe(picks[2] === 'A');
      expect(acquired.includes('timeline')).toBe(picks[2] === 'C');
      expect(acquired.includes('message-forensics')).toBe(picks[4] === 'A');
    }
  });

  it('Q0 은 성향 답이 아니라 판단 기록에 저장된다', () => {
    const { state } = play(['A', 'A', 'A', 'A', 'A', 'A']);
    expect(state.judgment).toEqual({ impression_start: 'B', confidence_start: 50 });
    expect(Object.keys(state.answers).sort()).toEqual([...QUESTIONS].sort());
  });
});
