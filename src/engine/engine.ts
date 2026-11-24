/**
 * 장면 진행 엔진. 모두 순수 함수 — 상태를 바꾸지 않고 새 상태를 돌려준다.
 *
 * 한 장면의 흐름:
 *   canEnter → enterScene(이번에 보일 대사 확정) → 대사 → prompts 마다 answer → leaveScene → nextSceneId
 */
import { matches, readValue } from './conditions';
import { ENDING_IDS, resolveEnding } from './endings';
import { normalizeKey } from './normalize';
import type { Line, Option, Prompt, Scene, SceneId, SceneMap, StoryState } from './types';

export function initialState(): StoryState {
  return {
    answers: {},
    evidence: { time_reveal_early: false },
    judgment: {},
    visited: [],
    acquired: [],
    flags: { result_completed: false, epilogue_completed: false },
  };
}

/** 7.1 appears_if: 이 경로에서 들어올 수 있는 장면인가 */
export function canEnter(scene: Scene, state: StoryState): boolean {
  return !scene.appearsIf || matches(scene.appearsIf, state);
}

/**
 * 장면에 들어가기 전에 이전 선택을 보고 조건부 대사를 고른다 (2부 "합류의 의미").
 * 화면은 이 목록만 보여 주고, 렌더 중에 조건을 다시 평가하지 않는다.
 */
export function enterScene(scene: Scene, state: StoryState): Line[] {
  return scene.lines.filter((line) => !line.when || matches(line.when, state));
}

export type AnswerInput = Record<string, string | number | undefined>;

/** 질문에서 아직 채우지 않은 항목 (모든 항목 필수 — Q10-4 포함) */
export function missingFields(prompt: Prompt, input: AnswerInput): string[] {
  return prompt.fields
    .filter((field) => {
      const value = input[field.target];
      if (field.kind === 'slider') return typeof value !== 'number' || Number.isNaN(value);
      return !field.options.some((o) => (o.value ?? o.key) === value);
    })
    .map((field) => field.target);
}

/** 질문의 답을 기록한다. 빠진 항목이 있으면 상태를 바꾸지 않고 그 목록을 돌려준다 */
export function answer(
  state: StoryState,
  prompt: Prompt,
  input: AnswerInput,
): { ok: true; state: StoryState } | { ok: false; missing: string[] } {
  const missing = missingFields(prompt, input);
  if (missing.length > 0) return { ok: false, missing };

  const answers = { ...state.answers };
  const judgment = { ...state.judgment };
  for (const field of prompt.fields) {
    const target = normalizeKey(field.target);
    if (!target) throw new Error(`저장할 수 없는 항목: ${field.target}`);
    const bucket: Record<string, unknown> = target.group === 'answers' ? answers : judgment;
    bucket[target.key] = clampSlider(input[field.target], field.kind === 'slider');
  }
  return { ok: true, state: { ...state, answers, judgment } };
}

function clampSlider(value: string | number | undefined, isSlider: boolean) {
  if (!isSlider || typeof value !== 'number') return value;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** 장면의 질문들에서 플레이어가 고른 선택지 (아직 안 골랐으면 빠짐) */
export function chosenOptions(scene: Scene, state: StoryState): Option[] {
  const chosen: Option[] = [];
  for (const prompt of scene.prompts ?? []) {
    for (const field of prompt.fields) {
      if (field.kind !== 'choice') continue;
      const target = normalizeKey(field.target);
      if (!target) continue;
      const value = readValue(state, target.key);
      const option = field.options.find((o) => (o.value ?? o.key) === value);
      if (option) chosen.push(option);
    }
  }
  return chosen;
}

/** 장면을 끝까지 보고 떠날 때: 저장·획득 값 반영, 증거 추가, 방문 기록 */
export function leaveScene(state: StoryState, scene: Scene): StoryState {
  const optionMutations = chosenOptions(scene, state).map((o) => o.mutation ?? {});
  const evidence = Object.assign({}, state.evidence, scene.mutation, ...optionMutations);
  const acquired = [...state.acquired];
  for (const id of scene.gain ?? []) if (!acquired.includes(id)) acquired.push(id);
  const visited = state.visited.includes(scene.id) ? state.visited : [...state.visited, scene.id];
  return { ...state, evidence, acquired, visited };
}

/** 다음 장면: 고른 선택지의 next > 장면의 next > 판결 엔딩 규칙 */
export function nextSceneId(scene: Scene, state: StoryState): SceneId {
  const branch = chosenOptions(scene, state).find((o) => o.next);
  if (branch?.next) return branch.next;
  if (typeof scene.next === 'string') return scene.next;
  return resolveEnding(state);
}

/**
 * 장면 연결 검사 (2b 검증 스크립트·테스트에서 사용).
 * missing: 없는 장면을 가리키는 next / unreachable: start 에서 갈 수 없는 장면
 */
export function checkGraph(
  scenes: SceneMap,
  start: SceneId,
): { missing: { from: SceneId; to: SceneId }[]; unreachable: SceneId[] } {
  const edges = (scene: Scene): SceneId[] => {
    const out = new Set<SceneId>();
    for (const prompt of scene.prompts ?? []) {
      for (const field of prompt.fields) {
        if (field.kind === 'choice') field.options.forEach((o) => o.next && out.add(o.next));
      }
    }
    // 선택지가 다음 장면을 정하는 분기 장면이면 장면의 next 는 쓰이지 않는다 (nextSceneId 와 같은 우선순위)
    if (out.size > 0) return [...out];
    if (typeof scene.next === 'string') return [scene.next];
    return ENDING_IDS;
  };

  const missing: { from: SceneId; to: SceneId }[] = [];
  const seen = new Set<SceneId>();
  const queue: SceneId[] = [start];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const scene = scenes[id];
    if (!scene) continue;
    for (const to of edges(scene)) {
      if (!scenes[to]) missing.push({ from: id, to });
      else queue.push(to);
    }
  }
  const unreachable = (Object.keys(scenes) as SceneId[]).filter((id) => !seen.has(id));
  return { missing, unreachable };
}
