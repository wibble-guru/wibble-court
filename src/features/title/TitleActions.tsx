import { useEffect, useRef } from 'preact/hooks';
import { TITLE_COPY } from '@/data/title';
import { ConfirmRestart } from './ConfirmRestart';
import { TitleButton } from './TitleButton';

export type StartMode = 'new' | 'continue';

type Props = {
  hasSave: boolean;
  confirming: boolean;
  onConfirmingChange: (open: boolean) => void;
  onStart: (mode: StartMode) => void;
};

/** 저장이 없으면 [재판 시작], 있으면 [이어서 하기] [처음부터]. [처음부터]는 확인 창을 거친다. */
export function TitleActions({ hasSave, confirming, onConfirmingChange, onStart }: Props) {
  const restartRef = useRef<HTMLButtonElement>(null);
  const wasConfirmingRef = useRef(false);

  // 확인 창을 닫고 돌아오면 [처음부터]에 포커스를 돌려준다 (키보드 사용자가 길을 잃지 않게)
  useEffect(() => {
    if (wasConfirmingRef.current && !confirming) restartRef.current?.focus();
    wasConfirmingRef.current = confirming;
  }, [confirming]);

  if (confirming) {
    return (
      <ConfirmRestart onConfirm={() => onStart('new')} onCancel={() => onConfirmingChange(false)} />
    );
  }

  if (!hasSave) {
    return (
      <div className="title-actions">
        <TitleButton onClick={() => onStart('new')}>{TITLE_COPY.start}</TitleButton>
      </div>
    );
  }

  return (
    <div className="title-actions">
      <TitleButton onClick={() => onStart('continue')}>{TITLE_COPY.continue}</TitleButton>
      <TitleButton
        variant="secondary"
        onClick={() => onConfirmingChange(true)}
        buttonRef={restartRef}
      >
        {TITLE_COPY.restart}
      </TitleButton>
    </div>
  );
}
