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
 * UI 키트 모양 버튼: 양끝을 깎은 육각형 + 동판 금 테두리.
 * 테두리는 바깥 금색 겹(.btn-frame) 안에 1px 작은 바탕 겹(.btn-face)을 얹어 만든다 (clip-path 는 border 를 자르므로).
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
