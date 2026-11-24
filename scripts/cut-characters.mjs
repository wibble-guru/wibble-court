// 캐릭터 픽셀 시트(raw-assets/chars/character-pixel-sheet.png, 3x3 칸, 투명 배경)를 인물별 WebP 로 자른다.
// 사용법: `pnpm images:chars` → public/assets/chars/<id>.webp
// 칸마다 투명 여백을 걷어 내고 모두 같은 배율(SCALE)로 줄여 저장한다 — 인물끼리 키 차이를 그대로 둔다.
// 칸 순서는 노션 캐릭터 시트와 대조해 정했다 (.claude 계획서 49).
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = 'raw-assets/chars/character-pixel-sheet.png';
const OUT = 'public/assets/chars';
const SCALE = 0.85;

/** 왼쪽 위부터 오른쪽으로 (이서원은 대본 발언자가 없어 자르지 않는다) */
const CELLS = [
  'judge',
  'prosecutor',
  'defense',
  'defendant',
  'han-yura',
  null,
  'expert',
  'clerk',
  'informant',
];

await mkdir(OUT, { recursive: true });
const sheet = sharp(SRC);
const { width, height } = await sheet.metadata();
const cw = Math.floor(width / 3);
// 윗줄 인물의 발이 칸 경계(1/3)를 넘어 내려와서, 줄 경계는 줄 사이 빈 곳으로 잡는다
const ROWS = [
  [0, Math.round(height * 0.367)],
  [Math.round(height * 0.367), Math.round(height * 0.678)],
  [Math.round(height * 0.678), height],
];

for (const [i, id] of CELLS.entries()) {
  if (!id) continue;
  const cell = await sheet
    .clone()
    .extract({
      left: (i % 3) * cw,
      top: ROWS[Math.floor(i / 3)][0],
      width: cw,
      height: ROWS[Math.floor(i / 3)][1] - ROWS[Math.floor(i / 3)][0],
    })
    .png()
    .toBuffer();
  // 투명 여백 걷기: 알파 128 넘는 픽셀의 경계 (그림 밖 옅은 잡티는 무시)
  const { data, info } = await sharp(cell)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let [x0, y0, x1, y1] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  // 그림 밖 잡티(알파 128 이하)는 지운다
  for (let i = 3; i < data.length; i += 4) if (data[i] <= 128) data[i] = 0;
  await sharp(data, { raw: info })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    // 화면에서는 높이 300px 안팎으로 그려서 그 크기로 줄인다 (원본은 AI 가 그린 픽셀풍이라 격자가 고르지 않음)
    .resize({ width: Math.round((x1 - x0 + 1) * SCALE) })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(`${OUT}/${id}.webp`);
  const meta = await sharp(`${OUT}/${id}.webp`).metadata();
  console.log(`✓ chars/${id} ${meta.width}x${meta.height} (원본 ${x1 - x0 + 1}x${y1 - y0 + 1})`);
}
