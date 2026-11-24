import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { SceneBackground } from '@/components/SceneBackground';
import { FIRST_SCENE_BG } from '@/data/assets';
import { useStory } from '@/store/story';
import { DialogueBox } from './DialogueBox';
import { PromptPanel } from './PromptPanel';
import { advance, currentPrompt, submit, visibleLines, type Play } from './runner';
import { Emphasis, Typewriter } from './Typewriter';
import './play.css';

type Props = {
  /** 처음부터면 startPlay(), 이어서면 저장된 진행 */
  start: Play;
  /** 엔딩 대사가 끝났을 때 (RESULT 는 5단계 — 지금은 타이틀로) */
  onEnd: () => void;
};

/** 대본에 없는 화면 문구. 한곳에 모은다 (보조기기용 대화창 이름, 확정 버튼) */
const UI_COPY = { nextLine: '다음 대사', confirm: '기록하기' };

/**
 * 플레이 화면 (P00 ~ 엔딩). 진행은 runner 가, 이 화면은 배치와 입력만.
 * - 대사 단계: 대화창(이름표 + 타자 효과). 누르면 다 안 나왔으면 전부 표시, 다 나왔으면 다음 대사
 * - 질문 단계: 대화창에 질문 제목·메모, 선택지는 PC 오른쪽 열·모바일 세로 대화창 위
 * 바뀔 때마다 이어하기용으로 저장하고, 끝나면 저장을 지운다.
 */
export function PlayScreen({ start, onEnd }: Props) {
  const saveStory = useStory((s) => s.saveStory);
  const clearStory = useStory((s) => s.clearStory);
  const [play, setPlay] = useState(start);
  const { cursor } = play;
  const lineKey = cursor.at === 'line' ? `${cursor.sceneId}:${cursor.index}` : '';
  /** 끝까지 나타난 대사의 key (타자 효과가 끝났거나 눌러서 건너뜀) */
  const [revealed, setRevealed] = useState('');
  const done = lineKey !== '' && revealed === lineKey;

  useEffect(() => {
    if (cursor.at === 'end') {
      clearStory();
      onEnd();
    } else {
      saveStory(play);
    }
  }, [play, cursor.at, saveStory, clearStory, onEnd]);

  const press = useCallback(() => {
    if (!lineKey) return;
    if (revealed === lineKey) setPlay(advance);
    else setRevealed(lineKey);
  }, [lineKey, revealed]);

  const reveal = useCallback(() => setRevealed(lineKey), [lineKey]);

  // Enter·Space = 대화창 누름 (버튼·입력에 포커스가 있으면 그쪽이 처리)
  useEffect(() => {
    if (!lineKey) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target instanceof HTMLElement && e.target.closest('button, input')) return;
      e.preventDefault();
      if (!e.repeat) press();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lineKey, press]);

  // 대사 단계에선 대화창에, 질문 단계에선 질문 제목에 포커스 (키보드·스크린리더가 길을 잃지 않게)
  const panelRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const prompt = currentPrompt(play);
  useEffect(() => {
    (lineKey ? panelRef.current : titleRef.current)?.focus({ preventScroll: true });
  }, [lineKey, prompt]);

  const line = cursor.at === 'line' ? visibleLines(cursor.sceneId, play.story)[cursor.index] : null;

  return (
    <main className="play-screen">
      <div className="scene-layer">
        <SceneBackground id={FIRST_SCENE_BG} />
      </div>

      <div className="play-stage" data-mode={line ? 'line' : 'prompt'}>
        {line && (
          <DialogueBox
            speaker={line.speaker}
            showNext={done}
            onPress={press}
            pressLabel={UI_COPY.nextLine}
            panelRef={panelRef}
          >
            <span className="dialogue-text">
              <Typewriter key={lineKey} text={line.text} done={done} onDone={reveal} />
            </span>
          </DialogueBox>
        )}

        {prompt && cursor.at === 'prompt' && (
          <>
            <DialogueBox key={`${cursor.sceneId}:${prompt.id}`}>
              <h2 id="prompt-title" ref={titleRef} tabIndex={-1} className="prompt-title">
                <Emphasis text={prompt.title} />
              </h2>
              {prompt.memo && (
                <p className="prompt-memo">
                  <Emphasis text={prompt.memo} />
                </p>
              )}
            </DialogueBox>
            <PromptPanel
              key={`${cursor.sceneId}:${prompt.id}`}
              prompt={prompt}
              confirmLabel={UI_COPY.confirm}
              onSubmit={(input) => setPlay((p) => submit(p, input).play)}
            />
          </>
        )}
      </div>
    </main>
  );
}
