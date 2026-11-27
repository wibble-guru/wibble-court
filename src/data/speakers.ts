/**
 * 대본의 발언자 표기 → 역할 (대본 7.1 규칙 1: 발언자를 이름·색·위치로 구분).
 * 이름표 글자는 대본 표기 그대로 보이고, 역할은 색(tokens.css 의 --role-*)과 이름표 위치에만 쓴다.
 */
export type Role =
  'prosecutor' | 'defense' | 'judge' | 'defendant' | 'witness' | 'police' | 'narration';

/** 이름표가 대화창 위 어디에 서는지. 검사↔변호인 공방이 좌우로 오가게 */
export type Side = 'left' | 'center' | 'right';

const ROLE_OF: Record<string, Role> = {
  검사: 'prosecutor',
  '검사 차윤호': 'prosecutor',
  '검사(마무리)': 'prosecutor',
  변호인: 'defense',
  '변호인 문하경': 'defense',
  '변호인(마무리)': 'defense',
  재판장: 'judge',
  '재판장(플레이어)': 'judge',
  '법원 직원': 'judge',
  오지안: 'defendant',
  '오지안(작게)': 'defendant',
  '녹음 속 오지안': 'defendant',
  '화면 / 오지안, 22:00': 'defendant',
  한유라: 'witness',
  감정인: 'witness',
  '제보자 X': 'witness',
  강도현: 'police',
  경찰관: 'police',
  '녹음 속 경찰관': 'police',
  '녹음 속 강도현': 'police',
  내레이션: 'narration',
  나레이션: 'narration',
  '잔여 질문': 'narration',
  '화면 문구': 'narration',
  후일담: 'narration',
  // 누구 목소리·누가 보낸 문자인지가 쟁점이라 특정 인물 색을 주지 않는다
  '상대 음성': 'narration',
  '화면 / 발신자 불명': 'narration',
  // EPILOGUE (화면 연결은 5단계)
  화면: 'narration',
  '경찰서 체류 영상': 'narration',
  '익명 연락': 'narration',
  '22:20': 'narration',
  '마지막 화면': 'narration',
};

/** 표에 없는 표기(결과 이후 장면의 "검사 차윤호(후속 보고를 읽으며)" 등)는 첫 낱말로 역할을 찾는다. 그래도 없으면 내레이션 */
const PREFIX_ROLE: [string, Role][] = [
  ['검사', 'prosecutor'],
  ['변호인', 'defense'],
  ['재판장', 'judge'],
  ['오지안', 'defendant'],
  ['강도현', 'police'],
];

export function roleOf(speaker: string): Role {
  return (
    ROLE_OF[speaker] ??
    PREFIX_ROLE.find(([prefix]) => speaker.startsWith(prefix))?.[1] ??
    'narration'
  );
}

export function isKnownSpeaker(speaker: string): boolean {
  return speaker in ROLE_OF;
}

export function sideOf(role: Role): Side {
  if (role === 'defense') return 'right';
  if (role === 'judge') return 'center';
  return 'left';
}

/**
 * 이름표를 소속 꼬리표 + 이름 명판으로 나눈다 (계획서 83). 글자는 대본 표기 그대로, 보이는 자리만 나눈다.
 * "검사 차윤호" → ["검사", "차윤호"], "녹음 속 강도현" → ["녹음 속", "강도현"]. 그 밖의 표기는 명판 하나.
 */
const TAG = /^(검사|변호인|녹음 속|제보자) (.+)$/;

export function splitSpeaker(speaker: string): { tag?: string; name: string } {
  const m = TAG.exec(speaker);
  return m ? { tag: m[1], name: m[2] } : { name: speaker };
}

/**
 * 기기·녹음에서 나오는 목소리·화면 글 (#87): 자막처럼 가운데 정렬로 보인다.
 * "녹음 속 오지안", "상대 음성", "화면 / 발신자 불명" 등. 그 밖은 법정에 선 사람의 대사(조서형)
 */
export const isVoice = (speaker: string) => /^(녹음 속 |상대 음성|화면)/.test(speaker);

/**
 * 이름표에 보일 이름 (#96). 대본 발언자 표기에는 제작용 표시가 섞여 있어 화면에서만 걸러 낸다 (대본 원문·역할 판정은 그대로).
 *  - 괄호 지시: "재판장(플레이어)", "검사(마무리)", "오지안(작게)" → 괄호 앞까지
 *  - 화면 글: "화면 / 발신자 불명" → "발신자 불명", "화면 / 오지안, 22:00" → "오지안" (시각은 메신저에 따로 보인다)
 *  - 내레이션·장면 안내 ("나레이션", "화면 문구", "후일담", "잔여 질문" 등 #98): 이름 없이 (null)
 */
const NO_NAME = new Set(['내레이션', '나레이션', '화면', '화면 문구', '후일담', '잔여 질문']);

export function displaySpeaker(speaker: string): string | null {
  if (NO_NAME.has(speaker)) return null;
  return speaker
    .replace(/\(.*\)$/, '')
    .replace(/^화면 \/ /, '')
    .replace(/, \d{1,2}:\d{2}$/, '')
    .trim();
}
