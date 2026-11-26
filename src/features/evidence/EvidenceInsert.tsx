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
