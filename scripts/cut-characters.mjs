// 말하는 인물 그림: 노션 캐릭터 시트 왼쪽의 상반신 일러스트를 배경 없이 WebP 로.
// 사용법: `pnpm images:chars` → public/assets/chars/<id>.webp
//
// 원본 준비 (한 번만, macOS):
//  1. 노션 "캐릭터 시트" 의 인물별 시트(1672x941)에서 왼쪽 일러스트 영역 (x 0~264, y 66~676) 을 자른다
//     — 아래 소개 카드와 오른쪽 설정 칸이 들어가지 않는 범위
//  2. `swift scripts/cutout-subject.swift <자른 그림> raw-assets/chars/portraits/<id>.png`
//     (macOS Vision 의 인물 따내기. 그림을 외부로 보내지 않는다)
//     오지안 시트는 배경이 옅어 한 번에 안 따져서, 대비를 올린 사본으로 따낸 알파를 원본 색에 입히고
//     옷 위의 손글씨 서명("OH JIAN")은 옆 옷자락으로 덮었다
//  이서원은 대본 발언자가 없어 만들지 않는다.
import { mkdir, readdir } from 'node:fs/promises';
import { parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'raw-assets/chars/portraits';
const OUT = 'public/assets/chars';

await mkdir(OUT, { recursive: true });
for (const file of await readdir(SRC)) {
  if (!file.endsWith('.png')) continue;
  const { name } = parse(file);
  await sharp(`${SRC}/${file}`)
    .webp({ quality: 85, alphaQuality: 90 })
    .toFile(`${OUT}/${name}.webp`);
  const meta = await sharp(`${OUT}/${name}.webp`).metadata();
  console.log(`✓ chars/${name} ${meta.width}x${meta.height}`);
}
