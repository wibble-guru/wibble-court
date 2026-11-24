/**
 * 플레이 진행 상태 기계. 엔진(engine.ts) 위에서 "지금 화면에 무엇을 보일지"만 정한다. 모두 순수 함수.
 *
 *   장면 시작 → 대사 0..n (연출 줄은 화면에 띄우지 않음) → 질문 0..m → 장면 떠남 → 다음 장면
 *   다음 장면이 데이터에 없으면(엔딩 뒤 RESULT, 5단계) 끝.
 */
import { backdropAt, type Backdrop } from '@/data/scene-bg';
import { SCENES, START_SCENE } from '@/data/scenes';
import {
  answer,
  enterScene,
  initialState,
  leaveScene,
  nextSceneId,
  type AnswerInput,
} from '@/engine/engine';
import type { Line, Prompt, Scene, SceneId, StoryState } from '@/engine/types';

export type Cursor =
  { sceneId: SceneId; at: 'line' | 'prompt'; index: number } | { at: 'end'; next: SceneId };

export type Play = { cursor: Cursor; story: StoryState };

function sceneOf(id: SceneId): Scene {
  const scene = SCENES[id];
  if (!scene) throw new Error(`없는 장면: ${id}`);
  return scene;
}

/**
 * 이 장면에서 화면에 보일 대사. 조건부 대사는 엔진이 고르고, 연출 줄은 뺀다
 * (참고 프로토타입처럼 연출은 글로 띄우지 않고 4a 에서 배경·효과로 표현).
 * 대사 단계에서는 이 장면의 답이 아직 없으므로 장면에 들어올 때와 같은 목록이 나온다.
 */
export function visibleLines(sceneId: SceneId, story: StoryState): Line[] {
  return enterScene(sceneOf(sceneId), story).filter((line) => line.kind !== 'direction');
}

/** 커서가 가리키는 대사가 없으면 질문으로, 질문도 끝났으면 다음 장면으로 넘긴다 */
function settle(play: Play): Play {
  const { cursor, story } = play;
  if (cursor.at === 'end') return play;
  const scene = sceneOf(cursor.sceneId);

  if (cursor.at === 'line' && cursor.index >= visibleLines(cursor.sceneId, story).length) {
    return settle({ story, cursor: { sceneId: cursor.sceneId, at: 'prompt', index: 0 } });
  }
  if (cursor.at === 'prompt' && cursor.index >= (scene.prompts?.length ?? 0)) {
    const left = leaveScene(story, scene);
    const next = nextSceneId(scene, left);
    if (!SCENES[next]) return { story: left, cursor: { at: 'end', next } };
    return settle({ story: left, cursor: { sceneId: next, at: 'line', index: 0 } });
  }
  return play;
}

export function startPlay(): Play {
  return settle({ story: initialState(), cursor: { sceneId: START_SCENE, at: 'line', index: 0 } });
}

/** 저장된 진행을 이어서. 데이터가 바뀌어 장면이 없으면 null (처음부터) */
export function resumePlay(saved: Play): Play | null {
  if (saved.cursor.at === 'end' || !SCENES[saved.cursor.sceneId]) return null;
  return settle(saved);
}

/** 다음 대사 (대사 단계가 아니면 그대로) */
export function advance(play: Play): Play {
  const { cursor } = play;
  if (cursor.at !== 'line') return play;
  return settle({ ...play, cursor: { ...cursor, index: cursor.index + 1 } });
}

export function currentPrompt(play: Play): Prompt | null {
  const { cursor } = play;
  if (cursor.at !== 'prompt') return null;
  return sceneOf(cursor.sceneId).prompts?.[cursor.index] ?? null;
}

/** 질문에 답한다. 빠진 항목이 있으면 그대로 두고 그 목록을 돌려준다 */
export function submit(play: Play, input: AnswerInput): { play: Play; missing: string[] } {
  const prompt = currentPrompt(play);
  if (!prompt || play.cursor.at !== 'prompt') return { play, missing: [] };
  const result = answer(play.story, prompt, input);
  if (!result.ok) return { play, missing: result.missing };
  const cursor = { ...play.cursor, index: play.cursor.index + 1 };
  return { play: settle({ story: result.state, cursor }), missing: [] };
}

/** 고르는 즉시 기록해도 되는 질문인가 (선택 항목 하나뿐). 슬라이더가 섞이면 확정 버튼으로 */
export function isSingleChoice(prompt: Prompt): boolean {
  return prompt.fields.length === 1 && prompt.fields[0].kind === 'choice';
}

/** 지금 보일 배경 (질문 단계면 대사가 다 지나간 뒤의 배경). 끝났으면 null */
export function backdropOf(play: Play): Backdrop | null {
  const { cursor, story } = play;
  if (cursor.at === 'end') return null;
  const lines = visibleLines(cursor.sceneId, story);
  return backdropAt(cursor.sceneId, lines, cursor.at === 'line' ? cursor.index : lines.length);
}
