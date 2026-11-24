/**
 * 대본(script-v4.md) ↔ 장면 데이터 대조. 대사·선택지는 대본 문장 그대로여야 한다.
 *
 * 대본은 저장소에 올리지 않는 로컬 파일이라, 파일이 있을 때만 돈다 (CI 에서는 skip).
 * 범위는 3부 시작 ~ 5부 직전(3부 본편, 4부 엔딩, EPILOGUE). 9부·10부는 읽지 않는다.
 * 라우팅 표 출력: `pnpm check:script`
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Scene } from '@/engine/types';
import { SCENES } from '.';

const SPEC = resolve(process.cwd(), '.claude/docs/specs/script-v4.md');
const hasSpec = existsSync(SPEC);

/** 데이터에 넣지 않는 대본 줄 (메타 표기·제작 지침) */
const META = new Set(['저장', '획득', '다음', '연출 주의', '이 화면에서 금지']);
/** 문구가 아니라 위치를 가리키는 표기 (본문은 memo·hint 로 들어감) */
const LABEL_ONLY = new Set(['화면', '재판장의 내부 메모', '화면 안내', '마지막 화면']);
/** 지시문이 섞여 있어 의도적으로 넣지 않은 줄 (계획서 14 질문 2, QM 은 따옴표 안 문장만 memo) */
const OMITTED = [
  '검사와 변호인의 최후 변론이 끝났다. 재판장에게만 보이는 메모.',
  '재판장 기록장에 한 문장만 보인다.',
];

const plain = (s: string) => s.replaceAll('**', '');
const unquote = (s: string) => {
  const t = s.trim();
  return /^[“‘"].*[”’"]$/.test(t) ? t.slice(1, -1) : t;
};

function section(): string[] {
  const lines = readFileSync(SPEC, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.startsWith('# 3부.'));
  const end = lines.findIndex((l) => l.startsWith('# 5부.'));
  if (start < 0 || end < start) throw new Error('대본 범위를 찾지 못함');
  return lines.slice(start, end).map((l) => l.trimEnd());
}

function dataStrings(): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(Object.values(SCENES));
  return out;
}

/** 대본 쪽에서 데이터에 반드시 있어야 하는 문장 */
function requiredFromScript(lines: string[]): string[] {
  const need: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^#{2,3} \[[A-Z0-9-]+\] (.*)$/);
    if (heading) need.push(heading[1]);
    for (const m of line.matchAll(/“([^”]*)”/g)) need.push(m[1]);
    for (const m of line.matchAll(/"([^"]+)"/g)) need.push(m[1]);

    const spoken = line.match(/^(?:\d\. )?\*\*([^*]+?):\*\*\s*(.*)$/);
    if (spoken) {
      const [, speaker, text] = spoken;
      if (META.has(speaker)) continue;
      if (!LABEL_ONLY.has(speaker)) need.push(speaker);
      if (text && !OMITTED.some((o) => text.includes(o))) need.push(unquote(text));
      continue;
    }
    const choice =
      line.match(/^\*\*[A-G]\. (.*)\*\*$/) ??
      line.match(/^- \*\*[A-G]\.\*\* (.*?) → `\w+=\w+`\.$/) ??
      line.match(/^- [A-G]\. (?:\*\*)?(.*?)(?:\*\*)?$/);
    if (choice) need.push(choice[1]);
    const merits = line.match(/^(?:이익|비용|설명): (.*)$/);
    if (merits) need.push(...merits[1].split(/ (?=비용: )/).map((p) => p.replace(/^비용: /, '')));
    const ruled = line.match(/^(?:판사|판결) 대사: (.*)$/);
    if (ruled) need.push(unquote(ruled[1]));
  }
  return need.filter((s) => s.trim() !== '');
}

/** 2부 라우팅 지도의 분기 연결: `├─ A → [A11-A]` */
function routesFromMap(): string[] {
  const lines = readFileSync(SPEC, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.startsWith('# 2부.'));
  const end = lines.findIndex((l) => l.startsWith('# 3부.'));
  const routes: string[] = [];
  let parent = '';
  for (const line of lines.slice(start, end)) {
    const branch = line.match(/([A-C]) → \[([A-Z0-9]+-[A-C])\]/);
    if (branch) routes.push(`${parent} ${branch[1]} → ${branch[2]}`);
    else {
      const head = line.match(/^\s*(?:└─ )?\[([A-Z0-9]+)\]/);
      if (head) parent = head[1];
    }
  }
  return routes;
}

function routesFromData(): string[] {
  const routes: string[] = [];
  for (const scene of Object.values(SCENES) as Scene[]) {
    for (const prompt of scene.prompts ?? []) {
      for (const field of prompt.fields) {
        if (field.kind !== 'choice') continue;
        for (const o of field.options) if (o.next) routes.push(`${scene.id} ${o.key} → ${o.next}`);
      }
    }
  }
  return routes;
}

describe.skipIf(!hasSpec)('대본 대조 (로컬 전용)', () => {
  it('대본의 대사·선택지·제목이 데이터에 글자 그대로 있다', () => {
    const blob = plain(dataStrings().join('\n'));
    const missing = requiredFromScript(section()).filter((s) => !blob.includes(plain(s)));
    expect(missing).toEqual([]);
  });

  it('데이터의 문장은 모두 대본에 있다 (창작 0)', () => {
    const script = plain(section().join('\n'));
    const extra = dataStrings()
      .filter((s) => /[가-힣]/.test(s))
      .filter((s) => !script.includes(plain(s)));
    expect(extra).toEqual([]);
  });

  it('분기 연결이 2부 라우팅 지도와 같다', () => {
    const map = routesFromMap();
    const data = routesFromData();
    if (process.env.PRINT_ROUTES) {
      console.table(map.map((route) => ({ '2부 지도': route, 데이터: data.includes(route) })));
    }
    expect(map).toHaveLength(27);
    expect([...data].sort()).toEqual([...map].sort());
  });
});
