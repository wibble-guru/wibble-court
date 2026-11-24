import { useState } from 'preact/hooks';
import type { AnswerInput } from '@/engine/engine';
import type { Field, Prompt } from '@/engine/types';
import { isSingleChoice } from './runner';

/**
 * 질문 하나의 입력 상태 (법정 선택지·기록장 화면이 같이 쓴다).
 * - 선택 하나뿐인 질문은 고르는 즉시 기록 (confirmFirst 면 예외 — 판결)
 * - 그 밖에는 모든 항목을 채운 뒤 submit. 슬라이더는 처음부터 initial 값으로 채워져 있다
 */
export function usePromptInput(
  prompt: Prompt,
  onSubmit: (input: AnswerInput) => void,
  confirmFirst = false,
) {
  const immediate = isSingleChoice(prompt) && !confirmFirst;
  const [input, setInput] = useState<AnswerInput>(() =>
    Object.fromEntries(
      prompt.fields.filter((f) => f.kind === 'slider').map((f) => [f.target, f.initial]),
    ),
  );
  const ready = prompt.fields.every((f) => input[f.target] !== undefined);

  function set(field: Field, value: string | number) {
    if (immediate) return onSubmit({ [field.target]: value });
    setInput((prev) => ({ ...prev, [field.target]: value }));
  }

  return { input, set, ready, immediate, submit: () => ready && onSubmit(input) };
}
