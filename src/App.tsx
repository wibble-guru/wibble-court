import { useCallback, useRef, useState } from 'preact/hooks';
import { FIRST_SCENE_BG } from '@/data/assets';
import { PlayScreen } from '@/features/play/PlayScreen';
import { resumePlay, startPlay, type Play } from '@/features/play/runner';
import type { StartMode } from '@/features/title/TitleActions';
import { TitleScreen } from '@/features/title/TitleScreen';
import { cx } from '@/lib/cx';
import { delay, prefersReducedMotion } from '@/lib/motion';
import { preloadBackground } from '@/lib/preload';
import { useStory } from '@/store/story';

/** 암전 시간 (index.css 의 .curtain transition 과 같게) */
const CURTAIN_MS = 600;
/** 첫 장면 배경을 이보다 오래 기다리지는 않는다 (네트워크가 멈춰도 암전에 갇히지 않게) */
const FIRST_SCENE_WAIT_MS = 8000;

type Screen = { kind: 'title' } | { kind: 'play'; start: Play };

/**
 * 화면 전환만 맡는다: 타이틀 → (암전) → 플레이 → (엔딩 뒤 암전) → 타이틀.
 * 결과 화면(RESULT)과 결과 전송은 5단계에서 엔딩 뒤에 들어온다.
 * 사이트 연결·막힌 화면·테마 반영은 main.tsx 의 WibbleFrame(@wibble-guru/boilerplate)이 맡는다.
 */
export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });
  const [curtain, setCurtain] = useState(false);
  const busyRef = useRef(false);

  /** 검게 덮고, 기다릴 것을 기다린 뒤 화면을 바꾸고, 걷는다 */
  const transition = useCallback(async (next: Screen, waitFor?: Promise<unknown>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setCurtain(true);
    await Promise.all([delay(prefersReducedMotion() ? 0 : CURTAIN_MS), waitFor]);
    setScreen(next);
    setCurtain(false);
    busyRef.current = false;
  }, []);

  function start(mode: StartMode) {
    const { save, clearStory } = useStory.getState();
    const resumed = mode === 'continue' && save ? resumePlay(save) : null;
    if (!resumed) clearStory();
    // 첫 장면 배경을 기다린다 (미리 받기가 끝났으면 바로). 장면별 배경은 4a
    const background = Promise.race([
      preloadBackground(FIRST_SCENE_BG),
      delay(FIRST_SCENE_WAIT_MS),
    ]);
    void transition({ kind: 'play', start: resumed ?? startPlay() }, background);
  }

  const end = useCallback(() => void transition({ kind: 'title' }), [transition]);

  return (
    <>
      {screen.kind === 'title' && <TitleScreen onStart={start} leaving={curtain} />}
      {screen.kind === 'play' && <PlayScreen start={screen.start} onEnd={end} />}
      <div className={cx('curtain', curtain && 'is-on')} aria-hidden="true" />
    </>
  );
}
