// 말하는 인물 그림: 노션 캐릭터 시트의 플레이용 전신 일러스트(인물별 두 번째 그림)를 배경 없이 WebP 로.
// 사용법: `pnpm images:chars` → public/assets/chars/<id>.webp
//
// 원본 준비 (한 번만, macOS):
//  `swift scripts/cutout-subject.swift <전신 그림> raw-assets/chars/full/<id>.png`
//  (macOS Vision 의 인물 따내기. 그림을 외부로 보내지 않는다)
//  이서원은 대본 발언자가 없어 만들지 않는다.
//
// 변환: 투명 여백을 잘라 내고, 머리부터 허벅지(키의 60%)까지만 쓴다 — 아랫부분은 대화창 뒤로 들어가 보이지 않는다.
// 회색 배경에서 따낸 가장자리의 밝은 테두리를 줄이려고 알파 경계를 조금 좁힌다.
import { mkdir, readdir } from 'node:fs/promises';
import { parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'raw-assets/chars/full';
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
  const cropped = await sharp(trimmed.data)
    .extract({ left: 0, top: 0, width, height: Math.round(height * KEEP) })
    .resize({ height: HEIGHT })
    .toBuffer();
  // 알파만 꺼내 경계를 좁힌다 (반투명 가장자리 → 더 투명하게). removeAlpha 뒤 joinChannel 은 알파가 빠지므로 raw 로 합친다
  const rgb = await sharp(cropped).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = await sharp(cropped).extractChannel('alpha').linear(1.6, -96).raw().toBuffer();
  const { width: w, height: h } = rgb.info;
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const a = alpha[i];
    // 완전히 투명한 곳의 색은 0 으로 (보이지 않는 색이 용량을 차지하지 않게)
    rgba[i * 4] = a ? rgb.data[i * 3] : 0;
    rgba[i * 4 + 1] = a ? rgb.data[i * 3 + 1] : 0;
    rgba[i * 4 + 2] = a ? rgb.data[i * 3 + 2] : 0;
    rgba[i * 4 + 3] = a;
  }
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 80, alphaQuality: 85 })
    .toFile(`${OUT}/${name}.webp`);
  const meta = await sharp(`${OUT}/${name}.webp`).metadata();
  console.log(`✓ chars/${name} ${meta.width}x${meta.height}`);
}
