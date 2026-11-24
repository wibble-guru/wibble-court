import type { Ref } from 'preact';
import { bgSrcSet, type BgId } from '@/data/assets';
import { SCENES } from '@/data/scenes';
import type { Line } from '@/engine/types';
import { Emphasis } from '@/features/play/Typewriter';
import './epilogue.css';

/** 기록 카드의 배경 (로드맵 4a 제안, 사용자 승인): 기존 그림을 흑백·스캔라인으로 */
const CARD_BG: Record<string, BgId> = {
  '경찰서 체류 영상': 'L-04_officer-desk',
  '익명 연락': 'E-06_printed-capture',
  '22:20': 'E-09_found-2220',
};

/** 대본 연출 "‘재판 이후’라는 제목 아래 …" 의 따옴표 안 */
const title = (() => {
  const direction = SCENES.EPILOGUE?.lines.find((l) => l.kind === 'direction');
  return direction?.text.match(/‘(.+?)’/)?.[1] ?? '';
})();

type Props = {
  /** EPILOGUE 의 화면 대사 (runner.visibleLines — 연출 줄 제외) */
  lines: Line[];
  index: number;
  onPress: () => void;
  pressLabel: string;
  buttonRef?: Ref<HTMLButtonElement>;
};

/**
 * EPILOGUE (판결 당시의 미해결 기록). 대화창 대신 기록 카드가 한 장씩 → 내레이션 → 마지막 화면 두 줄.
 * 문장은 EPILOGUE 장면 데이터 그대로. 누르면(클릭·Enter·Space — PlayScreen) 다음.
 */
export function Epilogue({ lines, index, onPress, pressLabel, buttonRef }: Props) {
  const line = lines[index];
  if (!line) return null;
  const bg = CARD_BG[line.speaker];
  const lastScreen = lines.filter((l, i) => l.speaker === '마지막 화면' && i <= index);

  return (
    <button ref={buttonRef} type="button" className="epilogue" onClick={onPress}>
      <span className="epilogue-title">{title}</span>

      {bg && (
        <span key={line.speaker} className="epilogue-card">
          <span className="epilogue-photo">
            <img srcSet={bgSrcSet(bg)} sizes="min(560px, 90vw)" alt="" draggable={false} />
            <span className="epilogue-scan" />
          </span>
          <span className="epilogue-label">{line.speaker}</span>
          <span className="epilogue-text">{line.text}</span>
        </span>
      )}

      {line.speaker === '내레이션' && (
        <span key="narration" className="epilogue-narration">
          {line.text}
        </span>
      )}

      {line.speaker === '마지막 화면' && (
        <span className="epilogue-last">
          {lastScreen.map((l, i) => (
            <span key={i} className={i === 0 ? 'is-first' : undefined}>
              <Emphasis text={l.text} />
            </span>
          ))}
        </span>
      )}

      <span className="sr-only">{pressLabel}</span>
    </button>
  );
}
