import type { ResultContent } from '@wibble-guru/boilerplate';
import { useState } from 'preact/hooks';
import { SCENES, decideResult, type Choice, type Trait } from '@/game/script';
import { game } from '@/wibble';

type Phase =
  | { kind: 'title' }
  | { kind: 'scene'; index: number }
  | { kind: 'verdict'; result: ResultContent; sent: boolean };

const emptyScores = (): Record<Trait, number> => ({ judge: 0, prosecutor: 0, defender: 0 });

/**
 * 화면 흐름: 타이틀 → 장면 → 판결.
 * 사이트 연결·막힌 화면·테마 반영은 main.tsx의 WibbleFrame(@wibble-guru/boilerplate)이 맡는다.
 */
export function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'title' });
  const [scores, setScores] = useState(emptyScores);

  function choose(index: number, choice: Choice) {
    const next = { ...scores };
    for (const [trait, n] of Object.entries(choice.traits) as [Trait, number][]) next[trait] += n;
    setScores(next);

    if (index + 1 < SCENES.length) {
      setPhase({ kind: 'scene', index: index + 1 });
    } else {
      const { id, content } = decideResult(next);
      // 사이트 안이면 사이트가 결과 페이지로 이동한다. 단독 실행이면 false — 결과를 직접 보여 준다
      setPhase({ kind: 'verdict', result: content, sent: game.sendResult(id, content) });
    }
  }

  function restart() {
    setScores(emptyScores());
    setPhase({ kind: 'title' });
  }

  return (
    <main className="stage">
      {phase.kind === 'title' && (
        <section className="title">
          <p className="eyebrow">WIBBLE COURT</p>
          <h1>위블 법정</h1>
          <p className="hint">당신은 어떤 재판관일까?</p>
          <button className="primary" onClick={() => setPhase({ kind: 'scene', index: 0 })}>
            개정합니다
          </button>
        </section>
      )}

      {phase.kind === 'scene' && (
        <SceneView key={SCENES[phase.index].id} index={phase.index} onChoose={choose} />
      )}

      {phase.kind === 'verdict' && (
        <section className="title">
          <p className="eyebrow">판결</p>
          {phase.sent ? (
            <p className="hint">결과 페이지로 이동하는 중…</p>
          ) : (
            <>
              <h1>
                {phase.result.emoji} {phase.result.title}
              </h1>
              <p className="hint">
                단독 실행 모드 — 사이트 안에서는 이 결과가 결과 페이지로 전달됩니다.
              </p>
              <button className="primary" onClick={restart}>
                다시 하기
              </button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function SceneView({
  index,
  onChoose,
}: {
  index: number;
  onChoose: (index: number, choice: Choice) => void;
}) {
  const scene = SCENES[index];
  return (
    <section className="scene">
      <p className="progress">
        {index + 1} / {SCENES.length}
      </p>
      <div className="dialogue">
        <p className="speaker">{scene.speaker}</p>
        <p className="line">{scene.line}</p>
      </div>
      <div className="choices">
        {scene.choices.map((choice) => (
          <button key={choice.label} onClick={() => onChoose(index, choice)}>
            {choice.label}
          </button>
        ))}
      </div>
    </section>
  );
}
