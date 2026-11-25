// 말하는 인물 그림: 노션 캐릭터 시트의 플레이용 전신 일러스트(배경 투명 PNG, 인물별 세 번째 그림)를 WebP 로.
// 사용법: `pnpm images:chars` → public/assets/chars/<id>.webp
//
// 원본: 노션 그림을 raw-assets/chars/transparent/<id>.png 로 받는다 (배경이 이미 투명)
// 이서원은 대본 발언자가 없어 만들지 않는다.
//
// 변환: 투명 여백을 잘라 내고 머리부터 허벅지(키의 60%)까지만 쓴다 — 아랫부분은 대화창 뒤로 들어가 보이지 않는다.
import { mkdir, readdir } from 'node:fs/promises';
import { parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'raw-assets/chars/transparent';
const OUT = 'public/assets/chars';
const KEEP = 0.6; // 위에서부터 남길 비율
const HEIGHT = 720; // 화면 최대 높이(560px)보다 조금 크게

await mkdir(OUT, { recursive: true });
for (const file of await readdir(SRC)) {
  if (!file.endsWith('.png')) continue;
  const { name } = parse(file);
  const trimmed = await sharp(`${SRC}/${file}`)
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  await sharp(trimmed.data)
    .extract({ left: 0, top: 0, width, height: Math.round(height * KEEP) })
    .resize({ height: HEIGHT })
    .webp({ quality: 80, alphaQuality: 85 })
    .toFile(`${OUT}/${name}.webp`);
  const meta = await sharp(`${OUT}/${name}.webp`).metadata();
  console.log(`✓ chars/${name} ${meta.width}x${meta.height}`);
}
