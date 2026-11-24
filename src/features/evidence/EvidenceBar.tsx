import { iconSrc } from '@/data/assets';
import { EVIDENCE } from '@/data/evidence';
import type { EvidenceId } from '@/engine/types';
import './evidence.css';

/**
 * 증거 상자 (화면 오른쪽 위, UI 키트의 아이템 칸 막대 — 오른쪽 갈매기는 장식). 지나온 경로에서 얻은 증거만.
 * 새로 들어온 칸만 한 번 커지며 나타난다 (key = 증거 id 라 이미 있던 칸은 다시 움직이지 않음).
 */
export function EvidenceBar({ ids }: { ids: EvidenceId[] }) {
  if (ids.length === 0) return null;
  return (
    <ul className="evidence-bar">
      {ids.map((id) => (
        <li key={id} className="evidence-slot" title={EVIDENCE[id].name}>
          <img
            className="pixelated"
            src={iconSrc(EVIDENCE[id].icon)}
            alt={EVIDENCE[id].name}
            draggable={false}
          />
        </li>
      ))}
    </ul>
  );
}
