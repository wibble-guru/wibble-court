import { useCallback, useRef, useState } from 'preact/hooks';
import { FIRST_SCENE_BG } from '@/data/assets';
import { analyze, resultId } from '@/engine/score';
import type { StoryState } from '@/engine/types';
import { PlayScreen } from '@/features/play/PlayScreen';
import { loadResultCopy, ResultScreen } from '@/features/result/ResultScreen';
import { loadTruth, truthUnlocked, type Truth } from '@/features/truth/load';
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

type Action = { label: string; onClick: () => void };
type Screen =
  | { kind: 'title' }
  | { kind: 'play'; start: Play }
  /** after = 진실 공개 선택 이후(단독 실행)에 다시 보는 결과. 재계산 없음 */
  | { kind: 'result'; story: StoryState; after?: { truth: Truth; truthSeen: boolean } }
  | { kind: 'truth'; story: StoryState; truth: Truth; skipGate?: boolean };

/** 대본에 없는 문구 (사용자 승인): 결과 화면 다음 버튼, 보조기기용 "다음 대사" */
const COPY = { next: '다음', nextLine: '다음 대사' };

/** 장면을 끝낸 상태 저장 (이어하기) */
function saveEnd(next: 'RESULT' | 'TRUTH-GATE', story: StoryState) {
  useStory.getState().saveStory({ cursor: { at: 'end', next }, story });
}

/**
 * 화면 전환만 맡는다: 타이틀 → 플레이 → 엔딩 → 결과(RESULT) → 에필로그 → 진실 공개 선택(TRUTH-GATE)
 *   → (A) TRUTH-01 ~ TRUTH-END → "결과 다시 보기" / "처음부터 재판하기"   (B) "결과만 보관하고 종료하기"
 * 결과 전송은 마지막에 한 번 (사용자 결정): 사이트 안이면 sendResult 하자마자 사이트가 결과 페이지로 이동하므로,
 * 진실 공개 선택 뒤 이야기를 떠나는 버튼(B, 결과 다시 보기, 처음부터)에서 보낸다.
 * 단독 실행이면 결과 화면으로 돌아오고, 진실을 안 봤으면 "진실 보기"가 남는다 (대본 TRUTH-GATE B).
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
    if (mode === 'continue' && save?.cursor.at === 'end') {
      // 결과 화면 / 진실 공개 선택에서 닫았으면 거기부터
      if (save.cursor.next === 'RESULT') {
        void transition({ kind: 'result', story: save.story }, loadResultCopy());
        return;
      }
      if (save.cursor.next === 'TRUTH-GATE' && truthUnlocked(save.story)) {
        void openTruth(save.story);
        return;
      }
    }
    const resumed = mode === 'continue' && save ? resumePlay(save) : null;
    if (!resumed) clearStory();
    const play = resumed ?? startPlay();
    // 시작(또는 이어 할) 장면의 배경을 기다린다 (미리 받기가 끝났으면 바로)
    const bg = backdropOf(play)?.bg ?? FIRST_SCENE_BG;
    const background = Promise.race([preloadBackground(bg), delay(FIRST_SCENE_WAIT_MS)]);
    void transition({ kind: 'play', start: play }, background);
  }

  /** 진실 공개 청크를 받아 TRUTH-GATE (또는 결과 화면의 진실 보기면 TRUTH-01) 로. 결과 미완료면 결과 화면으로 (11.2) */
  const openTruth = useCallback(
    async (story: StoryState, skipGate = false) => {
      if (!truthUnlocked(story)) {
        void transition({ kind: 'result', story }, loadResultCopy());
        return;
      }
      const truth = await loadTruth();
      void transition({ kind: 'truth', story, truth, skipGate });
    },
    [transition],
  );

  /**
   * 결과 전송 (진실 공개 선택 뒤, 이야기를 떠날 때). 사이트면 사이트가 이동한다.
   * 단독 실행이면 처음부터는 타이틀, 그 밖에는 결과 화면(진실을 안 봤으면 진실 보기 버튼)으로.
   */
  const finish = useCallback(
    async (story: StoryState, then: 'result' | 'title', truthSeen: boolean) => {
      const [{ resultContent }, truth] = await Promise.all([loadResultCopy(), loadTruth()]);
      const analysis = analyze(story.answers);
      const sent = game.sendResult(resultId(analysis), resultContent(analysis));
      useStory.getState().clearStory();
      if (sent) return;
      void transition(
        then === 'title'
          ? { kind: 'title' }
          : { kind: 'result', story, after: { truth, truthSeen } },
      );
    },
    [transition],
  );

  const end = useCallback(
    (play: Play) => {
      if (play.cursor.at !== 'end') return;
      if (play.cursor.next === 'RESULT') {
        const story = { ...play.story, flags: { ...play.story.flags, result_completed: true } };
        saveEnd('RESULT', story);
        void transition({ kind: 'result', story }, loadResultCopy());
      } else {
        // 에필로그 끝 → 진실 공개 선택 (TRUTH-GATE)
        const story = { ...play.story, flags: { ...play.story.flags, epilogue_completed: true } };
        saveEnd('TRUTH-GATE', story);
        void openTruth(story);
      }
    },
    [transition, openTruth],
  );

  function toEpilogue(story: StoryState) {
    const play = resumePlay({ cursor: { sceneId: 'EPILOGUE', at: 'line', index: 0 }, story });
    if (play) void transition({ kind: 'play', start: play });
  }

  function resultActions(screen: Extract<Screen, { kind: 'result' }>): Action[] {
    const { story, after } = screen;
    if (!after) return [{ label: COPY.next, onClick: () => toEpilogue(story) }];
    const B = after.truth.TRUTH_BUTTONS;
    return [
      ...(after.truthSeen ? [] : [{ label: B.view, onClick: () => void openTruth(story, true) }]),
      { label: B.restart, onClick: () => void transition({ kind: 'title' }) },
    ];
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
          actions={resultActions(screen)}
        />
      )}
      {screen.kind === 'truth' && (
        <screen.truth.TruthFlow
          truth={screen.truth}
          story={screen.story}
          skipGate={screen.skipGate}
          nextLabel={COPY.nextLine}
          onSkip={() => void finish(screen.story, 'result', false)}
          onResult={() => void finish(screen.story, 'result', true)}
          onRestart={() => void finish(screen.story, 'title', true)}
        />
      )}
      <div className={cx('curtain', curtain && 'is-on')} aria-hidden="true" />
    </>
  );
}
