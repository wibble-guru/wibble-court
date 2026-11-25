import { describe, expect, test } from 'vitest';
import { SCENES } from '@/data/scenes';
import { portraitOf } from './characters';

const speakers = new Set(
  Object.values(SCENES).flatMap((scene) =>
    scene.lines.filter((l) => l.kind !== 'direction').map((l) => l.speaker),
  ),
);

/** 그림이 없어 캐릭터가 빠지는 본편 발언자 (계획서 49) */
const NO_PORTRAIT = [
  '녹음 속 오지안', // 녹음 속 목소리에는 그림을 띄우지 않는다 (#67)
  '녹음 속 경찰관',
  '경찰관',
  '녹음 속 강도현',
  '상대 음성',
  '강도현',
  '화면 / 발신자 불명',
  '내레이션',
  '잔여 질문',
  '경찰서 체류 영상',
  '익명 연락',
  '22:20',
  '마지막 화면',
];

describe('말하는 인물 그림', () => {
  test('본편의 모든 발언자는 그림이 있거나 "그림 없음" 목록에 있다', () => {
    for (const speaker of speakers) {
      if (!speaker) continue;
      const has = portraitOf(speaker) !== null;
      expect(has || NO_PORTRAIT.includes(speaker), speaker).toBe(true);
      if (NO_PORTRAIT.includes(speaker)) expect(has, speaker).toBe(false);
    }
  });

  test('역할별 고정 쪽: 검사·피고인·증인 왼쪽, 변호인·재판장 오른쪽', () => {
    expect(portraitOf('검사 차윤호')?.side).toBe('left');
    expect(portraitOf('오지안(작게)')?.side).toBe('left');
    expect(portraitOf('제보자 X')?.side).toBe('left');
    expect(portraitOf('변호인 문하경')?.side).toBe('right');
    expect(portraitOf('재판장(플레이어)')).toEqual({ id: 'judge', side: 'right' });
    expect(portraitOf('법원 직원')?.id).toBe('clerk');
  });

  test('녹음 속 목소리는 그림 없음, 결과 이후 장면의 덧붙인 표기는 같은 인물', () => {
    expect(portraitOf('녹음 속 오지안')).toBeNull();
    expect(portraitOf('검사 차윤호(후속 보고를 읽으며)')?.id).toBe('prosecutor');
    expect(portraitOf('오지안(당시 상황 회상)')?.id).toBe('defendant');
    // 화면에 뜨는 글은 인물이 말하는 게 아니다
    expect(portraitOf('오지안의 답장')).toBeNull();
    expect(portraitOf('오지안의 자백')).toBeNull();
  });
});
