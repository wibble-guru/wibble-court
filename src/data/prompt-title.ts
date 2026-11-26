import type { Prompt, SceneId } from '@/engine/types';
import { SCENES } from './scenes';

/**
 * 화면에 보일 질문 제목·장면 이름 (#96). 대본 제목에 붙은 제작용 설명("— 공개되지 않는 내부 질문",
 * "+ 사고 기준 질문(QM)", "(필수)" 등)은 화면에 띄우지 않는다. 대본 원문(데이터)은 그대로 둔다.
 */
const PROMPT_TITLE: Record<string, string> = {
  Q0: '최초 생각 기록',
  M65: '중간 판단 기록',
  QM: '내 판단을 바꿀 만한 근거는 무엇인가?',
  'Q10-4': '판결을 내리면서 끝까지 남은 의문 하나',
};

export const promptTitle = (prompt: Pick<Prompt, 'id' | 'title'>) =>
  PROMPT_TITLE[prompt.id] ?? prompt.title;

/** 장면 제목 가운데 " — " 뒤가 제작용 설명인 장면 */
const SCENE_NAME: Partial<Record<SceneId, string>> = {
  M65: '중간 판단 기록',
  QM: '중간 판단 기록',
  J100: '최후 변론',
};

/** 기록장 출처 등에 보일 장면 이름 */
export const sceneName = (id: SceneId) => SCENE_NAME[id] ?? SCENES[id]?.title ?? '';
