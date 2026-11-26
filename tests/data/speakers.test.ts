import { describe, expect, it } from 'vitest';
import { SCENES } from '@/data/scenes';
import { isKnownSpeaker, roleOf, sideOf } from '@/data/speakers';

const speakers = new Set(
  Object.values(SCENES).flatMap((scene) =>
    (scene?.lines ?? []).filter((l) => l.kind !== 'direction').map((l) => l.speaker),
  ),
);

describe('발언자 분류', () => {
  it('데이터의 모든 발언자 표기가 역할에 분류되어 있다', () => {
    expect([...speakers].filter((s) => !isKnownSpeaker(s))).toEqual([]);
  });

  it('검사는 왼쪽, 변호인은 오른쪽, 재판장은 가운데', () => {
    expect(sideOf(roleOf('검사 차윤호'))).toBe('left');
    expect(sideOf(roleOf('변호인(마무리)'))).toBe('right');
    expect(sideOf(roleOf('재판장(플레이어)'))).toBe('center');
  });

  it('정체가 쟁점인 음성·문자는 특정 인물 색을 받지 않는다', () => {
    expect(roleOf('상대 음성')).toBe('narration');
    expect(roleOf('화면 / 발신자 불명')).toBe('narration');
  });
});
