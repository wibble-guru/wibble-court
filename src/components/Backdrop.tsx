import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { BgEffect } from '@/data/scene-bg';
import type { BgId } from '@/data/assets';
import { cx } from '@/lib/cx';
import { SceneBackground } from './SceneBackground';

/** 새 배경이 다 나타난 뒤 이전 배경을 지우기까지 (index.css 의 .scene-bg transition 0.6s 보다 조금 길게) */
const SETTLE_MS = 700;

type Props = { bg: BgId; effect?: BgEffect };

/**
 * 장면 배경 겹. 배경이 바뀌면 새 그림을 이전 그림 위에 얹어 opacity 로 나타나게 하고(SceneBackground 의 로드 페이드),
 * 다 나타나면 이전 그림을 지운다 — 검게 끊기지 않는다. 같은 배경이 이어지면 아무 일 없음.
 * 효과: dim(조명 어둡게, C30 통화 재생) / vignette(가장자리 어둡게, 판결·엔딩). 모두 opacity 겹.
 */
export function Backdrop({ bg, effect }: Props) {
  const [layers, setLayers] = useState<BgId[]>([bg]);
  const timerRef = useRef(0);

  useEffect(() => {
    setLayers((prev) => (prev.at(-1) === bg ? prev : [...prev.slice(-1), bg]));
  }, [bg]);

  // 맨 위 그림이 뜨면 잠시 뒤 아래 그림을 지운다
  const onTopReady = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setLayers((prev) => prev.slice(-1)), SETTLE_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <div className="scene-layer backdrop" aria-hidden="true">
      {layers.map((id, i) => (
        <div key={id} className="backdrop-layer">
          <SceneBackground id={id} onReady={i === layers.length - 1 ? onTopReady : undefined} />
        </div>
      ))}
      <div className={cx('backdrop-dim', effect === 'dim' && 'is-on')} />
      <div className={cx('backdrop-vignette', effect === 'vignette' && 'is-on')} />
    </div>
  );
}
