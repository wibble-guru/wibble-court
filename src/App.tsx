import { useRef, useState } from 'preact/hooks';
import { FIRST_SCENE_BG } from '@/data/assets';
import { PlayScreen } from '@/features/play/PlayScreen';
import type { StartMode } from '@/features/title/TitleActions';
import { TitleScreen } from '@/features/title/TitleScreen';
import { cx } from '@/lib/cx';
import { delay, prefersReducedMotion } from '@/lib/motion';
import { preloadBackground } from '@/lib/preload';
import { emptyScores, useGame, type Progress } from '@/store/game';

/** 암전 시간 (index.css 의 .curtain transition 과 같게) */
const CURTAIN_MS = 600;
/** 첫 장면 배경을 이보다 오래 기다리지는 않는다 (네트워크가 멈춰도 암전에 갇히지 않게) */
const FIRST_SCENE_WAIT_MS = 8000;

type Screen = { kind: 'title' } | { kind: 'play'; start: Progress };

/**
 * 화면 전환만 맡는다: 타이틀 → (암전) → 플레이.
 * 사이트 연결·막힌 화면·테마 반영은 main.tsx 의 WibbleFrame(@wibble-guru/boilerplate)이 맡는다.
 */
export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });
  const [curtain, setCurtain] = useState(false);
  const busyRef = useRef(false);

  async function start(mode: StartMode) {
    if (busyRef.current) return;
    busyRef.current = true;

    const { progress, clearProgress } = useGame.getState();
    const startAt =
      mode === 'continue' && progress ? progress : { sceneIndex: 0, scores: emptyScores() };
    if (mode === 'new') clearProgress();

    // 검게 페이드아웃하는 동안 첫 장면 배경을 기다린다 (미리 받기가 끝났으면 바로)
    setCurtain(true);
    await Promise.all([
      delay(prefersReducedMotion() ? 0 : CURTAIN_MS),
      Promise.race([preloadBackground(FIRST_SCENE_BG), delay(FIRST_SCENE_WAIT_MS)]),
    ]);
    setScreen({ kind: 'play', start: startAt });
    setCurtain(false);
    busyRef.current = false;
  }

  return (
    <>
      {screen.kind === 'title' && <TitleScreen onStart={start} leaving={curtain} />}
      {screen.kind === 'play' && (
        <PlayScreen start={screen.start} onRestart={() => setScreen({ kind: 'title' })} />
      )}
      <div className={cx('curtain', curtain && 'is-on')} aria-hidden="true" />
    </>
  );
}
