import type { Cond, StateKey, StoryState } from './types';

/** 상태에서 키 하나의 값을 꺼낸다. answers → judgment → evidence 순으로 찾는다 (키 이름은 서로 겹치지 않음) */
export function readValue(state: StoryState, key: StateKey): unknown {
  if (key in state.answers) return state.answers[key as keyof typeof state.answers];
  if (key in state.judgment) return state.judgment[key as keyof typeof state.judgment];
  return state.evidence[key as keyof typeof state.evidence];
}

/** 조건 평가. 아직 정해지지 않은 값은 어떤 eq 와도 같지 않다 */
export function matches(cond: Cond, state: StoryState): boolean {
  if ('all' in cond) return cond.all.every((c) => matches(c, state));
  if ('any' in cond) return cond.any.some((c) => matches(c, state));
  if ('not' in cond) return !matches(cond.not, state);
  return readValue(state, cond.key) === cond.eq;
}
