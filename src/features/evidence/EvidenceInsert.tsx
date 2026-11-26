import { iconSrc } from '@/data/assets';
import type { Insert } from '@/data/evidence';

/**
 * 증거 화면: 대사 진행을 막지 않고 배경 위에 겹쳐 보이는 녹음·시간표. 메시지는 Messenger (대화창과 자리를 나눔).
 * 같은 문장이 대사로 이미 읽히므로 보조기기에는 숨긴다(aria-hidden). 문구는 data/evidence 의 대본 문장 그대로.
 */
export function EvidenceInsert({ insert }: { insert: Insert }) {
  if (insert.kind === 'message') return null;
  return (
    <div className={`evidence-insert is-${insert.kind}`} aria-hidden="true">
      {insert.kind === 'recorder' && (
        // 증거 아이콘과 같은 픽셀 기기: 머리(아이콘·녹음 표시·파일 이름) → 화면(파형) → 버튼
        <div className="rec" data-device={insert.device}>
          <span className="rec-head">
            {/* 증거 화면 전체가 pointer-events: none 이라 끌기 막음(draggable)은 필요 없다 */}
            <img className="rec-icon pixelated" src={iconSrc(insert.device)} alt="" />
            <span className="rec-dot" />
            {insert.label && <span className="rec-label">{insert.label}</span>}
          </span>
          <span className="rec-screen">
            {Array.from({ length: 20 }, (_, i) => (
              <i key={i} style={{ '--h': `${30 + ((i * 37) % 70)}%` }} />
            ))}
          </span>
          <span className="rec-keys" />
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
