import { describe, expect, it } from 'vitest';
import { SCENES } from '@/data/scenes';
import { isKnownSpeaker, isVoice, roleOf, sideOf, splitSpeaker } from '@/data/speakers';

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

  it('이름표: 소속이 붙은 표기만 꼬리표와 이름으로 나누고, 글자는 그대로', () => {
    expect(splitSpeaker('검사 차윤호')).toEqual({ tag: '검사', name: '차윤호' });
    expect(splitSpeaker('녹음 속 강도현')).toEqual({ tag: '녹음 속', name: '강도현' });
    expect(splitSpeaker('법원 직원')).toEqual({ name: '법원 직원' });
    expect(splitSpeaker('화면 / 발신자 불명')).toEqual({ name: '화면 / 발신자 불명' });
    for (const s of speakers) {
      const { tag, name } = splitSpeaker(s);
      expect(tag ? `${tag} ${name}` : name).toBe(s);
    }
  });

  it('기기·녹음에서 나오는 목소리만 자막형, 법정에 선 사람은 조서형', () => {
    expect(isVoice('녹음 속 오지안')).toBe(true);
    expect(isVoice('상대 음성')).toBe(true);
    expect(isVoice('화면 / 발신자 불명')).toBe(true);
    expect(isVoice('변호인 문하경')).toBe(false);
    expect(isVoice('오지안')).toBe(false);
  });
});
