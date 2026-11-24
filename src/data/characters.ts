/**
 * 말하는 인물 그림 (노션 캐릭터 시트의 상반신 일러스트, scripts/cut-characters.mjs).
 * 대본 발언자 표기 → 그림. 그림이 없는 발언자(강도현, 경찰관, 상대 음성, 내레이션 …)는 null — 캐릭터가 빠진다.
 * 쪽은 역할별로 고정: 검사·피고인·증인 왼쪽, 변호인·재판장 오른쪽 (사용자 결정, 계획서 49).
 */
export type CharacterId =
  'judge' | 'prosecutor' | 'defense' | 'defendant' | 'han-yura' | 'expert' | 'clerk' | 'informant';

export type Portrait = {
  id: CharacterId;
  side: 'left' | 'right';
  /** 녹음 속 목소리처럼 그 자리에 없는 사람 — 반투명 */
  faint?: boolean;
};

const SIDE: Record<CharacterId, Portrait['side']> = {
  judge: 'right',
  prosecutor: 'left',
  defense: 'right',
  defendant: 'left',
  'han-yura': 'left',
  expert: 'left',
  clerk: 'left',
  informant: 'left',
};

/** 표기 그대로 */
const EXACT: Record<string, CharacterId> = {
  재판장: 'judge',
  '재판장(플레이어)': 'judge',
  '법원 직원': 'clerk',
  검사: 'prosecutor',
  변호인: 'defense',
  오지안: 'defendant',
  '화면 / 오지안, 22:00': 'defendant',
  한유라: 'han-yura',
  감정인: 'expert',
  '제보자 X': 'informant',
};

/** 이름 뒤에 괄호·띄어쓰기가 붙은 표기 ("검사 차윤호(후속 보고를 읽으며)", "오지안(작게)"). "오지안의 답장" 같은 화면 글은 아님 */
const NAMED: [RegExp, CharacterId][] = [
  [/^검사[ (]/, 'prosecutor'],
  [/^변호인[ (]/, 'defense'],
  [/^재판장[ (]/, 'judge'],
  [/^오지안[ (]/, 'defendant'],
];

/** 녹음으로만 들리는 목소리 */
const RECORDED: Record<string, CharacterId> = {
  '녹음 속 오지안': 'defendant',
};

export function portraitOf(speaker: string | undefined): Portrait | null {
  if (!speaker) return null;
  const recorded = RECORDED[speaker];
  if (recorded) return { id: recorded, side: SIDE[recorded], faint: true };
  const id = EXACT[speaker] ?? NAMED.find(([re]) => re.test(speaker))?.[1];
  return id ? { id, side: SIDE[id] } : null;
}

const BASE = import.meta.env.BASE_URL;
export const portraitSrc = (id: CharacterId) => `${BASE}assets/chars/${id}.webp`;
export const CHARACTER_IDS = Object.keys(SIDE) as CharacterId[];
