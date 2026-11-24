import { BG_SIZES, bgSrcSet, type BgId } from '@/data/assets';
import { usePreload } from '@/store/preload';

/** 같은 파일을 두 번 받지 않도록 요청을 기억한다 (키: src 또는 srcset) */
const requests = new Map<string, Promise<void>>();

type Source = { src?: string; srcset?: string; sizes?: string };

/**
 * 이미지 하나를 받는다. 실패해도 resolve — 미리 받기가 게임 진행을 막지 않게.
 * srcset/sizes 는 화면의 <img> 와 같은 값을 줘서 브라우저가 같은 해상도를 고르게 한다.
 * 디코딩(decode)은 기다리지 않는다: 탭이 백그라운드일 때 decode() 가 끝나지 않아 전환이 멈춘 적이 있다.
 */
function load({ src, srcset, sizes }: Source): Promise<void> {
  const key = srcset ?? src ?? '';
  const cached = requests.get(key);
  if (cached) return cached;

  const request = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      resolve();
      img.decode().catch(() => undefined); // 보이기 전에 미리 디코딩만 걸어 둔다
    };
    img.onerror = () => resolve();
    if (sizes) img.sizes = sizes;
    if (srcset) img.srcset = srcset;
    if (src) img.src = src;
  });
  requests.set(key, request);
  return request;
}

export function preloadBackground(id: BgId): Promise<void> {
  return load({ srcset: bgSrcSet(id), sizes: BG_SIZES });
}

export function preloadImage(src: string): Promise<void> {
  return load({ src });
}

let started = false;

/**
 * 배경·UI 를 동시 요청 4개로 나눠 뒤에서 받는다 (타이틀 배경과 대역폭을 다투지 않게).
 * 진행률은 usePreload 스토어에 쓴다. 여러 번 불러도 한 번만 시작한다.
 */
export function preloadAll(backgrounds: BgId[], images: string[], concurrency = 4): void {
  if (started) return;
  started = true;

  const jobs = [
    ...backgrounds.map((id) => () => preloadBackground(id)),
    ...images.map((src) => () => preloadImage(src)),
  ];
  usePreload.setState({ done: 0, total: jobs.length });

  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      await job();
      usePreload.setState((s) => ({ done: s.done + 1 }));
    }
  };
  for (let i = 0; i < Math.min(concurrency, jobs.length); i++) void worker();
}
