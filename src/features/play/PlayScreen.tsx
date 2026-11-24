import type { ResultContent } from '@wibble-guru/boilerplate';
import { useEffect, useState } from 'preact/hooks';
import { SceneBackground } from '@/components/SceneBackground';
import { FIRST_SCENE_BG } from '@/data/assets';
import { SCENES, decideResult, type Choice, type Trait } from '@/game/script';
import { useGame, type Progress } from '@/store/game';
import { game } from '@/wibble';

type Props = {
  /** 처음부터면 { sceneIndex: 0, 빈 점수 }, 이어서면 저장된 진행 기록 */
  start: Progress;
  onRestart: () => void;
};

type Step =
  { kind: 'scene'; index: number } | { kind: 'verdict'; result: ResultContent; sent: boolean };

/**
 * 플레이 화면 (P00 부터). 지금은 법정 배경(L-01_court) 위에 샘플 장면 흐름을 얹은 임시 화면이다.
 * 장면에 들어갈 때마다 진행을 저장하고, 판결이 나면 저장을 지운다.
 */
export function PlayScreen({ start, onRestart }: Props) {
  const saveProgress = useGame((s) => s.saveProgress);
  const clearProgress = useGame((s) => s.clearProgress);
  const [scores, setScores] = useState(start.scores);
  const [step, setStep] = useState<Step>({
    kind: 'scene',
    index: Math.min(start.sceneIndex, SCENES.length - 1),
  });

  useEffect(() => {
    if (step.kind === 'scene') saveProgress({ sceneIndex: step.index, scores });
  }, [step, scores, saveProgress]);

  function choose(index: number, choice: Choice) {
    const next = { ...scores };
    for (const [trait, n] of Object.entries(choice.traits) as [Trait, number][]) next[trait] += n;

    if (index + 1 < SCENES.length) {
      setScores(next);
      setStep({ kind: 'scene', index: index + 1 });
    } else {
      clearProgress();
      const { id, content } = decideResult(next);
      // 사이트 안이면 사이트가 결과 페이지로 이동한다. 단독 실행이면 false — 결과를 직접 보여 준다
      setStep({ kind: 'verdict', result: content, sent: game.sendResult(id, content) });
    }
  }

  return (
    <main className="play-screen">
      <div className="scene-layer">
        <SceneBackground id={FIRST_SCENE_BG} />
      </div>

      <div className="stage">
        {step.kind === 'scene' && (
          <SceneView key={SCENES[step.index].id} index={step.index} onChoose={choose} />
        )}

        {step.kind === 'verdict' && (
          <section className="title">
            <p className="eyebrow">판결</p>
            {step.sent ? (
              <p className="hint">결과 페이지로 이동하는 중…</p>
            ) : (
              <>
                <h1>
                  {step.result.emoji} {step.result.title}
                </h1>
                <p className="hint">
                  단독 실행 모드 — 사이트 안에서는 이 결과가 결과 페이지로 전달됩니다.
                </p>
                <button className="primary" onClick={onRestart}>
                  다시 하기
                </button>
              </>
            )}
          </section>
        )}
      </div>
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
