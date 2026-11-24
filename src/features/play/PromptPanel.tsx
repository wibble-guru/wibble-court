import type { AnswerInput } from '@/engine/engine';
import type { Prompt } from '@/engine/types';
import { Emphasis } from './Typewriter';
import { usePromptInput } from './usePromptInput';

type Props = {
  prompt: Prompt;
  /** 확정 버튼 글자 (대본에 없는 문구 — PlayScreen 의 UI_COPY) */
  confirmLabel: string;
  onSubmit: (input: AnswerInput) => void;
};

/**
 * 질문의 선택지·슬라이더 (UI 키트의 마름모 막대, 금색 슬라이더).
 * 선택 하나뿐인 질문은 누르는 즉시 기록, 슬라이더가 섞이면 모두 채운 뒤 확정 버튼.
 * 질문 제목·메모는 대화창 쪽에 있다 (PlayScreen).
 */
export function PromptPanel({ prompt, confirmLabel, onSubmit }: Props) {
  const { input, set, ready, immediate: single, submit } = usePromptInput(prompt, onSubmit);

  return (
    <div className="choices" role="group" aria-labelledby="prompt-title">
      {prompt.fields.map((field) =>
        field.kind === 'choice' ? (
          <fieldset key={field.target} className="choice-field">
            {field.label && <legend>{field.label}</legend>}
            {field.options.map((option) => {
              const value = option.value ?? option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className="choice"
                  aria-pressed={single ? undefined : input[field.target] === value}
                  onClick={() => set(field, value)}
                >
                  <span className="choice-face">
                    <Emphasis text={option.label} />
                  </span>
                </button>
              );
            })}
          </fieldset>
        ) : (
          <label key={field.target} className="choice-field slider">
            {field.label && <span className="slider-label">{field.label}</span>}
            <span className="slider-row">
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

      {!single && (
        <button type="button" className="choice is-confirm" disabled={!ready} onClick={submit}>
          <span className="choice-face">{confirmLabel}</span>
        </button>
      )}
    </div>
  );
}
