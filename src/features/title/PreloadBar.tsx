import { usePreload } from '@/store/preload';

/** 뒤에서 미리 받는 진행률. 얇은 금색 바 하나, 다 받으면 사라진다. */
export function PreloadBar() {
  const ratio = usePreload((s) => (s.total > 0 ? s.done / s.total : 0));
  const done = usePreload((s) => s.total > 0 && s.done >= s.total);

  return (
    <div
      className="preload-bar"
      data-done={done}
      role="progressbar"
      aria-label="에셋 불러오는 중"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-hidden={done}
    >
      <span style={{ transform: `scaleX(${ratio})` }} />
    </div>
  );
}
