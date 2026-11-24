// 빌드 결과물 검사: 진실 공개(대본 10부) 전용 문장·에셋 이름이 초기 로딩 파일(index.html, index-*.js)에 없는지.
// 사용법: pnpm build 후 `pnpm check:truth`. 진실 공개는 별도 청크(truth-*.js)에만 있어야 한다 (대본 11.1).
// 진범 이름은 본편에도 증인으로 나오므로 이름이 아니라 진실 공개에만 있는 문장으로 검사한다.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const TRUTH_ONLY = [
  '민태성을 죽인 사람은',
  '실제 범행자 확인',
  '사건의 진실 확인하기',
  '진실을 알게 된 지금',
  'E-11_cctv',
  'E-12_edit-copy',
  'L-12_dark-court',
  'L-07_edit-room',
];

const assets = await readdir(join(DIST, 'assets'));
const initial = [
  join(DIST, 'index.html'),
  ...assets.filter((f) => /^index-.*\.js$/.test(f)).map((f) => join(DIST, 'assets', f)),
];
const truthChunks = assets.filter((f) => /^truth-.*\.js$/.test(f));

let failed = false;
for (const file of initial) {
  const text = await readFile(file, 'utf8');
  for (const phrase of TRUTH_ONLY) {
    if (text.includes(phrase)) {
      console.error(`✗ ${file} 에 진실 공개 전용 문자열: ${phrase}`);
      failed = true;
    }
  }
}
if (truthChunks.length === 0) {
  console.error('✗ 진실 공개 별도 청크(truth-*.js)가 없습니다');
  failed = true;
}
if (failed) process.exit(1);
console.log(
  `✓ 초기 파일 ${initial.length}개에 진실 공개 전용 문자열 없음, 별도 청크: ${truthChunks.join(', ')}`,
);
