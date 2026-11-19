import { useEffect, useState } from "react";
import { connectToHost, sendResult, type HostContext } from "./bridge";
import { SCENES, decideResult, type Choice, type Trait } from "./game/script";

type Phase =
  | { kind: "connecting" }
  | { kind: "title" }
  | { kind: "scene"; index: number }
  | { kind: "verdict"; resultId: string; sent: boolean };

const emptyScores = (): Record<Trait, number> => ({ judge: 0, prosecutor: 0, defender: 0 });

export function App() {
  const [host, setHost] = useState<HostContext | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "connecting" });
  const [scores, setScores] = useState(emptyScores);

  useEffect(() => {
    let alive = true;
    connectToHost().then((ctx) => {
      if (!alive) return;
      setHost(ctx);
      setPhase({ kind: "title" });
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = host?.theme ?? "default";
  }, [host?.theme]);

  function choose(index: number, choice: Choice) {
    const next = { ...scores };
    for (const [trait, n] of Object.entries(choice.traits) as [Trait, number][]) next[trait] += n;
    setScores(next);

    if (index + 1 < SCENES.length) {
      setPhase({ kind: "scene", index: index + 1 });
    } else {
      const resultId = decideResult(next);
      setPhase({ kind: "verdict", resultId, sent: sendResult(resultId) });
    }
  }

  function restart() {
    setScores(emptyScores());
    setPhase({ kind: "title" });
  }

  return (
    <main className="stage">
      {phase.kind === "connecting" && <p className="hint">사이트와 연결하는 중…</p>}

      {phase.kind === "title" && (
        <section className="title">
          <p className="eyebrow">WIBBLE COURT</p>
          <h1>위블 법정</h1>
          <p className="hint">당신은 어떤 재판관일까?</p>
          <button className="primary" onClick={() => setPhase({ kind: "scene", index: 0 })}>
            개정합니다
          </button>
        </section>
      )}

      {phase.kind === "scene" && (
        <SceneView key={SCENES[phase.index].id} index={phase.index} onChoose={choose} />
      )}

      {phase.kind === "verdict" && (
        <section className="title">
          <p className="eyebrow">판결</p>
          {phase.sent ? (
            <p className="hint">결과 페이지로 이동하는 중…</p>
          ) : (
            <>
              <h1>{phase.resultId}</h1>
              <p className="hint">단독 실행 모드 — 사이트 안에서는 이 결과 id가 사이트로 전달됩니다.</p>
              <button className="primary" onClick={restart}>
                다시 하기
              </button>
            </>
          )}
        </section>
      )}

      {host && !host.embedded && (
        <p className="dev-badge">
          standalone · slug={host.slug} · theme={host.theme}
        </p>
      )}
    </main>
  );
}

function SceneView({ index, onChoose }: { index: number; onChoose: (index: number, choice: Choice) => void }) {
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
