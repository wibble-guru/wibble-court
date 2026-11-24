import { describe, expect, test } from 'vitest';
import { SCENES } from '@/data/scenes';
import type { SceneId } from '@/engine/types';
import { sceneTitle } from './scene-title';

const ids = Object.keys(SCENES).filter((id) => id !== 'EPILOGUE') as SceneId[];

describe('장면 제목 막대', () => {
  test('본편 모든 장면에 제목이 있다', () => {
    for (const id of ids) expect(sceneTitle(id), id).toBeTruthy();
  });

  test('본 장면 제목은 대본 장면 제목의 앞부분 그대로', () => {
    for (const id of ids) {
      const title = sceneTitle(id);
      const script = SCENES[id as keyof typeof SCENES]?.title;
      if (title && script && /^([A-Z]\d+0|P00|M65)$/.test(id)) {
        expect(script.startsWith(title), id).toBe(true);
      }
    }
  });

  test('갈래 장면은 본 장면 제목 — 고른 선택지·판결을 드러내지 않는다', () => {
    expect(sceneTitle('A11-B')).toBe(sceneTitle('A10'));
    expect(sceneTitle('G71-C')).toBe(sceneTitle('G70'));
    expect(sceneTitle('QM')).toBe(sceneTitle('M65'));
    expect(sceneTitle('GUILTY-A')).toBe(sceneTitle('NOTGUILTY-C'));
    for (const id of ids) expect(sceneTitle(id)).not.toMatch(/유죄|무죄|QM|우선/);
  });
});
