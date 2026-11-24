// UI 키트 한 장(raw-assets/ui/ui-kit.png, 1774x887)을 화면에서 쓰는 조각 WebP 로 자른다.
// 사용법: `pnpm images:kit` → public/assets/ui/kit-*.webp
// 조각은 CSS border-image 로 늘려 쓴다. 늘어나는 가운데 줄에 장식(월계수·보석·갈매기)이 걸리지 않게
// 깨끗한 곳을 덮어 지운다. 좌표는 원본 px (.claude 계획서 40 의 표와 같음).
import sharp from 'sharp';

const SRC = 'raw-assets/ui/ui-kit.png';
const OUT = 'public/assets/ui';
const WEBP = { quality: 88, alphaQuality: 100 };

const kit = sharp(SRC);

/** 원본의 한 영역 (sharp extract) */
const region = (x0, y0, x1, y1) => ({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 });

async function crop(box) {
  return kit.clone().extract(box).png().toBuffer();
}

/**
 * 조각 안의 (tx,ty) 를 원본 from 영역으로 바꾼다 — 늘어날 줄의 장식을 지울 때.
 * 그 자리를 먼저 비우고(dest-out) 붙인다. 그냥 덮으면 붙이는 쪽의 투명한 곳으로 장식이 비친다
 */
async function patch(from, tx, ty) {
  const hole = { width: from.width, height: from.height, channels: 4, background: '#000' };
  return [
    { input: { create: hole }, left: tx, top: ty, blend: 'dest-out' },
    { input: await crop(from), left: tx, top: ty },
  ];
}

async function save(name, input, composites = []) {
  await sharp(input).composite(composites.flat()).webp(WEBP).toFile(`${OUT}/kit-${name}.webp`);
  console.log(`✓ ui/kit-${name}`);
}

// 왼쪽 위: 저울 엠블럼 (기록장 버튼) / 장면 제목 막대
await save('emblem', await crop(region(36, 18, 206, 185)));
await save('bar', await crop(region(196, 44, 671, 154)));

// 오른쪽 위: 증거 상자 틀 (가운데는 CSS 색, border-image 로 테두리만) / 빈 칸 틀
// 칸·아이콘이 그려진 안쪽은 쓰지 않으므로 단색으로 덮어 파일을 줄인다
await save('tray', await crop(region(746, 20, 1740, 195)), [
  {
    input: { create: { width: 880, height: 120, channels: 4, background: '#1e1e28' } },
    left: 48,
    top: 28,
  },
]);
await save('slot', await crop(region(796, 47, 909, 164)));

// 대화창: 위 테두리의 월계수·이름표 자리, 아래 가운데 보석, 오른쪽 아래 갈매기, 오른쪽 정의의 여신 무늬를 지운다
// (이름표·보석·무늬는 따로 자르고, 갈매기는 대사가 다 나왔을 때만 CSS 로 띄운다)
// 무늬가 테두리 조각에 있으면 대화창이 높아질 때(세로 화면) 세로로 늘어나서 따로 붙인다
{
  const box = region(36, 240, 1729, 495);
  const at = (x, y) => [x - box.left, y - box.top];
  await save('dialog', await crop(box), [
    await patch(region(700, 240, 1072, 292), ...at(172, 240)),
    await patch(region(950, 452, 1014, 495), ...at(848, 452)),
    // 무늬 자리 (오른쪽 모서리 장식은 남긴다). 덮을 바탕은 월계수·보석이 없는 가운데에서
    await patch(region(560, 262, 840, 474), ...at(1316, 262)),
    await patch(region(600, 262, 656, 474), ...at(1596, 262)),
    await patch(region(700, 428, 760, 472), ...at(1606, 428)),
  ]);
}

// 정의의 여신 무늬: 왼쪽·위 가장자리를 흐리게 해서 대화창 바탕에 녹아들게
{
  const w = 362;
  const h = 218;
  const fade = Buffer.from(
    `<svg width="${w}" height="${h}"><defs>` +
      `<linearGradient id="x"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff"/></linearGradient>` +
      `<linearGradient id="y" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".15" stop-color="#fff"/><stop offset=".9" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<mask id="m"><rect width="${w}" height="${h}" fill="url(#y)"/></mask></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#x)" mask="url(#m)"/></svg>`,
  );
  // 무늬 오른쪽 아래의 갈매기는 위쪽 옷자락으로 덮어 지운다
  const base = await sharp(await crop(region(1316, 258, 1316 + w, 258 + h)))
    .composite((await patch(region(1600, 384, 1664, 428), 1600 - 1316, 428 - 258)).flat())
    .png()
    .toBuffer();
  const justice = await sharp(base)
    .composite([{ input: fade, blend: 'dest-in' }])
    .png()
    .toBuffer();
  await save('justice', justice);
}

// 이름표 (깎은 육각 판). 뒤로 지나가는 대화창 테두리·월계수 줄기는 육각 밖이라 가린다
{
  const box = region(214, 202, 506, 279);
  const w = box.width;
  const h = box.height;
  const hex = Buffer.from(
    `<svg width="${w}" height="${h}"><polygon fill="#fff" points="2,${h / 2} 22,2 ${w - 22},2 ${w - 2},${h / 2} ${w - 22},${h - 2} 22,${h - 2}"/></svg>`,
  );
  const plate = await sharp(await crop(box))
    .composite([{ input: hex, blend: 'dest-in' }])
    .png()
    .toBuffer();
  await save('plate', plate);
}

// 대화창 아래 가운데 보석
await save('gem', await crop(region(850, 452, 912, 518)));

// 선택지 판 (오른쪽 빗금). 왼쪽 마름모는 판이 두세 줄로 늘어나도 찌그러지지 않게 따로 자르고 판에서는 지운다
await save('choice', await crop(region(54, 526, 800, 622)), [
  await patch(region(300, 552, 336, 594), 110 - 54, 552 - 526),
]);
await save('diamond', await crop(region(108, 554, 145, 592)));

// 패널 (생각 기록 시트·기록장): 네 모서리 장식은 그대로, 가운데를 늘린다
await save('panel', await crop(region(864, 536, 1315, 711)));

// 라디오 (빈 동그라미 / 고른 동그라미), 슬라이더 손잡이
await save('radio', await crop(region(1210, 762, 1260, 814)));
await save('radio-on', await crop(region(1266, 762, 1318, 814)));
{
  // 손잡이 왼쪽에 붙은 트랙 끝은 동그라미 밖이라 가린다
  const circle = Buffer.from(
    '<svg width="44" height="44"><circle cx="22" cy="22" r="21" fill="#fff"/></svg>',
  );
  const thumb = await sharp(await crop(region(1493, 767, 1537, 811)))
    .composite([{ input: circle, blend: 'dest-in' }])
    .png()
    .toBuffer();
  await save('thumb', thumb);
}
