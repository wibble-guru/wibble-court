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
import type { ABC, Line, Scene, SceneId, StoryState } from '@/engine/types';
import { SCENES, START_SCENE } from '.';

const LETTERS = ['A', 'B', 'C'] as const;
/** 분기 질문 Q1~Q9 (답 이름 순서 = 장면 순서) */
const QUESTIONS = [
  'q1_audio',
  'q2_memory',
  'q3_call',
  'q4_witness',
  'q5_sms',
  'q6_motive',
  'q7_priority',
  'q8_inference',
  'q9_last_question',
] as const;
const BRANCHES = ['A11', 'B21', 'C31', 'D41', 'E51', 'F61', 'G71', 'H81', 'I91'];
const MAIN = ['A10', 'B20', 'C30', 'D40', 'E50', 'F60', 'G70', 'H80', 'I90'];

type Verdict = 'GUILTY' | 'NOT_GUILTY';

function scene(id: SceneId): Scene {
  const found = SCENES[id];
  if (!found) throw new Error(`없는 장면: ${id}`);
  return found;
}

/** Q1~Q9 선택과 판결로 P00 부터 엔딩까지 진행 (생각 기록 질문은 고정값) */
function play(picks: ABC[], verdict: Verdict = 'GUILTY', confidence = 50) {
  const input: AnswerInput = {
    impression_start: 'B',
    confidence_start: 50,
    impression_mid: 'D',
    guilt_probability_mid: 40,
    confidence_mid: 60,
    anchor_mid: 'G',
    qm_basis: 'A',
    qg_reconsider: 'B',
    qj_persuasion: 'C',
    verdict,
    confidence_final: confidence,
    final_reason: 'F',
    remaining_question: 'F',
    ...Object.fromEntries(QUESTIONS.map((q, i) => [q, picks[i]])),
  };
  let state: StoryState = initialState();
  let id: SceneId = START_SCENE;
  const path: SceneId[] = [];
  const shown = new Map<SceneId, Line[]>();
  while (SCENES[id]) {
    const current = scene(id);
    expect(canEnter(current, state), `${id} 에 들어올 수 없음`).toBe(true);
    shown.set(id, enterScene(current, state));
    for (const prompt of current.prompts ?? []) {
      const result = answer(state, prompt, input);
      if (!result.ok) throw new Error(`${id} ${prompt.id} 빠진 답: ${result.missing.join(',')}`);
      state = result.state;
    }
    state = leaveScene(state, current);
    path.push(id);
    id = nextSceneId(current, state);
  }
  expect(id).toBe('RESULT');
  return { state, path, shown };
}

const combos = (n: number): ABC[][] =>
  n === 0 ? [[]] : combos(n - 1).flatMap((rest) => LETTERS.map((l) => [...rest, l]));

/** 고른 기호로 대본 순서의 경로를 만든다 */
function expectedPath(picks: ABC[], verdict: Verdict): SceneId[] {
  const path: string[] = ['P00'];
  MAIN.forEach((main, i) => {
    if (main === 'G70') path.push('M65', 'QM');
    path.push(main, `${BRANCHES[i]}-${picks[i]}`);
  });
  path.push('J100', 'J110', `${verdict === 'GUILTY' ? 'GUILTY' : 'NOTGUILTY'}-${picks[6]}`);
  return path as SceneId[];
}

describe('대본 본편 P00 ~ 엔딩', () => {
  it('본편 48장면이 모두 있고 진실 공개 장면은 없다', () => {
    const ids = Object.keys(SCENES);
    expect(ids).toHaveLength(48);
    expect(ids.some((id) => id.startsWith('TRUTH'))).toBe(false);
  });

  it('연결 검사: 없는 장면은 RESULT(5단계) 하나, 못 가는 장면은 RESULT 뒤의 EPILOGUE 하나', () => {
    const { missing, unreachable } = checkGraph(SCENES, START_SCENE);
    expect(new Set(missing.map((m) => m.to))).toEqual(new Set(['RESULT']));
    expect(unreachable).toEqual(['EPILOGUE']);
    expect(scene('EPILOGUE').next).toBe('TRUTH-GATE');
  });

  it('Q1~Q6 의 729 조합 모두 고른 분기 장면을 거쳐 엔딩까지 간다', () => {
    for (const picks of combos(6)) {
      const full = [...picks, 'A', 'B', 'C'] as ABC[];
      const { path, state } = play(full);
      expect(path).toEqual(expectedPath(full, 'GUILTY'));
      expect(state.visited).toEqual(path);
    }
  });

  it('Q7~Q9 의 27 조합 × 판결 2 도 모두 엔딩까지 간다', () => {
    for (const tail of combos(3)) {
      for (const verdict of ['GUILTY', 'NOT_GUILTY'] as const) {
        const full = ['A', 'A', 'A', 'A', 'A', 'A', ...tail] as ABC[];
        expect(play(full, verdict).path).toEqual(expectedPath(full, verdict));
      }
    }
  });

  it('분기 장면은 고른 선택지에서만 들어올 수 있다', () => {
    const { state } = play(['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B']);
    for (const p of BRANCHES) {
      expect(canEnter(scene(`${p}-A` as SceneId), state)).toBe(false);
      expect(canEnter(scene(`${p}-B` as SceneId), state)).toBe(true);
      expect(canEnter(scene(`${p}-C` as SceneId), state)).toBe(false);
    }
    expect(canEnter(scene('GUILTY-B'), state)).toBe(true);
    expect(canEnter(scene('NOTGUILTY-B'), state)).toBe(false);
    expect(canEnter(scene('GUILTY-A'), state)).toBe(false);
  });

  it('D40 앞 조건부 대사는 Q1 선택에 따라 하나만 나온다', () => {
    const conditional = scene('D40').lines.filter((l) => l.when);
    expect(conditional).toHaveLength(3);
    LETTERS.forEach((q1, i) => {
      const lines = play([q1, 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']).shown.get('D40')!;
      expect(lines.filter((l) => l.when)).toEqual([conditional[i]]);
    });
  });

  it('G70 재판장 대사는 Q3 에서 시간표(C)를 골랐는지에 따라 하나만 나온다', () => {
    const [early, other] = scene('G70').lines.filter((l) => l.when);
    for (const q3 of LETTERS) {
      const lines = play(['A', 'A', q3, 'A', 'A', 'A', 'A', 'A', 'A']).shown.get('G70')!;
      expect(lines.filter((l) => l.when)).toEqual([q3 === 'C' ? early : other]);
    }
  });

  it('J100 조건부 최후 변론: Q1·Q4·Q5·Q7 81 조합 × 판결 2 모두 그룹마다 정확히 한 줄', () => {
    const conditional = scene('J100').lines.filter((l) => l.when);
    expect(conditional).toHaveLength(12);
    const groupOf = (l: Line) => (l.when && 'key' in l.when ? l.when.key : '');
    for (const [q1, q4, q5, q7] of combos(4)) {
      for (const verdict of ['GUILTY', 'NOT_GUILTY'] as const) {
        const picks: ABC[] = [q1, 'A', 'A', q4, q5, 'A', q7, 'A', 'A'];
        const { shown, state } = play(picks, verdict);
        const lines = shown.get('J100')!.filter((l) => l.when);
        expect(lines.map(groupOf)).toEqual([
          'audio_policy',
          'priority_evidence',
          'witness_policy',
          'sms_fact',
        ]);
        for (const l of lines) {
          if (!l.when || !('key' in l.when)) throw new Error('조건 형식');
          expect(state.evidence[l.when.key as keyof StoryState['evidence']]).toBe(l.when.eq);
        }
      }
    }
  });

  it('엔딩은 판결 × Q7 로 정해진다', () => {
    for (const q7 of LETTERS) {
      const picks = ['A', 'A', 'A', 'A', 'A', 'A', q7, 'A', 'A'] as ABC[];
      expect(play(picks, 'GUILTY').path.at(-1)).toBe(`GUILTY-${q7}`);
      expect(play(picks, 'NOT_GUILTY').path.at(-1)).toBe(`NOTGUILTY-${q7}`);
    }
  });

  it('판결·확신도만 바꾸면 답(answers)은 같고 판단 기록과 엔딩만 달라진다 (7.3)', () => {
    const picks = ['C', 'B', 'A', 'C', 'B', 'A', 'B', 'C', 'A'] as ABC[];
    const guilty = play(picks, 'GUILTY', 90);
    const notGuilty = play(picks, 'NOT_GUILTY', 10);
    expect(guilty.state.answers).toEqual(notGuilty.state.answers);
    expect(guilty.state.evidence).toEqual(notGuilty.state.evidence);
    expect(guilty.state.judgment.verdict).toBe('GUILTY');
    expect(notGuilty.state.judgment.confidence_final).toBe(10);
  });

  it('저장·획득 값이 대본과 같다', () => {
    expect(play(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']).state.evidence).toEqual({
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
      priority_evidence: 'DEATH_WINDOW',
      death_time: 'UNRESOLVED',
      inference_policy: 'FULL_ARGUMENT',
      final_question: 'DEFENDANT_REASON',
    });
    expect(play(['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B']).state.evidence).toEqual({
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
      priority_evidence: 'VOICE',
      voice_identity: 'UNRESOLVED',
      inference_policy: 'PINPOINT_LINK',
      final_question: 'PROSECUTION_LINK',
    });
    expect(play(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C']).state.evidence).toEqual({
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
      priority_evidence: 'MESSAGE_TRACE',
      sender_identity: 'UNKNOWN',
      inference_policy: 'SEPARATE_FACTS',
      final_question: 'DEFENSE_CORROBORATION',
    });
  });

  it('고른 경로의 증거만 쌓인다 (7.4: Q3-A 경로에 이메일 초안 없음)', () => {
    expect(play(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']).state.acquired).toEqual([
      'confession-audio',
      'yura-statement',
      'call-2212',
      'voice-analysis',
      'x-statement',
      'anon-messages',
      'message-forensics',
      'text-2154',
    ]);
    for (const picks of combos(6)) {
      const acquired = play([...picks, 'A', 'A', 'A']).state.acquired;
      expect(acquired.includes('email-draft')).toBe(picks[2] === 'B');
      expect(acquired.includes('voice-analysis')).toBe(picks[2] === 'A');
      expect(acquired.includes('timeline')).toBe(picks[2] === 'C');
      expect(acquired.includes('message-forensics')).toBe(picks[4] === 'A');
    }
  });

  it('생각 기록·판결은 판단 기록(judgment)에, 성향 답은 answers 에 나뉘어 저장된다', () => {
    const { state } = play(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'], 'NOT_GUILTY', 70);
    expect(state.judgment).toEqual({
      impression_start: 'B',
      confidence_start: 50,
      impression_mid: 'D',
      guilt_probability_mid: 40,
      confidence_mid: 60,
      anchor_mid: 'G',
      verdict: 'NOT_GUILTY',
      confidence_final: 70,
      remaining_question: 'F',
    });
    expect(Object.keys(state.answers).sort()).toEqual(
      [...QUESTIONS, 'qm_basis', 'qg_reconsider', 'qj_persuasion', 'final_reason'].sort(),
    );
  });
});
