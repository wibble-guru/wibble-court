import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { TAB_LABELS, TAB_ORDER, type NotebookTab } from '@/data/notebook';
import { buildNotebook } from '@/engine/notebook';
import type { StoryState } from '@/engine/types';
import { Emphasis } from '@/features/play/Typewriter';
import './notebook.css';

/** 대본에 없는 화면 문구 (사용자 승인: 버튼 = 대본 7.1·7.2 의 낱말 "기록장", 닫기) */
const COPY = { open: '기록장', close: '닫기' };

type Props = {
  story: StoryState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * 기록장 (대본 7.1 규칙 6, 7.2). 오른쪽 위 버튼으로 열고, 다섯 탭에 지나온 경로의 대사만 보인다.
 * 내용은 buildNotebook(진행 상태) — 열 때만 계산. 키보드: 탭 ←→, Esc 닫기, 닫으면 버튼으로 포커스 복귀.
 */
export function Notebook({ story, open, onOpenChange }: Props) {
  const [tab, setTab] = useState<NotebookTab>('facts');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Partial<Record<NotebookTab, HTMLButtonElement | null>>>({});
  const wasOpenRef = useRef(false);
  const book = useMemo(() => (open ? buildNotebook(story) : null), [open, story]);

  useEffect(() => {
    if (open) tabRefs.current[tab]?.focus();
    else if (wasOpenRef.current) buttonRef.current?.focus();
    wasOpenRef.current = open;
    // 열고 닫힐 때만 (탭을 바꿀 때마다 포커스를 옮기는 건 onKeyDown 이 한다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  function onTabKey(e: KeyboardEvent) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = TAB_ORDER[(TAB_ORDER.indexOf(tab) + step + TAB_ORDER.length) % TAB_ORDER.length];
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="notebook-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
      >
        {COPY.open}
      </button>

      {open && book && (
        <div className="notebook-backdrop" onClick={() => onOpenChange(false)}>
          <section
            className="notebook"
            role="dialog"
            aria-modal="true"
            aria-label={COPY.open}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="notebook-head">
              <div className="notebook-tabs" role="tablist" onKeyDown={onTabKey}>
                {TAB_ORDER.map((id) => (
                  <button
                    key={id}
                    ref={(el) => {
                      tabRefs.current[id] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`notebook-tab-${id}`}
                    aria-selected={tab === id}
                    aria-controls="notebook-panel"
                    tabIndex={tab === id ? 0 : -1}
                    onClick={() => setTab(id)}
                  >
                    {TAB_LABELS[id]} <span className="notebook-count">{book[id].length}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="notebook-close" onClick={() => onOpenChange(false)}>
                {COPY.close}
              </button>
            </header>

            <div
              id="notebook-panel"
              className="notebook-list"
              role="tabpanel"
              aria-labelledby={`notebook-tab-${tab}`}
              tabIndex={0}
            >
              <ol>
                {book[tab].map((item, i) => (
                  <li key={i} className="notebook-item">
                    {item.lines.map((line, j) => (
                      <p key={j}>
                        {/* 나의 결정은 질문 제목, 나머지는 발언자 */}
                        <span className={tab === 'decisions' ? 'notebook-q' : 'notebook-who'}>
                          {line.speaker}
                        </span>
                        <Emphasis text={line.text} />
                      </p>
                    ))}
                    <small className="notebook-source">{item.source}</small>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
