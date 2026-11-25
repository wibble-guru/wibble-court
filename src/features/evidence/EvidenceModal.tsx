import { useEffect, useRef } from 'preact/hooks';
import { iconSrc } from '@/data/assets';
import { EVIDENCE, gainedAt, INSERTS, REPLAY } from '@/data/evidence';
import { sceneTitle } from '@/data/scene-title';
import { SCENES } from '@/data/scenes';
import type { EvidenceId, SceneId } from '@/engine/types';
import { EvidenceInsert } from './EvidenceInsert';

/** 대본에 없는 화면 문구 (계획서 55 승인: 목록·닫기, 갈매기 버튼 이름) */
export const EVIDENCE_COPY = { list: '증거 목록', back: '목록', close: '닫기' };

type Props = {
  /** 얻은 증거 (증거 상자와 같은 순서) */
  ids: EvidenceId[];
  /** 지금 보는 증거. null 이면 목록 */
  view: EvidenceId | null;
  /** 지나온 장면 + 지금 장면 (얻은 장면 찾기) */
  visited: readonly SceneId[];
  onView: (id: EvidenceId | null) => void;
  onClose: () => void;
};

const gainOf = (scene: SceneId) => SCENES[scene]?.gain;

/**
 * 증거 모달 (계획서 55). 한 개 보기: 큰 그림, 이름, 얻은 장면 제목, 증거 화면 다시 보기. 목록: 얻은 증거 격자.
 * 떠 있는 동안 대사는 멈춘다 (PlayScreen). Esc·바깥·닫기로 닫고, 닫으면 열기 전 초점으로 돌아간다.
 */
export function EvidenceModal({ ids, view, visited, onView, onClose }: Props) {
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
  const replay = view ? REPLAY[view] : undefined;
  const insert = replay ? INSERTS[replay]?.insert : undefined;

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
          {item ? (
            <button type="button" className="evidence-modal-button" onClick={() => onView(null)}>
              {EVIDENCE_COPY.back}
            </button>
          ) : (
            <h2 className="evidence-modal-title">{EVIDENCE_COPY.list}</h2>
          )}
          <button type="button" className="evidence-modal-button" onClick={onClose}>
            {EVIDENCE_COPY.close}
          </button>
        </header>

        {item && view ? (
          <div key={view} className="evidence-detail">
            <span className="evidence-detail-icon">
              <img className="pixelated" src={iconSrc(item.icon)} alt="" draggable={false} />
            </span>
            <h2 className="evidence-detail-name">{item.name}</h2>
            {scene && <p className="evidence-detail-scene">{sceneTitle(scene)}</p>}
            {insert && <EvidenceInsert insert={insert} inline />}
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
