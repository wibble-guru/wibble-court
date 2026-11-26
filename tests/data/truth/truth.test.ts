import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRUTH_BUTTONS, TRUTH_SCENES } from '@/data/truth/truth';

const SPEC = resolve(process.cwd(), '.claude/docs/specs/script-v4.md');

describe('진실 공개 데이터', () => {
  it('TRUTH-GATE 부터 TRUTH-END 까지 대본 순서 그대로', () => {
    expect(TRUTH_SCENES.map((s) => s.id)).toEqual([
      'TRUTH-GATE', 'TRUTH-01', 'TRUTH-02', 'TRUTH-03', 'TRUTH-04', 'TRUTH-05', 'TRUTH-END',
    ]); // prettier-ignore
  });

  it('TRUTH-END 의 후일담은 판결마다 두 줄씩, 같은 진실 공개 장면을 지난다 (11.2 유죄/무죄)', () => {
    const end = TRUTH_SCENES.at(-1)!.lines;
    expect(end.filter((l) => l.when === 'GUILTY')).toHaveLength(2);
    expect(end.filter((l) => l.when === 'NOT_GUILTY')).toHaveLength(2);
    const others = TRUTH_SCENES.slice(0, -1).flatMap((s) => s.lines);
    expect(others.some((l) => l.when)).toBe(false);
  });
});

describe.skipIf(!existsSync(SPEC))('진실 공개 대본 대조 (로컬 전용)', () => {
  const md = existsSync(SPEC) ? readFileSync(SPEC, 'utf8') : '';
  const part10 = md.slice(md.indexOf('# 10부.'), md.indexOf('# 11부.')).replaceAll('**', '');
  const strip = (s: string) => s.replaceAll('**', '');

  it('모든 문장·제목·버튼이 10부에 글자 그대로 있다 (9부 문장 0)', () => {
    const strings = [
      ...TRUTH_SCENES.flatMap((s) => [s.title, ...s.lines.flatMap((l) => [l.speaker, l.text])]),
      ...Object.values(TRUTH_BUTTONS),
    ].filter(Boolean);
    expect(strings.filter((s) => !part10.includes(strip(s)))).toEqual([]);
  });

  it('10부의 큰따옴표 대사가 하나도 빠지지 않았다', () => {
    const quotes = [...part10.matchAll(/“([^”]+)”/g)].map((m) => m[1]);
    const blob = strip(TRUTH_SCENES.flatMap((s) => s.lines.map((l) => l.text)).join('\n'));
    expect(quotes.filter((q) => !blob.includes(q))).toEqual([]);
  });
});

describe('진실 공개 포즈', () => {
  it('같은 발언자가 이어 말할 때 같은 그림을 되풀이하지 않는다', () => {
    const last = new Map<string, number>();
    for (const scene of TRUTH_SCENES)
      for (const line of scene.lines) {
        if (line.pose === undefined) continue;
        expect(line.pose, `${scene.id} ${line.speaker}`).not.toBe(
          last.get(line.speaker.slice(0, 2)),
        );
        last.set(line.speaker.slice(0, 2), line.pose);
      }
  });
});
