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
  '잔여 질문': 'narration',
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

/** 표에 없는 표기 (테스트가 막지만, 혹시 새 대본이 들어오면 내레이션으로) */
export function roleOf(speaker: string): Role {
  return ROLE_OF[speaker] ?? 'narration';
}

export function isKnownSpeaker(speaker: string): boolean {
  return speaker in ROLE_OF;
}

export function sideOf(role: Role): Side {
  if (role === 'defense') return 'right';
  if (role === 'judge') return 'center';
  return 'left';
}
