/**
 * 게임 진행 데이터. 지금은 흐름 확인용 샘플이다 — 실제 기획이 나오면 이 파일만 바꿔 끼우면 된다.
 *
 * 각 선택지는 성향 점수(traits)를 더하고, 마지막에 가장 높은 성향의 결과 id를 호스트로 보낸다.
 * 결과 id는 콘텐츠 서버에 등록된 결과 id와 같아야 한다 (`/t/{slug}/result/{resultId}`).
 */

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

export function decideResult(scores: Record<Trait, number>): string {
  const [top] = (Object.entries(scores) as [Trait, number][]).sort((a, b) => b[1] - a[1]);
  return RESULT_IDS[top[0]];
}
