import { describe, expect, it } from 'vitest';
import type { SceneId } from '@/engine/types';
import { visibleLines, startPlay } from '@/features/play/runner';
import { PRELOAD_BGS } from './assets';
import { MAIN_BACKGROUNDS, backdropAt, upcomingBackgrounds } from './scene-bg';
import { SCENES } from './scenes';

const story = startPlay().story;
const ids = Object.keys(SCENES) as SceneId[];
/** 엔딩·EPILOGUE 뒤(RESULT, 진실 공개)는 5·6단계라 아직 미리 받을 배경이 없다 */
const lastScenes = (id: SceneId) => id === 'EPILOGUE' || id.includes('GUILTY');

describe('장면별 배경', () => {
  it('타이틀 미리 받기 목록 = 본편 배경 전부 (진실 공개 전용 배경 없음)', () => {
    expect(new Set(PRELOAD_BGS)).toEqual(new Set(MAIN_BACKGROUNDS));
    expect(PRELOAD_BGS[0]).toBe(backdropAt('P00', [], 0).bg);
  });

  it('C30 은 녹음 속 강도현 대사부터 휴대폰 배경 + 조명 어둡게, 질문 단계도 그대로', () => {
    const lines = visibleLines('C30', story);
    const at = lines.findIndex((l) => l.speaker === '녹음 속 강도현');
    expect(at).toBeGreaterThan(0);
    expect(backdropAt('C30', lines, at - 1)).toEqual({ bg: 'L-04_officer-desk' });
    expect(backdropAt('C30', lines, at)).toEqual({ bg: 'R-02_call-phone', effect: 'dim' });
    expect(backdropAt('C30', lines, lines.length).effect).toBe('dim');
  });

  it('녹음 재생 장면은 녹음기, 판결·엔딩은 비네트', () => {
    expect(backdropAt('A10', [], 0).bg).toBe('R-01_recorder');
    expect(backdropAt('J110', [], 0)).toEqual({ bg: 'L-09_verdict', effect: 'vignette' });
    expect(backdropAt('NOTGUILTY-C', [], 0).effect).toBe('vignette');
  });

  it('다음 장면 후보 배경: 분기 3개, 판결 뒤 엔딩, 장면 안 전환', () => {
    expect(upcomingBackgrounds('C30').sort()).toEqual(
      ['R-02_call-phone', 'E-04_email-draft', 'L-01_court'].sort(),
    );
    expect(upcomingBackgrounds('J110')).toEqual(['L-09_verdict']);
    expect(upcomingBackgrounds('F60')).toEqual(['L-01_court']);
    for (const id of ids) {
      expect(upcomingBackgrounds(id).length > 0, id).toBe(!lastScenes(id));
    }
  });
});
