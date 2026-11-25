// 말하는 인물 그림: 노션 캐릭터 시트의 플레이용 전신 일러스트(배경 투명)를 WebP 로.
// 사용법: `pnpm images:chars`
//  - 기본 그림: raw-assets/chars/transparent/<id>.png → public/assets/chars/<id>.webp
//  - 포즈 그림: raw-assets/chars/poses/<id>-<n>.png → public/assets/chars/<id>-<n>.webp (계획서 71)
// 이서원은 대본 발언자가 없어 만들지 않는다.
//
// 변환: 모든 그림을 같은 기준으로 자른다 — 머리 꼭대기부터 발끝까지의 키(body)를 재서
//  머리 위 PAD × body 부터 머리 아래 KEEP × body 까지. 손을 머리 위로 든 포즈도 인물 크기가 같게 보인다.
//  머리 꼭대기 = 위에서 내려가며 불투명 폭이 키의 6% 이상인 첫 줄 (가는 팔·손은 건너뜀)
//  좌우는 그 범위 안에서 인물이 있는 곳만 남긴다.
import { mkdir, readdir } from 'node:fs/promises';
import { parse } from 'node:path';
import sharp from 'sharp';

const OUT = 'public/assets/chars';
const SOURCES = [
  { dir: 'raw-assets/chars/transparent', match: /^[a-z-]+\.png$/ },
  { dir: 'raw-assets/chars/poses', match: /^[a-z-]+-\d\.png$/ },
];
const SKIP = /^lee-seowon/;
const PAD = 0.08; // 머리 위 여백 (든 손이 들어갈 자리)
const KEEP = 0.6; // 머리 아래로 남길 비율 (허벅지까지 — 아랫부분은 대화창 뒤)
const HEIGHT = 720; // 화면 최대 높이보다 조금 크게

/** 알파로 머리 꼭대기·발끝, 자를 범위 안의 좌우 끝을 잰다 */
async function measure(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const solid = (x, y) => data[y * W + x] > 8;
  const rows = new Array(H).fill(0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[y * W + x] > 128) rows[y]++;
  const top = rows.findIndex((c) => c > 0);
  const bottom = H - 1 - [...rows].reverse().findIndex((c) => c > 0);
  const head = rows.findIndex((c, y) => y >= top && c >= (bottom - top) * 0.06);
  const body = bottom - head;
  const from = Math.round(head - PAD * body);
  const to = Math.min(H, Math.round(head + KEEP * body));
  let left = W,
    right = 0;
  for (let y = Math.max(0, from); y < to; y++)
    for (let x = 0; x < W; x++)
      if (solid(x, y)) {
        if (x < left) left = x;
        if (x > right) right = x;
      }
  return { W, from, to, left, right };
}

await mkdir(OUT, { recursive: true });
for (const { dir, match } of SOURCES) {
  for (const file of (await readdir(dir)).sort()) {
    if (!match.test(file) || SKIP.test(file)) continue;
    const { name } = parse(file);
    const input = `${dir}/${file}`;
    const { from, to, left, right } = await measure(input);
    const extendTop = Math.max(0, -from); // 위쪽이 그림 밖이면 투명하게 늘린다
    const canvas = await sharp(input)
      .ensureAlpha()
      .extend({ top: extendTop, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    await sharp(canvas)
      .extract({ left, top: from + extendTop, width: right - left + 1, height: to - from })
      .resize({ height: HEIGHT })
      .webp({ quality: 80, alphaQuality: 85 })
      .toFile(`${OUT}/${name}.webp`);
    const meta = await sharp(`${OUT}/${name}.webp`).metadata();
    console.log(`✓ chars/${name} ${meta.width}x${meta.height}`);
  }
}
