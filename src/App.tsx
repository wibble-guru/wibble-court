import { useCallback, useRef, useState } from 'preact/hooks';
import { FIRST_SCENE_BG } from '@/data/assets';
import { analyze, resultId } from '@/engine/score';
import type { StoryState } from '@/engine/types';
import { PlayScreen } from '@/features/play/PlayScreen';
import { loadResultCopy, ResultScreen } from '@/features/result/ResultScreen';
import { backdropOf, resumePlay, startPlay, type Play } from '@/features/play/runner';
import type { StartMode } from '@/features/title/TitleActions';
import { TitleScreen } from '@/features/title/TitleScreen';
import { cx } from '@/lib/cx';
import { delay, prefersReducedMotion } from '@/lib/motion';
import { preloadBackground } from '@/lib/preload';
import { useStory } from '@/store/story';
import { game } from '@/wibble';

/** 암전 시간 (index.css 의 .curtain transition 과 같게) */
const CURTAIN_MS = 600;
/** 시작 장면 배경을 이보다 오래 기다리지는 않는다 (네트워크가 멈춰도 암전에 갇히지 않게) */
const FIRST_SCENE_WAIT_MS = 8000;

type Screen =
  { kind: 'title' } | { kind: 'play'; start: Play } | { kind: 'result'; story: StoryState };

/** 대본에 없는 버튼 문구 (사용자 승인) */
const COPY = { next: '다음' };

/**
 * 화면 전환만 맡는다: 타이틀 → 플레이 → 엔딩 → 결과(RESULT) → 에필로그 → 결과 전송 → (단독 실행이면) 타이틀.
 * 결과 전송은 마지막에 한 번 (사용자 결정): 사이트 안이면 sendResult 하자마자 사이트가 결과 페이지로 이동하므로,
 * 게임 안 결과·에필로그(6단계부터는 진실 공개 선택까지)를 다 보여 준 뒤에 보낸다.
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
    // 결과 화면에서 닫았으면 결과 화면부터
    if (mode === 'continue' && save?.cursor.at === 'end' && save.cursor.next === 'RESULT') {
      void transition({ kind: 'result', story: save.story }, loadResultCopy());
      return;
    }
    const resumed = mode === 'continue' && save ? resumePlay(save) : null;
    if (!resumed) clearStory();
    const play = resumed ?? startPlay();
    // 시작(또는 이어 할) 장면의 배경을 기다린다 (미리 받기가 끝났으면 바로)
    const bg = backdropOf(play)?.bg ?? FIRST_SCENE_BG;
    const background = Promise.race([preloadBackground(bg), delay(FIRST_SCENE_WAIT_MS)]);
    void transition({ kind: 'play', start: play }, background);
  }

  /** 결과 전송 (마지막에 한 번). 사이트면 사이트가 이동하고, 단독 실행이면 타이틀로 */
  const finish = useCallback(
    async (story: StoryState) => {
      const { resultContent } = await loadResultCopy();
      const analysis = analyze(story.answers);
      const sent = game.sendResult(resultId(analysis), resultContent(analysis));
      useStory.getState().clearStory();
      if (!sent) void transition({ kind: 'title' });
    },
    [transition],
  );

  const end = useCallback(
    (play: Play) => {
      if (play.cursor.at !== 'end') return;
      if (play.cursor.next === 'RESULT') {
        void transition({ kind: 'result', story: play.story }, loadResultCopy());
      } else {
        void finish(play.story); // 에필로그 뒤 (6단계 전까지는 여기서 끝)
      }
    },
    [transition, finish],
  );

  function toEpilogue(story: StoryState) {
    const play = resumePlay({ cursor: { sceneId: 'EPILOGUE', at: 'line', index: 0 }, story });
    if (play) void transition({ kind: 'play', start: play });
  }

  return (
    <>
      {screen.kind === 'title' && <TitleScreen onStart={start} leaving={curtain} />}
      {screen.kind === 'play' && <PlayScreen start={screen.start} onEnd={end} />}
      {screen.kind === 'result' && (
        <ResultScreen
          analysis={analyze(screen.story.answers)}
          answers={screen.story.answers}
          judgment={screen.story.judgment}
          nextLabel={COPY.next}
          onNext={() => toEpilogue(screen.story)}
        />
      )}
      <div className={cx('curtain', curtain && 'is-on')} aria-hidden="true" />
    </>
  );
}
