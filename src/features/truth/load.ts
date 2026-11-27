import type * as TruthModule from '@/data/truth/truth';
import type { StoryState } from '@/engine/types';
import type { TruthFlow } from './TruthFlow';

/** 진실 공개 청크: 대본 데이터 + 화면(TruthFlow). 본편 번들 50KB 한도라 화면 코드도 함께 늦게 받는다 (#98) */
export type Truth = typeof TruthModule & { TruthFlow: typeof TruthFlow };

/** 진실 공개 청크 — 결과·에필로그를 다 본 뒤에만 부른다 (import() 만 허용, ESLint) */
let truthPromise: Promise<Truth> | null = null;
export function loadTruth(): Promise<Truth> {
  truthPromise ??= Promise.all([import('@/data/truth/truth'), import('./TruthFlow')]).then(
    ([data, ui]) => ({ ...data, TruthFlow: ui.TruthFlow }),
  );
  return truthPromise;
}

/** 결과 이후 진실 공개를 열어도 되는가 (11.1 unlock_condition) */
export function truthUnlocked(story: StoryState): boolean {
  return story.flags.result_completed && story.flags.epilogue_completed;
}
