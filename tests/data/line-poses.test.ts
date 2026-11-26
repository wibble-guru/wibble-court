import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SceneId } from '@/engine/types';
import { portraitOf } from '@/data/characters';
import { LINE_POSES, poseAt, poseSrcsIn } from '@/data/line-poses';
import { SCENES } from '@/data/scenes';

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
    // P00: 서기 1, 재판장 1·4, 검사 7·3, 변호인 3·5
    expect(
      poseSrcsIn('P00')
        .map((s) => s.split('/').pop())
        .sort(),
    ).toEqual([
      'clerk-1.webp',
      'defense-3.webp',
      'defense-5.webp',
      'judge-1.webp',
      'judge-4.webp',
      'prosecutor-3.webp',
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

  it('한 장면에서 같은 인물이 이어 말할 때 같은 그림을 되풀이하지 않는다', () => {
    // 번호가 달라도 눈에는 같은 자세로 보이는 그림은 같은 것으로 친다
    const ALIKE: Record<string, string> = {
      'judge 1': 'judge 0',
      'judge 5': 'judge 0',
      'prosecutor 4': 'prosecutor 0',
      'prosecutor 8': 'prosecutor 0',
    };
    const look = (who: string, pose: string) => ALIKE[`${who} ${pose}`] ?? `${who} ${pose}`;
    for (const [id, row] of Object.entries(LINE_POSES) as [SceneId, string][]) {
      const lines = SCENES[id]!.lines;
      const mine = lines.flatMap((line, i) => {
        const p = row[i] === '.' ? null : portraitOf(line.speaker);
        return p ? [{ i, who: p.id, pose: row[i]!, cond: line.when !== undefined }] : [];
      });
      mine.forEach((a, x) => {
        for (const b of mine.slice(x + 1)) {
          if (b.who !== a.who) continue;
          // 둘 다 조건부면 서로 갈래(둘 중 하나만 나옴)일 수 있다
          if (!(a.cond && b.cond))
            expect(look(b.who, b.pose), `${id}[${a.i}] -> [${b.i}] ${a.who}`).not.toBe(
              look(a.who, a.pose),
            );
          // 조건부 줄은 숨을 수 있으므로 그 뒤 줄도 이어서 확인
          if (!b.cond) break;
        }
      });
    }
  });
});
