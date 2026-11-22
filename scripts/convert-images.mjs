// 원본 이미지(PNG/JPG)를 WebP 로 변환한다.
// 사용법: 원본을 raw-assets/<bg|ui|icons|modal>/ 에 넣고 `pnpm images`
//  - bg    : 1920px + @1280(모바일) 두 버전, 품질 80
//  - 그 외 : 원본 크기 유지, 픽셀 이미지는 무손실(lossless)
import { mkdir, readdir } from 'node:fs/promises';
import { extname, join, parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'raw-assets';
const OUT = 'public/assets';
const PIXEL = new Set(['icons', 'modal']); // 무손실로 변환할 폴더

const isImage = (f) => ['.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase());

for (const folder of ['bg', 'ui', 'icons', 'modal']) {
  const files = await readdir(join(SRC, folder)).catch(() => []);
  await mkdir(join(OUT, folder), { recursive: true });

  for (const file of files.filter(isImage)) {
    const { name } = parse(file);
    const input = join(SRC, folder, file);

    if (folder === 'bg') {
      await sharp(input)
        .resize({ width: 1920 })
        .webp({ quality: 80 })
        .toFile(join(OUT, folder, `${name}.webp`));
      await sharp(input)
        .resize({ width: 1280 })
        .webp({ quality: 78 })
        .toFile(join(OUT, folder, `${name}@1280.webp`));
    } else {
      const webp = PIXEL.has(folder) ? { lossless: true } : { quality: 85 };
      await sharp(input)
        .webp(webp)
        .toFile(join(OUT, folder, `${name}.webp`));
    }
    console.log(`✓ ${folder}/${name}`);
  }
}
