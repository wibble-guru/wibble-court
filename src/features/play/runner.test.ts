import { describe, expect, it } from 'vitest';
import { SCENES } from '@/data/scenes';
import type { AnswerInput } from '@/engine/engine';
import type { SceneId } from '@/engine/types';
import {
  advance,
  currentPrompt,
  isSingleChoice,
  resumePlay,
  startPlay,
  submit,
  visibleLines,
  type Play,
} from './runner';

/** 모든 질문에 줄 답 (Q1~Q9 는 A, 판결은 무죄) */
const INPUT: AnswerInput = {
  impression_start: 'B',
  confidence_start: 50,
  q1_audio: 'A',
  q2_memory: 'A',
  q3_call: 'A',
  q4_witness: 'A',
  q5_sms: 'A',
  q6_motive: 'A',
  impression_mid: 'D',
  guilt_probability_mid: 40,
  confidence_mid: 60,
  anchor_mid: 'G',
  qm_basis: 'A',
  qg_reconsider: 'B',
  q7_priority: 'B',
  q8_inference: 'A',
  q9_last_question: 'A',
  qj_persuasion: 'C',
  verdict: 'NOT_GUILTY',
  confidence_final: 70,
  final_reason: 'F',
  remaining_question: 'F',
};

/** 끝까지 진행하며 화면에 보인 대사 수·질문 id·장면 순서를 모은다 */
function playThrough(from: Play = startPlay()) {
  let play = from;
  const scenes: SceneId[] = [];
  const prompts: string[] = [];
  let lines = 0;
  for (let guard = 0; guard < 2000 && play.cursor.at !== 'end'; guard++) {
    const { cursor } = play;
    if (scenes.at(-1) !== cursor.sceneId) scenes.push(cursor.sceneId);
    if (cursor.at === 'line') {
      lines++;
      play = advance(play);
    } else {
      prompts.push(currentPrompt(play)!.id);
      const result = submit(play, INPUT);
      expect(result.missing).toEqual([]);
      play = result.play;
    }
  }
  return { play, scenes, prompts, lines };
}

describe('플레이 진행', () => {
  it('P00 첫 대사에서 시작한다 (연출 줄은 건너뜀)', () => {
    const play = startPlay();
    expect(play.cursor).toEqual({ sceneId: 'P00', at: 'line', index: 0 });
    expect(visibleLines('P00', play.story)[0].speaker).toBe('법원 직원');
  });

  it('P00 → 엔딩까지 가고, 엔딩 뒤 RESULT 에서 끝난다', () => {
    const { play, scenes, prompts } = playThrough();
    expect(scenes[0]).toBe('P00');
    expect(scenes.at(-1)).toBe('NOTGUILTY-B');
    expect(play.cursor).toEqual({ at: 'end', next: 'RESULT' });
    expect(prompts).toEqual([
      'Q0', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'M65', 'QM', 'QG', 'Q7', 'Q8', 'Q9', 'QJ',
      'Q10-1', 'Q10-2', 'Q10-3', 'Q10-4',
    ]); // prettier-ignore
    expect(play.story.judgment.verdict).toBe('NOT_GUILTY');
    expect(play.story.visited.at(-1)).toBe('NOTGUILTY-B');
  });

  it('화면에 연출 줄은 하나도 나오지 않는다', () => {
    for (const id of Object.keys(SCENES) as SceneId[]) {
      const shown = visibleLines(id, startPlay().story);
      expect(shown.some((line) => line.kind === 'direction')).toBe(false);
    }
  });

  it('대사가 없는 장면(M65, QM)은 바로 질문으로 간다', () => {
    let play = startPlay();
    while (
      play.cursor.at !== 'end' &&
      !('sceneId' in play.cursor && play.cursor.sceneId === 'M65')
    ) {
      play = play.cursor.at === 'line' ? advance(play) : submit(play, INPUT).play;
    }
    expect(play.cursor).toEqual({ sceneId: 'M65', at: 'prompt', index: 0 });
    play = submit(play, INPUT).play;
    expect(play.cursor).toEqual({ sceneId: 'QM', at: 'prompt', index: 0 });
  });

  it('답이 빠지면 넘어가지 않는다', () => {
    let play = startPlay();
    while (play.cursor.at === 'line') play = advance(play);
    const { play: same, missing } = submit(play, { confidence_start: 50 });
    expect(missing).toEqual(['impression_start']);
    expect(same).toBe(play);
  });

  it('질문 단계에서는 advance 가 아무것도 바꾸지 않는다', () => {
    let play = startPlay();
    while (play.cursor.at === 'line') play = advance(play);
    expect(advance(play)).toBe(play);
  });

  it('선택 하나뿐인 질문만 고르는 즉시 기록한다', () => {
    const p00 = SCENES.P00!.prompts![0];
    const q1 = SCENES.A10!.prompts![0];
    const q10_2 = SCENES.J110!.prompts![1];
    expect(isSingleChoice(p00)).toBe(false);
    expect(isSingleChoice(q1)).toBe(true);
    expect(isSingleChoice(q10_2)).toBe(false);
  });

  it('저장한 지점(JSON 왕복)에서 이어 하면 끝까지 같은 결과가 나온다', () => {
    let play = startPlay();
    for (let i = 0; i < 60; i++) {
      play = play.cursor.at === 'line' ? advance(play) : submit(play, INPUT).play;
    }
    const saved = JSON.parse(JSON.stringify(play)) as Play;
    const resumed = resumePlay(saved);
    expect(resumed).toEqual(play);
    expect(playThrough(resumed!).play).toEqual(playThrough(play).play);
  });

  it('데이터에 없는 장면을 가리키는 저장은 버린다', () => {
    const broken = {
      ...startPlay(),
      cursor: { sceneId: 'TRUTH-01' as const, at: 'line' as const, index: 0 },
    };
    expect(resumePlay(broken)).toBeNull();
    expect(resumePlay({ ...startPlay(), cursor: { at: 'end', next: 'RESULT' } })).toBeNull();
  });
});
