import { useEffect, useRef } from 'preact/hooks';
import { iconSrc } from '@/data/assets';
import { EVIDENCE, gainedAt } from '@/data/evidence';
import {
  RECORD_KIND,
  RECORD_NOTE,
  RECORDS,
  recordLines,
  type RecordCursor,
} from '@/data/evidence-record';
import { sceneTitle } from '@/data/scene-title';
import { SCENES } from '@/data/scenes';
import type { EvidenceId, SceneId } from '@/engine/types';
import { Emphasis } from '@/features/play/Typewriter';

import { EVIDENCE_COPY } from './copy';

type Props = {
  /** 얻은 증거 (증거 상자와 같은 순서) */
  ids: EvidenceId[];
  /** 지금 보는 증거. null 이면 목록 */
  view: EvidenceId | null;
  /** 지나온 장면 + 지금 장면 (얻은 장면 찾기) */
  visited: readonly SceneId[];
  /** 지금 장면과 지금까지 나온 대본 줄 (기록은 여기까지만) */
  cursor: RecordCursor | null;
  onView: (id: EvidenceId | null) => void;
  onClose: () => void;
};

const gainOf = (scene: SceneId) => SCENES[scene]?.gain;

/**
 * 증거 모달 (계획서 55·59). 한 개 보기: 종류·이름, 얻은 장면 제목, 기록(대본 대사 그대로, 본 부분만). 목록: 얻은 증거 격자.
 * 떠 있는 동안 대사는 멈춘다 (PlayScreen). Esc·바깥·닫기로 닫고, 닫으면 열기 전 초점으로 돌아간다.
 */
export function EvidenceModal({ ids, view, visited, cursor, onView, onClose }: Props) {
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      openerRef.current?.focus();
    };
  }, [onClose]);

  // 열 때, 한 개 보기·목록을 오갈 때 모달 안으로 초점
  useEffect(() => {
    dialogRef.current?.focus();
  }, [view]);

  const item = view ? EVIDENCE[view] : null;
  const scene = view ? gainedAt(view, visited, gainOf) : undefined;
  const record = view ? recordLines(view, visited, cursor) : [];

  return (
    <div className="evidence-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className="evidence-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item ? item.name : EVIDENCE_COPY.list}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="evidence-modal-head">
          {item && view ? (
            <div className="evidence-heading">
              <span className="evidence-heading-icon">
                <img className="pixelated" src={iconSrc(item.icon)} alt="" draggable={false} />
              </span>
              <div>
                <p className="evidence-kind">{RECORD_KIND[RECORDS[view].kind]}</p>
                <h2 className="evidence-detail-name">{item.name}</h2>
              </div>
            </div>
          ) : (
            <h2 className="evidence-modal-title">{EVIDENCE_COPY.list}</h2>
          )}
          <button type="button" className="evidence-modal-button" onClick={onClose}>
            {EVIDENCE_COPY.close}
          </button>
        </header>

        {item && view ? (
          <div key={view} className="evidence-detail">
            {scene && <p className="evidence-detail-scene">{sceneTitle(scene)}</p>}
            {record.length > 0 && (
              <ol className="evidence-record" tabIndex={0}>
                {record.map((line, i) =>
                  line.kind === 'direction' ? (
                    <li key={i} className="is-direction">
                      {line.text.replace(/^연출:\s*/, '')}
                    </li>
                  ) : (
                    <li key={i}>
                      <span className="evidence-record-who">{line.speaker}</span>
                      <p>
                        <Emphasis text={line.text} />
                      </p>
                    </li>
                  ),
                )}
              </ol>
            )}
            <div className="evidence-detail-foot">
              <p className="evidence-note">{RECORD_NOTE}</p>
              <button type="button" className="evidence-modal-button" onClick={() => onView(null)}>
                {EVIDENCE_COPY.back}
              </button>
            </div>
          </div>
        ) : (
          <ul className="evidence-grid">
            {ids.map((id) => (
              <li key={id}>
                <button type="button" className="evidence-grid-item" onClick={() => onView(id)}>
                  <span className="evidence-slot-face">
                    <img
                      className="pixelated"
                      src={iconSrc(EVIDENCE[id].icon)}
                      alt=""
                      draggable={false}
                    />
                  </span>
                  <span className="evidence-grid-name">{EVIDENCE[id].name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
