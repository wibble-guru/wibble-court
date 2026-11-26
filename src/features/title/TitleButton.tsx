import type { ComponentChildren, Ref } from 'preact';
import { cx } from '@/lib/cx';

type Props = {
  children: ComponentChildren;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'small';
  buttonRef?: Ref<HTMLButtonElement>;
};

/**
 * 황동 UI 버튼 (계획서 83): 모서리 둘을 깎은 판(.btn-frame clip-path) 안에 적갈색 바탕 + 황동 두 줄(.btn-face).
 */
export function TitleButton({
  children,
  onClick,
  variant = 'primary',
  size = 'normal',
  buttonRef,
}: Props) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={cx('title-btn', `is-${variant}`, `is-${size}`)}
      onClick={(e) => {
        e.stopPropagation(); // 배경 클릭(시작)으로 번지지 않게
        onClick();
      }}
    >
      <span className="btn-frame">
        <span className="btn-face">{children}</span>
      </span>
    </button>
  );
}
