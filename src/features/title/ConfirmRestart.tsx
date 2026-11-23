import { useEffect, useRef } from 'preact/hooks';
import { TITLE_COPY } from '@/data/title';
import { TitleButton } from './TitleButton';

/** [처음부터] 확인. 브라우저 confirm 대신 화면 안의 작은 창. 열리면 [취소]에 포커스, Esc 로 닫힘(TitleScreen). */
export function ConfirmRestart({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { message, confirm, cancel } = TITLE_COPY.restartConfirm;

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      className="title-confirm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="title-confirm-message"
      onClick={(e) => e.stopPropagation()}
    >
      <p id="title-confirm-message">{message}</p>
      <div className="title-confirm-actions">
        <TitleButton size="small" onClick={onConfirm}>
          {confirm}
        </TitleButton>
        <TitleButton size="small" variant="secondary" onClick={onCancel} buttonRef={cancelRef}>
          {cancel}
        </TitleButton>
      </div>
    </div>
  );
}
