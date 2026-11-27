import { describe, expect, it } from 'vitest';
import { promptTitle, sceneName } from '@/data/prompt-title';
import { SCENES } from '@/data/scenes';
import { TRUTH_SCENES } from '@/data/truth/truth';
import { displaySpeaker } from '@/data/speakers';
import type { SceneId } from '@/engine/types';

const scenes = Object.values(SCENES).filter((s) => s !== undefined);
/** 화면에 나오면 안 되는 제작용 표시 */
const META = /\(QM\)|\(필수\)|내부 질문|내부 판단 기록|플레이어|사고 기준 질문/;

describe('화면에 보이는 제목·이름 (#96)', () => {
  it('질문 제목에 제작용 설명이 없다', () => {
    const titles = scenes.flatMap((s) => (s.prompts ?? []).map(promptTitle));
    expect(titles.filter((t) => META.test(t))).toEqual([]);
  });

  it('기록장에 보이는 장면 이름에 제작용 설명이 없다', () => {
    const names = scenes.map((s) => sceneName(s.id as SceneId));
    expect(names.filter((n) => META.test(n))).toEqual([]);
  });

  it('이름표에는 괄호 지시·"화면 /"·시각이 보이지 않고, 내레이션은 이름이 없다', () => {
    expect(displaySpeaker('재판장(플레이어)')).toBe('재판장');
    expect(displaySpeaker('검사(마무리)')).toBe('검사');
    expect(displaySpeaker('화면 / 발신자 불명')).toBe('발신자 불명');
    expect(displaySpeaker('화면 / 오지안, 22:00')).toBe('오지안');
    expect(displaySpeaker('내레이션')).toBeNull();
    // 진실 공개·결말의 장면 안내 표기 (#98)
    for (const meta of ['나레이션', '화면', '화면 문구', '후일담', '잔여 질문']) {
      expect(displaySpeaker(meta)).toBeNull();
    }
    // EPILOGUE 는 대화창 대신 기록 카드라 발언자 표기("22:20" 등)가 카드 이름이다
    const shown = scenes
      .filter((s) => s.id !== 'EPILOGUE')
      .flatMap((s) =>
        s.lines.filter((l) => l.kind !== 'direction').map((l) => displaySpeaker(l.speaker) ?? ''),
      );
    const truth = TRUTH_SCENES.flatMap((s) => s.lines.map((l) => displaySpeaker(l.speaker) ?? ''));
    expect(
      [...shown, ...truth].filter((n) =>
        /[()]|화면|\d:\d\d|플레이어|나레이션|후일담|잔여 질문/.test(n),
      ),
    ).toEqual([]);
  });
});
