import { useCallback, useEffect, useState } from 'preact/hooks';
import { SceneBackground } from '@/components/SceneBackground';
import { PRELOAD_BGS, TITLE_BG, UI_IMAGES } from '@/data/assets';
import { TITLE_COPY } from '@/data/title';
import { cx } from '@/lib/cx';
import { prefersReducedMotion } from '@/lib/motion';
import { preloadAll } from '@/lib/preload';
import { useStory } from '@/store/story';
import { PreloadBar } from './PreloadBar';
import { TitleActions, type StartMode } from './TitleActions';
import './title.css';

/** 등장 연출 전체 길이 (title.css 의 마지막 단계 시작 1.6s + 길이 0.4s) */
const INTRO_MS = 2000;

type Props = {
  onStart: (mode: StartMode) => void;
  /** 시작을 눌러 암전 중이면 더 이상 입력을 받지 않는다 */
  leaving: boolean;
};

/**
 * 타이틀 화면 (T-00).
 * - 등장: 배경 → 로그라인 → 제목 → 부제 → 버튼 (CSS animation-delay). 등장 중 클릭·키 입력이면 바로 최종 상태.
 * - 등장이 끝난 뒤 배경 클릭 / Enter: 저장이 있으면 이어서, 없으면 새로 시작.
 */
export function TitleScreen({ onStart, leaving }: Props) {
  const hasSave = useStory((s) => s.save !== null);
  const [entered, setEntered] = useState(prefersReducedMotion);
  const [skipped, setSkipped] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const skipIntro = useCallback(() => {
    setSkipped(true);
    setEntered(true);
  }, []);

  useEffect(() => {
    if (entered) return;
    const timer = window.setTimeout(() => setEntered(true), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [entered]);

  // 타이틀 배경이 뜨면 나머지 배경·UI 를 뒤에서 받기 시작한다
  const startPreload = useCallback(() => preloadAll(PRELOAD_BGS, UI_IMAGES), []);

  const activate = useCallback(() => {
    if (leaving || confirming) return;
    if (!entered) return skipIntro();
    onStart(hasSave ? 'continue' : 'new');
  }, [leaving, confirming, entered, hasSave, onStart, skipIntro]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && confirming) {
        setConfirming(false);
        return;
      }
      if (!entered) {
        skipIntro();
        return;
      }
      // 버튼에 포커스가 있으면 Enter 는 그 버튼이 처리한다 (두 번 시작하지 않게)
      const onButton = e.target instanceof HTMLElement && e.target.closest('button');
      if (e.key === 'Enter' && !onButton && !e.repeat) activate();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [entered, confirming, activate, skipIntro]);

  // 세로 화면에서는 제목을 두 줄로 끊는다 (어절 수로 반씩: "12분 먼저 / 도착한 자백")
  const titleWords = TITLE_COPY.title.split(' ');
  const half = Math.ceil(titleWords.length / 2);
  const titleFirst = titleWords.slice(0, half).join(' ');
  const titleRest = titleWords.slice(half);

  return (
    <main
      className={cx('title-screen', entered && 'is-entered', skipped && 'is-skipped')}
      onClick={activate}
    >
      <div className="scene-layer">
        <SceneBackground id={TITLE_BG} onReady={startPreload} />
      </div>
      <div className="title-scrim" aria-hidden="true" />

      <div className="title-ui">
        <p className="title-logline" data-step style={{ '--step': 1 }}>
          {TITLE_COPY.logline}
        </p>

        <div className="title-bottom">
          <h1 className="title-name" data-step style={{ '--step': 2 }}>
            {titleFirst} <span>{titleRest.join(' ')}</span>
          </h1>

          <p className="title-plate" data-step style={{ '--step': 3 }}>
            <span className="plate-face">{TITLE_COPY.subtitle}</span>
          </p>
          <p className="title-info" data-step style={{ '--step': 3 }}>
            {TITLE_COPY.info}
          </p>

          <div className="title-controls" data-step style={{ '--step': 4 }}>
            <TitleActions
              hasSave={hasSave}
              confirming={confirming}
              onConfirmingChange={setConfirming}
              onStart={(mode) => !leaving && onStart(mode)}
            />
            <PreloadBar />
          </div>

          <p className="title-hint" data-step style={{ '--step': 4 }}>
            {TITLE_COPY.hint}
          </p>
        </div>
      </div>
    </main>
  );
}
