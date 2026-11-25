import { iconSrc } from '@/data/assets';
import { EVIDENCE } from '@/data/evidence';
import type { EvidenceId } from '@/engine/types';
import { EVIDENCE_COPY } from './copy';
import './evidence.css';

type Props = {
  ids: EvidenceId[];
  /** 칸 → 그 증거, 갈매기 → 목록 (null) */
  onOpen: (id: EvidenceId | null) => void;
};

/**
 * 증거 상자 (화면 오른쪽 위, UI 키트의 아이템 칸 막대). 지나온 경로에서 얻은 증거만.
 * 칸을 누르면 그 증거 모달, 오른쪽 갈매기를 누르면 목록 모달 (계획서 55).
 * 새로 들어온 칸만 한 번 커지며 나타난다 (key = 증거 id 라 이미 있던 칸은 다시 움직이지 않음).
 */
export function EvidenceBar({ ids, onOpen }: Props) {
  if (ids.length === 0) return null;
  return (
    <div className="evidence-bar">
      <ul className="evidence-slots">
        {ids.map((id) => (
          <li key={id} className="evidence-slot">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={EVIDENCE[id].name}
              title={EVIDENCE[id].name}
              onClick={() => onOpen(id)}
            >
              <img
                className="pixelated"
                src={iconSrc(EVIDENCE[id].icon)}
                alt=""
                draggable={false}
              />
            </button>
          </li>
        ))}
      </ul>
      {/* 키트 막대 오른쪽 갈매기 자리 */}
      <button
        type="button"
        className="evidence-more"
        aria-haspopup="dialog"
        aria-label={EVIDENCE_COPY.list}
        title={EVIDENCE_COPY.list}
        onClick={() => onOpen(null)}
      />
    </div>
  );
}
