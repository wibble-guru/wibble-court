import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SceneId } from '@/engine/types';
import { portraitOf } from './characters';
import { LINE_POSES, poseAt, poseSrcsIn } from './line-poses';
import { SCENES } from './scenes';

describe('줄별 포즈', () => {
  it('그림 있는 발언자 줄에는 모두 포즈가 있고, 나머지 줄은 비어 있다', () => {
    for (const [id, scene] of Object.entries(SCENES) as [
      SceneId,
      NonNullable<(typeof SCENES)[SceneId]>,
    ][]) {
      const hasPortrait = scene.lines.map(
        (l) => l.kind !== 'direction' && portraitOf(l.speaker) !== null,
      );
      if (!hasPortrait.some(Boolean)) {
        expect(LINE_POSES[id], id).toBeUndefined();
        continue;
      }
      const row = LINE_POSES[id];
      expect(row, id).toBeDefined();
      expect(row!.length, id).toBe(scene.lines.length);
      hasPortrait.forEach((has, i) => {
        expect(has ? /[0-9]/.test(row![i]!) : row![i] === '.', `${id}[${i}]`).toBe(true);
      });
    }
  });

  it('표에 없는 곳은 기본(0)', () => {
    expect(poseAt('P00', 1)).toBe(1);
    expect(poseAt('P00', 0)).toBe(0);
    expect(poseAt('EPILOGUE', 3)).toBe(0);
  });

  it('장면에서 쓰는 포즈 그림 주소를 중복 없이 모은다', () => {
    // P00: 서기 1, 재판장 1, 검사 7·3·4, 변호인 3·5
    expect(
      poseSrcsIn('P00')
        .map((s) => s.split('/').pop())
        .sort(),
    ).toEqual([
      'clerk-1.webp',
      'defense-3.webp',
      'defense-5.webp',
      'judge-1.webp',
      'prosecutor-3.webp',
      'prosecutor-4.webp',
      'prosecutor-7.webp',
    ]);
  });

  it('표에 쓴 포즈 그림 파일이 모두 있다', () => {
    for (const id of Object.keys(LINE_POSES) as SceneId[]) {
      for (const src of poseSrcsIn(id)) {
        const file = `public/assets/chars/${src.split('/').pop()}`;
        expect(existsSync(file), `${id}: ${file}`).toBe(true);
      }
    }
  });
});
