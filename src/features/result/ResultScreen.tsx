import { useEffect, useRef, useState } from 'preact/hooks';
import type * as ResultCopyModule from '@/data/result-copy';
import { FINAL_REASON_AXIS, type Analysis } from '@/engine/score';
import type { Answers, Judgment } from '@/engine/types';
import { SCENES } from '@/data/scenes';
import { Emphasis } from '@/features/play/Typewriter';
import { ResultDetails } from './ResultDetails';
import './result.css';

type Copy = typeof ResultCopyModule;

/** 결과 문구 청크 (J100 에서 미리 받기 시작 — loadResultCopy) */
let copyPromise: Promise<Copy> | null = null;
export function loadResultCopy(): Promise<Copy> {
  copyPromise ??= import('@/data/result-copy');
  return copyPromise;
}

type Props = {
  analysis: Analysis;
  answers: Partial<Answers>;
  judgment: Partial<Judgment>;
  /** 아래 버튼들: 처음엔 [다음](에필로그), 진실 공개 선택 뒤엔 [진실 보기] [처음부터 재판하기] */
  actions: { label: string; onClick: () => void }[];
};

/**
 * RESULT (대본 5부). 법정 배경이 사라진 자리에 질문 → 내레이션 → 결과 카드(5.7 템플릿 순서).
 * 판결·사건 이름·퍼센트는 메인에 없다 (5.3). 확신 변화는 ±20 이상일 때 한 줄만 (5.6).
 */
export function ResultScreen({ analysis, answers, judgment, actions }: Props) {
  const [copy, setCopy] = useState<Copy | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let alive = true;
    void loadResultCopy().then((m) => alive && setCopy(m));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => titleRef.current?.focus({ preventScroll: true }), [copy]);

  if (!copy) return <main className="result-screen" aria-busy="true" />;
  const { AXIS_COPY, BLEND_COPY, RESULT_COPY } = copy;
  const h = RESULT_COPY.headings;

  const start = judgment.confidence_start;
  const final = judgment.confidence_final;
  const change =
    start === undefined || final === undefined
      ? null
      : final - start >= 20
        ? RESULT_COPY.confidenceUp
        : start - final >= 20
          ? RESULT_COPY.confidenceDown
          : null;

  const insufficient = analysis.status === 'INSUFFICIENT';
  const main = AXIS_COPY[analysis.primary];
  const pairKey = [analysis.primary, analysis.secondary]
    .sort((a, b) => 'OLCP'.indexOf(a) - 'OLCP'.indexOf(b))
    .join('')
    .toLowerCase();
  const blend = analysis.blended ? BLEND_COPY[pairKey] : null;

  // 5.7 조립 5번: Q10-3 이 가리키는 축이 주 성향과 다르면 보조 문장 한 줄 (빈칸 = Q10-3 선택지 문장)
  const reasonAxis = answers.final_reason ? FINAL_REASON_AXIS[answers.final_reason] : undefined;
  const mainAxes = analysis.blended ? [analysis.primary, analysis.secondary] : [analysis.primary];
  const reasonLabel =
    !insufficient && reasonAxis && !mainAxes.includes(reasonAxis)
      ? SCENES.J110?.prompts
          ?.find((p) => p.id === 'Q10-3')
          ?.fields.flatMap((f) => (f.kind === 'choice' ? f.options : []))
          .find((o) => o.key === answers.final_reason)?.label
      : undefined;

  return (
    <main className="result-screen">
      <header className="result-head">
        <p className="result-question">{RESULT_COPY.question}</p>
        <p className="result-narration">{RESULT_COPY.narration}</p>
      </header>

      <article className="result-card" aria-labelledby="result-title">
        <h1 id="result-title" ref={titleRef} tabIndex={-1}>
          {insufficient ? RESULT_COPY.insufficient : (blend?.title ?? main.headline)}
        </h1>

        {insufficient ? (
          <p className="result-lead">{RESULT_COPY.similar}</p>
        ) : (
          <>
            {blend ? (
              <>
                <p className="result-lead">{blend.first}</p>
                <p>{AXIS_COPY[analysis.primary].introShort}</p>
                <p>{AXIS_COPY[analysis.secondary].introShort}</p>
              </>
            ) : (
              <p className="result-lead">{main.intro}</p>
            )}

            <section>
              <h2>{h.thinking}</h2>
              <p>{main.thinking}</p>
            </section>
            <section>
              <h2>{h.persuasion}</h2>
              <p>
                <Emphasis text={blend?.persuasion ?? main.persuasion} />
              </p>
            </section>
            <section>
              <h2>{h.strength}</h2>
              <p>{main.strength}</p>
            </section>
            <section>
              <h2>{h.caution}</h2>
              <p>{main.caution}</p>
            </section>
            {reasonLabel && (
              <p className="result-reason">
                {copy.DETAILS_COPY.finalReason[0]}
                {reasonLabel}
                {copy.DETAILS_COPY.finalReason[1]}
              </p>
            )}
            <section>
              <h2>{h.oneLine}</h2>
              <p className="result-one">{main.oneLine}</p>
            </section>
          </>
        )}

        {change && <p className="result-change">{change}</p>}
      </article>

      <ResultDetails analysis={analysis} answers={answers} judgment={judgment} copy={copy} />

      <div className="result-actions">
        {actions.map((action) => (
          <button key={action.label} type="button" className="result-next" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      </div>
    </main>
  );
}
