import { useEffect, useRef, useState } from 'preact/hooks';
import { SceneBackground } from '@/components/SceneBackground';
import { FIRST_SCENE_BG } from '@/data/assets';
import type { AnswerInput } from '@/engine/engine';
import type { Field, Prompt } from '@/engine/types';
import { useStory } from '@/store/story';
import { advance, currentPrompt, isSingleChoice, submit, visibleLines, type Play } from './runner';

type Props = {
  /** 처음부터면 startPlay(), 이어서면 저장된 진행 */
  start: Play;
  /** 엔딩 대사가 끝났을 때 (RESULT 는 5단계 — 지금은 타이틀로) */
  onEnd: () => void;
};

/** 대본·질문 화면에 보이지 않는 글자 (보조기기용·확정 버튼). 대본에 없는 문구라 한곳에 모은다 */
const UI_COPY = { nextLine: '다음 대사', confirm: '기록하기' };

/**
 * 플레이 화면 (P00 ~ 엔딩). 진행은 runner 가 정하고, 이 화면은 지금 대사 또는 지금 질문을 보여 준다.
 * 바뀔 때마다 이어하기용으로 저장하고, 끝나면 저장을 지운다.
 * 모양은 임시 — UI 키트 대화창·발언자 색·타자 효과는 3a-2 에서.
 */
export function PlayScreen({ start, onEnd }: Props) {
  const saveStory = useStory((s) => s.saveStory);
  const clearStory = useStory((s) => s.clearStory);
  const [play, setPlay] = useState(start);
  const { cursor } = play;

  useEffect(() => {
    if (cursor.at === 'end') {
      clearStory();
      onEnd();
    } else {
      saveStory(play);
    }
  }, [play, cursor.at, saveStory, clearStory, onEnd]);

  // Enter·Space = 다음 대사 (버튼에 포커스가 있으면 버튼이 처리)
  useEffect(() => {
    if (cursor.at !== 'line') return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target instanceof HTMLElement && e.target.closest('button, input')) return;
      e.preventDefault();
      if (!e.repeat) setPlay(advance);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cursor.at]);

  const prompt = currentPrompt(play);

  return (
    <main className="play-screen">
      <div className="scene-layer">
        <SceneBackground id={FIRST_SCENE_BG} />
      </div>

      <div className="stage">
        {cursor.at === 'line' && (
          <LineView
            key={`${cursor.sceneId}:${cursor.index}`}
            line={visibleLines(cursor.sceneId, play.story)[cursor.index]}
            onNext={() => setPlay(advance)}
          />
        )}
        {cursor.at === 'prompt' && prompt && (
          <PromptView
            key={`${cursor.sceneId}:${prompt.id}`}
            prompt={prompt}
            onSubmit={(input) => setPlay((p) => submit(p, input).play)}
          />
        )}
      </div>
    </main>
  );
}

function LineView({
  line,
  onNext,
}: {
  line: { speaker: string; text: string };
  onNext: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return (
    <button ref={ref} type="button" className="play-line" onClick={onNext}>
      <span className="play-speaker">{line.speaker}</span>
      <span className="play-text">
        <Emphasis text={line.text} />
      </span>
      <span className="sr-only">{UI_COPY.nextLine}</span>
    </button>
  );
}

function PromptView({
  prompt,
  onSubmit,
}: {
  prompt: Prompt;
  onSubmit: (input: AnswerInput) => void;
}) {
  const single = isSingleChoice(prompt);
  const [input, setInput] = useState<AnswerInput>(() =>
    Object.fromEntries(
      prompt.fields.filter((f) => f.kind === 'slider').map((f) => [f.target, f.initial]),
    ),
  );
  const ready = prompt.fields.every((f) => input[f.target] !== undefined);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);

  function set(field: Field, value: string | number) {
    if (single) return onSubmit({ [field.target]: value });
    setInput((prev) => ({ ...prev, [field.target]: value }));
  }

  return (
    <section className="play-prompt" aria-labelledby="play-prompt-title">
      <h2 id="play-prompt-title" ref={headingRef} tabIndex={-1}>
        {prompt.title}
      </h2>
      {prompt.memo && (
        <p className="play-memo">
          <Emphasis text={prompt.memo} />
        </p>
      )}

      {prompt.fields.map((field) =>
        field.kind === 'choice' ? (
          <fieldset key={field.target} className="play-field">
            {field.label && <legend>{field.label}</legend>}
            <div className="play-options">
              {field.options.map((option) => {
                const value = option.value ?? option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={single ? undefined : input[field.target] === value}
                    onClick={() => set(field, value)}
                  >
                    <Emphasis text={option.label} />
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <label key={field.target} className="play-field play-slider">
            {field.label && <span>{field.label}</span>}
            <span className="play-slider-row">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Number(input[field.target])}
                onInput={(e) => set(field, Number(e.currentTarget.value))}
              />
              <output>{input[field.target]}</output>
            </span>
            {field.hint && (
              <small>
                <Emphasis text={field.hint} />
              </small>
            )}
          </label>
        ),
      )}

      {!single && (
        <button
          type="button"
          className="play-confirm"
          disabled={!ready}
          onClick={() => onSubmit(input)}
        >
          {UI_COPY.confirm}
        </button>
      )}
    </section>
  );
}

/** 대본의 `**강조**` 를 굵게 */
function Emphasis({ text }: { text: string }) {
  return (
    <>{text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}</>
  );
}
