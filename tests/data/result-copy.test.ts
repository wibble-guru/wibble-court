import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AXES, type Analysis } from '@/engine/score';
import {
  AXIS_COPY,
  AXIS_LABEL,
  BLEND_COPY,
  DETAILS_COPY,
  RESULT_COPY,
  resultContent,
} from '@/data/result-copy';

const SPEC = resolve(process.cwd(), '.claude/docs/specs/script-v4.md');

/** 11가지 결과 (단일 4, 복합 6, 보류 1) */
const PAIRS = ['OL', 'OC', 'OP', 'LC', 'LP', 'CP'];
const fake = (primary: string, secondary: string, blended: boolean, ready = true): Analysis =>
  ({ primary, secondary, blended, status: ready ? 'READY' : 'INSUFFICIENT' }) as Analysis;
const ALL: Analysis[] = [
  ...AXES.map((a) => fake(a, a === 'O' ? 'L' : 'O', false)),
  ...PAIRS.map((p) => fake(p[0], p[1], true)),
  fake('O', 'L', false, false),
];

describe('결과 전송 내용', () => {
  it('11가지 모두 사이트 길이 제한 안 (intro 40, title 40, summary 200)', () => {
    for (const a of ALL) {
      const c = resultContent(a);
      expect(c.intro!.length).toBeLessThanOrEqual(40);
      expect(c.title!.length).toBeLessThanOrEqual(40);
      expect(c.summary!.length).toBeLessThanOrEqual(200);
      expect(Object.keys(c).sort()).toEqual(['intro', 'summary', 'title']);
    }
  });
});

describe.skipIf(!existsSync(SPEC))('결과 문구 대본 대조 (로컬 전용)', () => {
  it('모든 문구가 대본 5부에 글자 그대로 있다', () => {
    const md = readFileSync(SPEC, 'utf8');
    const part5 = md.slice(md.indexOf('# 5부.'), md.indexOf('# 6부.'));
    const strings = [
      ...Object.values(AXIS_COPY).flatMap((c) => Object.values(c)),
      ...Object.values(BLEND_COPY).flatMap((c) => Object.values(c)),
      ...Object.values(RESULT_COPY).flatMap((v) =>
        typeof v === 'string' ? [v] : Object.values(v),
      ),
      ...Object.values(AXIS_LABEL),
      ...Object.values(DETAILS_COPY).flatMap((v) => (typeof v === 'string' ? [v] : [...v])),
    ];
    // introShort 는 소개 문단의 앞부분이라 그대로 들어 있다
    expect(strings.filter((s) => !part5.includes(s))).toEqual([]);
  });
});
