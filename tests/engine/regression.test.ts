/**
 * 회귀 테스트 (대본 7.3 필수 보장, 7.4 금지 분기 오류, 11.2 진실 공개, 전 조합 진행).
 * 데이터나 화면을 고쳐도 이 항목들이 다시 깨지지 않게 한다.
 */
import { describe, expect, it } from 'vitest';
import { AXIS_COPY, AXIS_LABEL, BLEND_COPY, RESULT_COPY } from '@/data/result-copy';
import { SCENES } from '@/data/scenes';
import type { AnswerInput } from '@/engine/engine';
import { advance, startPlay, submit, visibleLines, type Play } from '@/features/play/runner';
import { truthUnlocked } from '@/features/truth/load';
import { analyze, resultId } from '@/engine/score';
import type { ABC, Prompt, SceneId, StoryState } from '@/engine/types';

const QS = ['q1_audio', 'q2_memory', 'q3_call', 'q4_witness', 'q5_sms', 'q6_motive', 'q7_priority', 'q8_inference', 'q9_last_question'] as const; // prettier-ignore

function input(picks: ABC[], extra: AnswerInput = {}): AnswerInput {
  return {
    impression_start: 'B', confidence_start: 50, impression_mid: 'D', guilt_probability_mid: 50,
    confidence_mid: 50, anchor_mid: 'G', qm_basis: 'A', qg_reconsider: 'B', qj_persuasion: 'C',
    verdict: 'GUILTY', confidence_final: 50, final_reason: 'A', remaining_question: 'A',
    ...Object.fromEntries(QS.map((q, i) => [q, picks[i]])),
    ...extra,
  }; // prettier-ignore
}

/** 끝까지 진행하며 화면에 보인 대사(장면별)를 모은다 */
function playThrough(answers: AnswerInput) {
  let play: Play = startPlay();
  const shown: { scene: SceneId; speaker: string; text: string }[] = [];
  for (let guard = 0; guard < 3000 && play.cursor.at !== 'end'; guard++) {
    const { cursor } = play;
    if (cursor.at === 'line') {
      const line = visibleLines(cursor.sceneId, play.story)[cursor.index];
      shown.push({ scene: cursor.sceneId, speaker: line.speaker, text: line.text });
      play = advance(play);
    } else {
      const result = submit(play, answers);
      if (result.missing.length) throw new Error(`빠진 답 ${result.missing.join(',')}`);
      play = result.play;
    }
  }
  return { play, shown };
}

const combos = (n: number): ABC[][] =>
  n === 0
    ? [[]]
    : combos(n - 1).flatMap((rest) => (['A', 'B', 'C'] as const).map((l) => [...rest, l]));

const prompts: Prompt[] = Object.values(SCENES).flatMap((s) => s?.prompts ?? []);

describe('전 조합 진행', () => {
  it('Q1~Q9 의 19,683 조합 모두 엔딩 뒤 RESULT 에서 끝나고, 막다른 장면이 없다', () => {
    const all = combos(9);
    expect(all).toHaveLength(19683);
    const endings = new Set<SceneId>();
    for (const picks of all) {
      let play: Play = startPlay();
      const answers = input(picks);
      for (let guard = 0; guard < 3000 && play.cursor.at !== 'end'; guard++) {
        play = play.cursor.at === 'line' ? advance(play) : submit(play, answers).play;
      }
      expect(play.cursor).toEqual({ at: 'end', next: 'RESULT' });
      endings.add(play.story.visited.at(-1)!);
    }
    expect([...endings].sort()).toEqual(['GUILTY-A', 'GUILTY-B', 'GUILTY-C']);
  }, 60_000);
});

describe('7.3 심리 결과 분기의 필수 보장', () => {
  const picks: ABC[] = ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'];

  it('같은 답에서 판결·확신도만 바꾸면 O/L/C/P 점수가 완전히 같다', () => {
    const guilty = playThrough(input(picks, { verdict: 'GUILTY', confidence_final: 95 })).play
      .story;
    const notGuilty = playThrough(input(picks, { verdict: 'NOT_GUILTY', confidence_final: 5 })).play
      .story;
    expect(analyze(guilty.answers)).toEqual(analyze(notGuilty.answers));
  });

  it('Q0 과 판결이 같아도 QM/QG/QJ 를 바꾸면 결과 성향이 달라질 수 있다', () => {
    const ids = (['A', 'B', 'C', 'D'] as const).map((x) =>
      resultId(
        analyze(
          playThrough(input(picks, { qm_basis: x, qg_reconsider: x, qj_persuasion: x })).play.story
            .answers,
        ),
      ),
    );
    expect(new Set(ids).size).toBeGreaterThan(1);
  });

  it('QM·QG·QJ 는 한 번씩, 4지선다, 고른 것과 상관없이 같은 다음 장면', () => {
    for (const id of ['QM', 'QG', 'QJ']) {
      const found = prompts.filter((p) => p.id === id);
      expect(found, id).toHaveLength(1);
      const field = found[0].fields[0];
      expect(field.kind === 'choice' && field.options.map((o) => o.key)).toEqual([
        'A',
        'B',
        'C',
        'D',
      ]);
      expect(field.kind === 'choice' && field.options.some((o) => o.next)).toBe(false);
    }
    const { shown } = playThrough(input(picks));
    expect(shown.length).toBeGreaterThan(0);
  });
});

describe('7.4 금지해야 할 분기 오류', () => {
  const textsOf = (picks: ABC[]) => playThrough(input(picks)).shown;

  it('Q1-C 경로에서는 녹음의 나머지 내용(A11-A·A11-B 의 녹음 속 발언)이 나오지 않는다', () => {
    const shown = textsOf(['C', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']);
    expect(shown.some((l) => l.text.startsWith('아직 안 죽었을지도'))).toBe(false);
  });

  it('Q3-A 경로에는 이메일 초안(C31-B) 대사가 없다', () => {
    const shown = textsOf(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']);
    expect(shown.some((l) => l.scene === 'C31-B')).toBe(false);
  });

  it('Q4-C 경로에서는 제보자 X 가 법정에서 진술하지 않는다', () => {
    const shown = textsOf(['A', 'A', 'A', 'C', 'A', 'A', 'A', 'A', 'A']);
    expect(shown.some((l) => l.speaker === '제보자 X')).toBe(false);
  });

  it('Q5-C 경로에서는 피고인의 1인칭 설명(E51-B)이 법정에 나오지 않는다', () => {
    const shown = textsOf(['A', 'A', 'A', 'A', 'C', 'A', 'A', 'A', 'A']);
    expect(shown.some((l) => l.scene === 'E51-B')).toBe(false);
  });

  it('Q7-A 경로에는 통화 음성 감정(G71-B) 대사가 없다', () => {
    const shown = textsOf(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']);
    expect(shown.some((l) => l.scene === 'G71-B')).toBe(false);
  });

  it('결과 문구는 판결이나 특정 인물로 성향을 단정하지 않는다', () => {
    const copy = JSON.stringify([AXIS_COPY, BLEND_COPY, RESULT_COPY, AXIS_LABEL]);
    for (const word of ['유죄', '무죄', '오지안', '민태성', '한유라', '%']) {
      expect(copy.includes(word), word).toBe(false);
    }
  });
});

describe('11.2 진실 공개 회귀', () => {
  it('본편 장면 데이터에 진실 공개 전용 문장이 없다 (모든 분기)', () => {
    const all = JSON.stringify(SCENES);
    for (const phrase of ['민태성을 죽인 사람은', '실제 범행자 확인', '사건의 진실 확인하기']) {
      expect(all.includes(phrase), phrase).toBe(false);
    }
  });

  it('결과 화면과 에필로그를 다 보지 않으면 진실 공개가 잠겨 있다', () => {
    const base = startPlay().story;
    const flags = (result: boolean, epilogue: boolean): StoryState => ({
      ...base,
      flags: { result_completed: result, epilogue_completed: epilogue },
    });
    expect(truthUnlocked(flags(false, false))).toBe(false);
    expect(truthUnlocked(flags(true, false))).toBe(false);
    expect(truthUnlocked(flags(false, true))).toBe(false);
    expect(truthUnlocked(flags(true, true))).toBe(true);
  });

  it('유죄·무죄 두 경로 모두 같은 진실 공개 장면을 지난다 (판결별로 갈리는 건 TRUTH-END 후일담뿐)', async () => {
    const { TRUTH_SCENES } = await import('@/data/truth/truth');
    const branching = TRUTH_SCENES.filter((s) => s.lines.some((l) => l.when)).map((s) => s.id);
    expect(branching).toEqual(['TRUTH-END']);
  });
});
