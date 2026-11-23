import { useEffect, useRef, useState } from 'preact/hooks';
import { BG_SIZES, bgFocus, bgSrcSet, type BgId } from '@/data/assets';

/**
 * 장면 배경 겹. 1920×1080 비율 그림을 화면을 꽉 채우도록 확대한다(cover).
 * 가로 화면은 거의 그대로, 세로 화면은 높이에 맞춰 키우고 양옆을 자른다 (남길 중심은 bgFocus).
 * 해상도는 srcset + sizes 로 브라우저가 고른다 — lib/preload 도 같은 값을 써서 미리 받은 파일을 그대로 쓴다.
 */
export function SceneBackground({ id, onReady }: { id: BgId; onReady?: () => void }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 캐시에서 바로 뜨면 load 이벤트가 렌더 전에 지나갈 수 있다
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, [id]);

  useEffect(() => {
    if (loaded) onReady?.();
  }, [loaded, onReady]);

  return (
    <img
      ref={ref}
      className={`scene-bg${loaded ? 'is-loaded' : ''}`}
      srcSet={bgSrcSet(id)}
      sizes={BG_SIZES}
      style={{ objectPosition: bgFocus(id) }}
      alt=""
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  );
}
