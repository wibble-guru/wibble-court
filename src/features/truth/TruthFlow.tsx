import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Backdrop } from '@/components/Backdrop';
import { KIT_VARS, type BgId } from '@/data/assets';
import { portraitOf, portraitSrc } from '@/data/characters';
import type * as TruthModule from '@/data/truth/truth';
import type { StoryState } from '@/engine/types';
import { EvidenceInsert } from '@/features/evidence/EvidenceInsert';
import { DialogueBox } from '@/features/play/DialogueBox';
import { Typewriter } from '@/features/play/Typewriter';
import { preloadImage } from '@/lib/preload';
import './truth.css';

export type Truth = typeof TruthModule;

/** 진실 공개 청크 — 결과·에필로그를 다 본 뒤에만 부른다 (import() 만 허용, ESLint) */
let truthPromise: Promise<Truth> | null = null;
export function loadTruth(): Promise<Truth> {
  truthPromise ??= import('@/data/truth/truth');
  return truthPromise;
}

/** 결과 이후 진실 공개를 열어도 되는가 (11.1 unlock_condition) */
export function truthUnlocked(story: StoryState): boolean {
  return story.flags.result_completed && story.flags.epilogue_completed;
}

type Props = {
  truth: Truth;
  story: StoryState;
  /** TRUTH-01 부터 바로 (결과 화면의 "진실 보기") */
  skipGate?: boolean;
  /** 대본에 없는 보조기기용 문구 (PlayScreen 과 같은 "다음 대사") */
  nextLabel: string;
  /** TRUTH-GATE B "결과만 보관하고 종료하기" */
  onSkip: () => void;
  /** TRUTH-END "내 사고 성향 결과 다시 보기" — 이미 계산한 결과, 재계산 없음 */
  onResult: () => void;
  /** TRUTH-END "처음부터 재판하기" */
  onRestart: () => void;
};

/**
 * 진실 공개 (대본 10부). TRUTH-GATE → TRUTH-01 ~ 05 → TRUTH-END.
 * 대사는 본편 대화창으로, 연출 줄은 띄우지 않는다. TRUTH-END 의 후일담은 판결에 맞는 것만.
 * 정답·오답 표시 없음, 점수·판결·확신도는 바꾸지 않는다 (11.1).
 */
export function TruthFlow({
  truth,
  story,
  skipGate,
  nextLabel,
  onSkip,
  onResult,
  onRestart,
}: Props) {
  const scenes = truth.TRUTH_SCENES;
  const [sceneIndex, setSceneIndex] = useState(skipGate ? 1 : 0);
  const [lineIndex, setLineIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const scene = scenes[sceneIndex];
  const lines = scene.lines.filter(
    (l) => l.kind !== 'direction' && (!l.when || l.when === story.judgment.verdict),
  );
  const line = lines[lineIndex];
  const atButtons = !line;
  const isGate = scene.id === 'TRUTH-GATE';
  const isEnd = sceneIndex === scenes.length - 1;

  // 진실 공개에서 쓰는 포즈 그림을 처음에 한 번 미리 받는다 (11장 안팎)
  useEffect(() => {
    for (const s of scenes)
      for (const l of s.lines) {
        const p = l.pose ? portraitOf(l.speaker) : null;
        if (p) void preloadImage(portraitSrc(p.id, l.pose));
      }
  }, [scenes]);

  const reveal = useCallback(() => setRevealed(true), []);
  const press = useCallback(() => {
    if (!line) return;
    if (!revealed) return setRevealed(true);
    setRevealed(false);
    if (lineIndex + 1 < lines.length) return setLineIndex(lineIndex + 1);
    // 장면 끝: GATE·END 는 버튼, 그 사이는 다음 봉투
    if (isGate || isEnd) return setLineIndex(lineIndex + 1);
    setSceneIndex(sceneIndex + 1);
    setLineIndex(0);
  }, [line, revealed, lineIndex, lines.length, isGate, isEnd, sceneIndex]);

  useEffect(() => {
    if (atButtons) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target instanceof HTMLElement && e.target.closest('button')) return;
      e.preventDefault();
      if (!e.repeat) press();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [atButtons, press]);

  const panelRef = useRef<HTMLButtonElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (atButtons ? firstButtonRef.current : panelRef.current)?.focus({ preventScroll: true });
  }, [atButtons, sceneIndex]);

  const B = truth.TRUTH_BUTTONS;
  return (
    <main className="play-screen truth-screen" style={KIT_VARS}>
      {/* 진실 공개 전용 배경 이름은 이 청크의 데이터에만 있다 (본편 BgId 에서 뺐음) */}
      <Backdrop bg={scene.bg as BgId} effect={scene.effect} />
      {scene.insert && !atButtons && <EvidenceInsert key={scene.id} insert={scene.insert} />}

      <div className="play-stage" data-mode="line">
        {line && (
          <DialogueBox
            speaker={line.speaker || undefined}
            pose={line.pose}
            showNext={revealed}
            onPress={press}
            pressLabel={nextLabel}
            panelRef={panelRef}
          >
            <span className="dialogue-text">
              <Typewriter
                key={`${scene.id}:${lineIndex}`}
                text={line.text}
                done={revealed}
                onDone={reveal}
              />
            </span>
          </DialogueBox>
        )}

        {atButtons && (
          <div className="truth-actions">
            {isGate ? (
              <>
                <button
                  ref={firstButtonRef}
                  type="button"
                  className="truth-button"
                  onClick={() => {
                    setSceneIndex(1);
                    setLineIndex(0);
                  }}
                >
                  {B.open}
                </button>
                <button type="button" className="truth-button is-quiet" onClick={onSkip}>
                  {B.skip}
                </button>
              </>
            ) : (
              <>
                <button
                  ref={firstButtonRef}
                  type="button"
                  className="truth-button"
                  onClick={onResult}
                >
                  {B.again}
                </button>
                <button type="button" className="truth-button is-quiet" onClick={onRestart}>
                  {B.restart}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
