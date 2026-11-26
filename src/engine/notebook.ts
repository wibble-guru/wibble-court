/**
 * 기록장 계산 (대본 7.2). 진행 상태만 입력으로 받는 순수 함수 — 화면이 장면 텍스트를 따로 조립하지 않는다.
 * 그래서 고르지 않은 경로의 자료가 사실처럼 기록되는 오류(7.4)를 테스트로 막을 수 있다.
 */
import { promptTitle, sceneName } from '@/data/prompt-title';
import { NOTEBOOK, TAB_ORDER, type LineRef, type NotebookTab } from '@/data/notebook';
import { SCENES } from '@/data/scenes';
import { matches, readValue } from './conditions';
import { normalizeKey } from './normalize';
import type { Line, SceneId, StoryState } from './types';

export type NotebookItem = {
  /** 대본 대사 그대로 (발언자 + 문장). 나의 결정은 질문 제목 + 고른 선택지 */
  lines: { speaker: string; text: string }[];
  /** 어느 장면에서 나온 것인지 (장면 제목) */
  source: string;
};

export type Notebook = Record<NotebookTab, NotebookItem[]>;

/** 생각 기록은 비공개라 나의 결정에 넣지 않는다 — 법정 질문만 */
const COURT_PROMPTS = new Set(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9']);

/** [발언자, 첫머리] → 그 장면의 실제 대사 (조건부 대사는 이 경로에서 나온 것만). 없거나 여럿이면 null */
export function resolveLine(
  sceneId: SceneId,
  [speaker, starts]: LineRef,
  state?: StoryState,
): Line | null {
  const lines = (SCENES[sceneId]?.lines ?? []).filter(
    (l) =>
      l.kind !== 'direction' &&
      l.speaker === speaker &&
      l.text.startsWith(starts) &&
      (!l.when || !state || matches(l.when, state)),
  );
  return lines.length === 1 ? lines[0] : null;
}

export function buildNotebook(state: StoryState): Notebook {
  const book = Object.fromEntries(TAB_ORDER.map((tab) => [tab, []])) as unknown as Notebook;
  const order = (id: SceneId) => state.visited.indexOf(id);

  const entries = NOTEBOOK.filter((entry) => order(entry.scene) >= 0).sort(
    (a, b) => order(a.scene) - order(b.scene),
  );
  for (const entry of entries) {
    const lines = entry.refs.map((ref) => resolveLine(entry.scene, ref, state));
    if (lines.some((l) => !l)) continue; // 대응표가 데이터와 어긋남 — 테스트가 잡는다
    book[entry.tab].push({
      lines: lines.map((l) => ({ speaker: l!.speaker, text: l!.text })),
      source: sceneName(entry.scene),
    });
  }

  for (const id of state.visited) {
    const scene = SCENES[id];
    for (const prompt of scene?.prompts ?? []) {
      if (!COURT_PROMPTS.has(prompt.id)) continue;
      for (const field of prompt.fields) {
        if (field.kind !== 'choice') continue;
        const key = normalizeKey(field.target)?.key;
        const value = key && readValue(state, key);
        const option = field.options.find((o) => (o.value ?? o.key) === value);
        if (option) {
          book.decisions.push({
            lines: [{ speaker: promptTitle(prompt), text: option.label }],
            source: sceneName(id),
          });
        }
      }
    }
  }
  return book;
}
