import { useEffect, useRef, useState } from 'preact/hooks';
import type * as ResultCopyModule from '@/data/result-copy';
import type { Analysis } from '@/engine/score';
import type { Judgment } from '@/engine/types';
import { Emphasis } from '@/features/play/Typewriter';
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
  judgment: Partial<Judgment>;
  /** 대본에 없는 버튼 문구 (사용자 승인: "다음") */
  nextLabel: string;
  onNext: () => void;
};

/**
 * RESULT (대본 5부). 법정 배경이 사라진 자리에 질문 → 내레이션 → 결과 카드(5.7 템플릿 순서).
 * 판결·사건 이름·퍼센트는 메인에 없다 (5.3). 확신 변화는 ±20 이상일 때 한 줄만 (5.6).
 */
export function ResultScreen({ analysis, judgment, nextLabel, onNext }: Props) {
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
            <section>
              <h2>{h.oneLine}</h2>
              <p className="result-one">{main.oneLine}</p>
            </section>
          </>
        )}

        {change && <p className="result-change">{change}</p>}
      </article>

      <button type="button" className="result-next" onClick={onNext}>
        {nextLabel}
      </button>
    </main>
  );
}
