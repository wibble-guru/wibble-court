/**
 * 게임 진행 데이터. 지금은 흐름 확인용 샘플이다 — 실제 기획이 나오면 이 파일만 바꿔 끼우면 된다.
 *
 * 각 선택지는 성향 점수(traits)를 더하고, 마지막에 가장 높은 성향의 결과를 호스트로 보낸다.
 * 위블 사이트는 결과를 저장하지 않고 RESULTS의 내용을 결과 페이지 주소에 실어 보여 준다
 * (`/t/{slug}/result/{playId}?r={resultId}&title=…`). 길이 제한은 ResultContent 주석 참고.
 */

import type { ResultContent } from '@wibble-guru/boilerplate';

export type Trait = 'judge' | 'prosecutor' | 'defender';

export type Choice = { label: string; traits: Partial<Record<Trait, number>> };

export type Scene = {
  id: string;
  speaker: string;
  line: string;
  choices: Choice[];
};

export const RESULT_IDS: Record<Trait, string> = {
  judge: 'court-judge',
  prosecutor: 'court-prosecutor',
  defender: 'court-defender',
};

/** 결과 페이지에 보일 내용 */
export const RESULTS: Record<Trait, ResultContent> = {
  judge: {
    intro: '당신과 닮은 재판관은',
    title: '공정한 재판장',
    summary:
      '증거부터 차근차근 살펴보고 양쪽 이야기를 끝까지 듣는 당신.\n감정에 휩쓸리지 않고 모두가 납득할 결론을 찾아내요.',
    emoji: '⚖️',
    hashtags: ['신중함', '균형감각', '원칙주의'],
    goodMatch: { label: '따뜻한 변호사', emoji: '🛡️' },
    badMatch: { label: '열정의 검사', emoji: '🔥' },
  },
  prosecutor: {
    intro: '당신과 닮은 재판관은',
    title: '열정의 검사',
    summary:
      '잘못은 그냥 넘어가지 않는 정의감의 소유자.\n한번 의심이 생기면 끝까지 파고들어 진실을 밝혀내요.',
    emoji: '🔥',
    hashtags: ['정의감', '추진력', '집요함'],
    goodMatch: { label: '공정한 재판장', emoji: '⚖️' },
    badMatch: { label: '따뜻한 변호사', emoji: '🛡️' },
  },
  defender: {
    intro: '당신과 닮은 재판관은',
    title: '따뜻한 변호사',
    summary:
      '누구에게나 사정이 있다고 믿는 다정한 사람.\n상대의 입장에서 먼저 생각하고 끝까지 편이 되어 줘요.',
    emoji: '🛡️',
    hashtags: ['공감력', '다정함', '포용력'],
    goodMatch: { label: '열정의 검사', emoji: '🔥' },
    badMatch: { label: '공정한 재판장', emoji: '⚖️' },
  },
};

export const SCENES: Scene[] = [
  {
    id: 'opening',
    speaker: '재판장',
    line: '피고인 위블은 친구의 마지막 푸딩을 먹은 혐의로 기소되었습니다. 당신의 첫 마디는?',
    choices: [
      { label: '증거부터 봅시다.', traits: { judge: 2 } },
      { label: '푸딩은 소중합니다. 용서할 수 없어요!', traits: { prosecutor: 2 } },
      { label: '배가 고팠을 수도 있잖아요.', traits: { defender: 2 } },
    ],
  },
  {
    id: 'evidence',
    speaker: '증인',
    line: '제가 봤어요! 위블 입가에 캐러멜 소스가 묻어 있었어요!',
    choices: [
      { label: '그 소스, 정말 푸딩 거 맞나요?', traits: { defender: 2, judge: 1 } },
      { label: '결정적인 증거군요.', traits: { prosecutor: 2 } },
      { label: '양쪽 이야기를 더 들어 보죠.', traits: { judge: 2 } },
    ],
  },
  {
    id: 'closing',
    speaker: '재판장',
    line: '이제 판결을 내릴 시간입니다. 당신의 선택은?',
    choices: [
      { label: '유죄! 푸딩 두 개로 갚으세요.', traits: { prosecutor: 2 } },
      { label: '무죄! 다 같이 푸딩 사러 가요.', traits: { defender: 2 } },
      { label: '공정하게 반반 나눠 먹읍시다.', traits: { judge: 2 } },
    ],
  },
];

/** 가장 높은 성향의 결과 id와 결과 페이지 내용 */
export function decideResult(scores: Record<Trait, number>): {
  id: string;
  content: ResultContent;
} {
  const [[top]] = (Object.entries(scores) as [Trait, number][]).sort((a, b) => b[1] - a[1]);
  return { id: RESULT_IDS[top], content: RESULTS[top] };
}
