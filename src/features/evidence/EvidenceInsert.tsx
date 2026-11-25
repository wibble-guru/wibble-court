import { MODAL } from '@/data/assets';
import type { Insert } from '@/data/evidence';

/**
 * 증거 화면: 대사 진행을 막지 않고 배경 위에 겹쳐 보이는 녹음·메시지·시간표.
 * 같은 문장이 대사로 이미 읽히므로 보조기기에는 숨긴다(aria-hidden). 문구는 data/evidence 의 대본 문장 그대로.
 */
export function EvidenceInsert({ insert }: { insert: Insert }) {
  return (
    <div className={`evidence-insert is-${insert.kind}`} aria-hidden="true">
      {insert.kind === 'recorder' && (
        <div className="rec">
          <span className="rec-dot" />
          <span className="rec-play" />
          {insert.label && <span className="rec-label">{insert.label}</span>}
          <span className="rec-wave">
            {Array.from({ length: 24 }, (_, i) => (
              <i key={i} style={{ '--h': `${30 + ((i * 37) % 70)}%` }} />
            ))}
          </span>
        </div>
      )}

      {insert.kind === 'message' && (
        <div className={insert.phone === 'image' ? 'phone is-image' : 'phone is-css'}>
          {insert.phone === 'image' && <img className="pixelated" src={MODAL.twoBubbles} alt="" />}
          {insert.bubbles.map((bubble, i) => (
            <p key={i} className={`bubble is-${bubble.side}`}>
              {bubble.text}
            </p>
          ))}
        </div>
      )}

      {insert.kind === 'timeline' && (
        <p className="timeline-line">
          <s>{insert.from}</s>
          <span className="timeline-arrow" />
          <strong>{insert.to}</strong>
        </p>
      )}
    </div>
  );
}
