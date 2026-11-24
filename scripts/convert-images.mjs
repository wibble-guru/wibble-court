// 원본 이미지(PNG/JPG)를 WebP 로 변환한다.
// 사용법: 원본을 raw-assets/<bg|ui|icons|modal>/ 에 넣고 `pnpm images`
//  - bg    : 최대 1920px(원본보다 키우지 않음) + @1280(모바일) 두 버전, 품질 80
//  - bg 의 `*-portrait` : 모바일 세로 화면 전용 그림. 높이 최대 2340px 한 버전만, 품질 80
//  - modal : 큰 픽셀 그림이라 폭 최대 540px 로 줄인다(최근접, 픽셀 덩어리 유지). 그림에 잡티가 있어 무손실이면 200KB 라 품질 85
//  - 그 외 : 원본 크기 유지, 픽셀 이미지는 무손실(lossless)
import { mkdir, readdir } from 'node:fs/promises';
import { extname, join, parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'raw-assets';
const OUT = 'public/assets';
const PIXEL = new Set(['icons']); // 무손실로 변환할 폴더

const isImage = (f) => ['.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase());

for (const folder of ['bg', 'ui', 'icons', 'modal']) {
  const files = await readdir(join(SRC, folder)).catch(() => []);
  await mkdir(join(OUT, folder), { recursive: true });

  for (const file of files.filter(isImage)) {
    const { name } = parse(file);
    const input = join(SRC, folder, file);

    if (folder === 'bg' && name.endsWith('-portrait')) {
      await sharp(input)
        .resize({ height: 2340, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(join(OUT, folder, `${name}.webp`));
    } else if (folder === 'bg') {
      await sharp(input)
        .resize({ width: 1920, withoutEnlargement: true }) // 원본이 더 작으면 키우지 않음
        .webp({ quality: 80 })
        .toFile(join(OUT, folder, `${name}.webp`));
      await sharp(input)
        .resize({ width: 1280 })
        .webp({ quality: 78 })
        .toFile(join(OUT, folder, `${name}@1280.webp`));
    } else {
      const webp = PIXEL.has(folder) ? { lossless: true } : { quality: 85 };
      const image = sharp(input);
      if (folder === 'modal') {
        image.resize({ width: 540, withoutEnlargement: true, kernel: 'nearest' });
      }
      await image.webp(webp).toFile(join(OUT, folder, `${name}.webp`));
    }
    console.log(`✓ ${folder}/${name}`);
  }
}
