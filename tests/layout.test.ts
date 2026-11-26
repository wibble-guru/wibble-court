import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('폴더 구조', () => {
  it('src/ 에는 테스트 코드를 두지 않는다 (tests/ 에 둔다)', () => {
    const files = readdirSync(resolve(process.cwd(), 'src'), { recursive: true }) as string[];
    expect(files.filter((f) => /\.(test|spec)\.[jt]sx?$|(^|\/)__tests__(\/|$)/.test(f))).toEqual(
      [],
    );
  });
});
