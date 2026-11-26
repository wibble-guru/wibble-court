import { promptTitle } from '@/data/prompt-title';
import { useState } from 'preact/hooks';
import type * as ResultCopyModule from '@/data/result-copy';
import { SCENES } from '@/data/scenes';
import { supportingChoices, type Analysis } from '@/engine/score';
import type { Answers, Judgment, Prompt } from '@/engine/types';
import { Emphasis } from '@/features/play/Typewriter';

type Props = {
  analysis: Analysis;
  answers: Partial<Answers>;
  judgment: Partial<Judgment>;
  copy: typeof ResultCopyModule;
};

const prompts: Prompt[] = Object.values(SCENES).flatMap((scene) => scene?.prompts ?? []);

/** 데이터의 질문 제목과 고른 선택지 문장 (대본 그대로) */
function choiceOf(target: string, value: string | undefined) {
  for (const prompt of prompts) {
    for (const field of prompt.fields) {
      if (field.kind !== 'choice' || field.target !== target) continue;
      const option = field.options.find((o) => (o.value ?? o.key) === value);
      return { title: promptTitle(prompt), label: option?.label ?? '' };
    }
  }
  return null;
}

/**
 * "내 선택이 어떻게 반영됐나요?" (RESULT 추가 보기, 5.3 하단 접이식). 누를 때만 펼친다.
 * 근거는 주 성향에 점수를 준 실제 선택 2~4개 (사용자 결정: 질문 제목 — 고른 선택지).
 * 확신도와 판결은 여기서만 보인다 (5.2: 후일담·접이식 근거에서만).
 */
export function ResultDetails({ analysis, answers, judgment, copy }: Props) {
  const [open, setOpen] = useState(false);
  const { AXIS_LABEL, DETAILS_COPY } = copy;
  const ready = analysis.status === 'READY';
  const axes = ready
    ? analysis.blended
      ? [analysis.primary, analysis.secondary]
      : [analysis.primary]
    : [];
  const picks = ready ? supportingChoices(answers, axes) : [];

  const q0 = prompts.find((p) => p.id === 'Q0');
  const q10_2 = prompts.find((p) => p.id === 'Q10-2');
  const verdict = choiceOf('verdict', judgment.verdict);

  return (
    <section className="result-details">
      <button
        type="button"
        className="result-toggle"
        aria-expanded={open}
        aria-controls="result-details-body"
        onClick={() => setOpen((v) => !v)}
      >
        {DETAILS_COPY.toggle}
      </button>

      {open && (
        <div id="result-details-body" className="result-details-body">
          <h2>{DETAILS_COPY.title}</h2>
          {axes.map((a) => (
            <p key={a} className="result-axes">
              {AXIS_LABEL[a]}
            </p>
          ))}

          {picks.length > 0 && (
            <ul className="result-picks">
              {picks.map((pick) => {
                const choice = choiceOf(pick.key, pick.value);
                return (
                  choice && (
                    <li key={pick.key}>
                      <span>{choice.title}</span>
                      {/* 한 요소로 감싼다 — li 가 grid 라 글자 조각과 강조가 따로 칸이 되지 않게 */}
                      <p>
                        <Emphasis text={choice.label} />
                      </p>
                    </li>
                  )
                );
              })}
            </ul>
          )}

          <dl className="result-facts">
            {q0 && judgment.confidence_start !== undefined && (
              <>
                <dt>{promptTitle(q0)}</dt>
                <dd>{judgment.confidence_start}</dd>
              </>
            )}
            {q10_2 && judgment.confidence_final !== undefined && (
              <>
                <dt>{promptTitle(q10_2)}</dt>
                <dd>{judgment.confidence_final}</dd>
              </>
            )}
            {verdict && verdict.label && (
              <>
                <dt>{verdict.title}</dt>
                <dd>{verdict.label}</dd>
              </>
            )}
          </dl>

          <p className="result-note">{DETAILS_COPY.note}</p>
        </div>
      )}
    </section>
  );
}
