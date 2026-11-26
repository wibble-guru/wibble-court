import { promptTitle } from '@/data/prompt-title';
import type { Ref } from 'preact';
import type { AnswerInput } from '@/engine/engine';
import type { Prompt } from '@/engine/types';
import { Emphasis } from '@/features/play/Typewriter';
import { usePromptInput } from '@/features/play/usePromptInput';
import { needsConfirm } from './thought';
import './thought.css';

type Props = {
  prompt: Prompt;
  /** 확정 버튼 글자 (대본에 없는 문구 — PlayScreen 의 UI_COPY) */
  confirmLabel: string;
  onSubmit: (input: AnswerInput) => void;
  titleRef?: Ref<HTMLHeadingElement>;
};

/**
 * 생각 기록 화면: 재판장 책상의 기록장(L-08) 위에 놓인 종이 한 장.
 * 법정 UI(숯색·금 테두리)와 반대로 밝은 종이·먹 글자 — 검사·변호인에게 보이지 않는 내 기록.
 * 고르면 빈 동그라미를 먹으로 채운다. 정답 표시·점수 힌트 없음.
 * 판결(Q10-1)은 두 칸을 같은 모양으로 두고, 고르면 대본의 판결 대사를 보인 뒤 [기록하기]로 확정.
 */
export function ThoughtRecord({ prompt, confirmLabel, onSubmit, titleRef }: Props) {
  const verdict = needsConfirm(prompt);
  const { input, set, ready, immediate, submit } = usePromptInput(prompt, onSubmit, verdict);
  const verdictLine = verdict
    ? prompt.fields
        .flatMap((f) => (f.kind === 'choice' ? f.options : []))
        .find((o) => (o.value ?? o.key) === input.verdict)?.judgeLine
    : undefined;

  return (
    <section className="sheet" aria-labelledby="prompt-title">
      <h2 id="prompt-title" ref={titleRef} tabIndex={-1} className="sheet-title">
        <Emphasis text={promptTitle(prompt)} />
      </h2>
      {prompt.memo && (
        <p className="sheet-memo">
          <Emphasis text={prompt.memo} />
        </p>
      )}

      <div className="sheet-body">
        {prompt.fields.map((field) =>
          field.kind === 'choice' ? (
            <fieldset
              key={field.target}
              className={verdict ? 'sheet-field is-verdict' : 'sheet-field'}
            >
              {field.label && <legend>{field.label}</legend>}
              {field.options.map((option) => {
                const value = option.value ?? option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className="mark"
                    aria-pressed={immediate ? undefined : input[field.target] === value}
                    onClick={() => set(field, value)}
                  >
                    <Emphasis text={option.label} />
                  </button>
                );
              })}
            </fieldset>
          ) : (
            <label key={field.target} className="sheet-field sheet-slider">
              {field.label && <span className="sheet-label">{field.label}</span>}
              <span className="sheet-slider-row">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Number(input[field.target])}
                  style={{ '--v': Number(input[field.target]) }}
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

        {verdictLine && (
          <p className="sheet-verdict-line" aria-live="polite">
            {verdictLine}
          </p>
        )}
      </div>

      {!immediate && (
        <button type="button" className="sheet-confirm" disabled={!ready} onClick={submit}>
          {confirmLabel}
        </button>
      )}
    </section>
  );
}
