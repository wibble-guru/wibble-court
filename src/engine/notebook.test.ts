import { describe, expect, it } from 'vitest';
import { NOTEBOOK } from '@/data/notebook';
import type { AnswerInput } from '@/engine/engine';
import { advance, startPlay, submit, type Play } from '@/features/play/runner';
import { buildNotebook, resolveLine } from './notebook';
import type { ABC, StoryState } from './types';

const QS = [
  'q1_audio',
  'q2_memory',
  'q3_call',
  'q4_witness',
  'q5_sms',
  'q6_motive',
  'q7_priority',
  'q8_inference',
  'q9_last_question',
];

/** Q1~Q9 를 picks 로 골라 엔딩까지 진행한 상태 */
function playTo(picks: ABC[]): StoryState {
  const input: AnswerInput = {
    impression_start: 'B', confidence_start: 50, impression_mid: 'D', guilt_probability_mid: 50,
    confidence_mid: 50, anchor_mid: 'G', qm_basis: 'A', qg_reconsider: 'A', qj_persuasion: 'A',
    verdict: 'GUILTY', confidence_final: 50, final_reason: 'A', remaining_question: 'A',
    ...Object.fromEntries(QS.map((q, i) => [q, picks[i]])),
  }; // prettier-ignore
  let play: Play = startPlay();
  while (play.cursor.at !== 'end') {
    play = play.cursor.at === 'line' ? advance(play) : submit(play, input).play;
  }
  return play.story;
}

const all = (book: ReturnType<typeof buildNotebook>) =>
  Object.values(book).flatMap((items) => items.flatMap((i) => i.lines.map((l) => l.text)));

describe('기록장', () => {
  it('모든 항목이 실제 대사 한 줄과 글자 그대로 맞는다', () => {
    const broken = NOTEBOOK.flatMap((entry) =>
      entry.refs
        .filter((ref) => !resolveLine(entry.scene, ref))
        .map((ref) => `${entry.scene} ${ref.join(' / ')}`),
    );
    expect(broken).toEqual([]);
  });

  it('시작할 때는 모든 탭이 비어 있다', () => {
    expect(
      Object.values(buildNotebook(startPlay().story)).every((items) => items.length === 0),
    ).toBe(true);
  });

  it('지나온 장면의 항목만 쌓인다', () => {
    const state = playTo(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']);
    const book = buildNotebook(state);
    const visited = new Set(state.visited);
    const expected = NOTEBOOK.filter((e) => visited.has(e.scene)).length;
    const actual =
      book.facts.length + book.disputed.length + book.limited.length + book.open.length;
    expect(actual).toBe(expected);
    expect(book.decisions.map((d) => d.lines[0].text)).toHaveLength(9);
  });

  it("7.2 예시: Q1-B 면 나의 결정에 '신원 식별 정보는 보호하고' 선택이 기록된다", () => {
    const book = buildNotebook(playTo(['B', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']));
    expect(book.decisions[0].lines[0]).toEqual({
      speaker: '녹음의 심리 방식',
      text: '신원 식별 정보는 보호하고 나머지를 심리한다.',
    });
  });

  it('7.4: Q3-A 경로에는 이메일 초안(C31-B) 항목이 없다', () => {
    const texts = all(buildNotebook(playTo(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'])));
    expect(texts.some((t) => t.includes('피해자 계정에 저장된'))).toBe(false);
    const withB = all(buildNotebook(playTo(['A', 'A', 'B', 'A', 'A', 'A', 'A', 'A', 'A'])));
    expect(withB.some((t) => t.includes('피해자 계정에 저장된'))).toBe(true);
  });

  it('7.4: Q4-C 경로의 기록장에 제보자 X 의 진술이 없다', () => {
    const book = buildNotebook(playTo(['A', 'A', 'A', 'C', 'A', 'A', 'A', 'A', 'A']));
    const speakers = Object.values(book).flatMap((items) =>
      items.flatMap((i) => i.lines.map((l) => l.speaker)),
    );
    expect(speakers).not.toContain('제보자 X');
  });

  it('7.4: Q7-A 경로에 통화 음성 감정(G71-B) 항목이 없고, 확인된 사실 탭에 "가능성" 대사가 없다', () => {
    const book = buildNotebook(playTo(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']));
    expect(all(book).some((t) => t.includes('통화 상대의 음성은'))).toBe(false);
    for (const picks of [
      ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'],
      ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C'],
      ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
    ] as ABC[][]) {
      const facts = buildNotebook(playTo(picks)).facts.flatMap((i) => i.lines.map((l) => l.text));
      expect(facts.some((t) => t.includes('가능성'))).toBe(false);
    }
  });

  it('7.4: Q5-C 경로에 피고인의 1인칭 설명(E51-B)이 기록되지 않는다', () => {
    const texts = all(buildNotebook(playTo(['A', 'A', 'A', 'A', 'C', 'A', 'A', 'A', 'A'])));
    expect(texts.some((t) => t.startsWith('제가 경찰서에 가서'))).toBe(false);
  });

  it('나의 결정에는 생각 기록(Q0, M65, QM …)이 들어가지 않는다', () => {
    const book = buildNotebook(playTo(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']));
    const titles = book.decisions.map((d) => d.lines[0].speaker);
    expect(titles.some((t) => t.includes('최초 생각') || t.includes('최종 판결'))).toBe(false);
  });
});
