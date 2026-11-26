import type { Ref } from 'preact';
import { iconSrc } from '@/data/assets';
import type { MessageInsert } from '@/data/evidence';

type Props = {
  insert: MessageInsert;
  /** 지금까지 올라온 말풍선 수 (data/evidence messageView) */
  shown: number;
  /** 있으면 창 전체가 "다음" 버튼 (말풍선 대사 동안 대화창 대신) */
  onPress?: () => void;
  pressLabel?: string;
  buttonRef?: Ref<HTMLButtonElement>;
};

/**
 * 메신저 창 (계획서 78·83). 배치는 붕괴: 스타레일 메시지 창(흐린 장면 위 창 하나), 모양은 다른 모달과 같은 황동 패널. 말풍선 대사 동안은 배경을 흐리게 깔고(messenger-veil) 무대를 차지하고,
 * 누르면 다음 대사. 다른 사람이 문자를 인용하는 대사 동안은 대화창 위에 작게 선다.
 * 문구는 모두 대본 그대로 (data/evidence). 이름·시각은 대본 발언자 표기에 있는 것만.
 */
export function Messenger({ insert, shown, onPress, pressLabel, buttonRef }: Props) {
  const body = (
    <>
      {insert.sender && (
        <span className="messenger-head">
          <img
            className="messenger-icon pixelated"
            src={iconSrc('I-08_anon-phone')}
            alt=""
            draggable={false}
          />
          <span className="messenger-name">{insert.sender}</span>
        </span>
      )}
      <span className="messenger-thread">
        {insert.bubbles.slice(0, shown).map((b, i) => (
          <span key={i} className={`messenger-row is-${b.side}`}>
            <span className="messenger-text">{b.text}</span>
            {b.time && <span className="messenger-time">{b.time}</span>}
          </span>
        ))}
      </span>
    </>
  );

  return onPress ? (
    <button ref={buttonRef} type="button" className="messenger is-full" onClick={onPress}>
      {body}
      {pressLabel && <span className="sr-only">{pressLabel}</span>}
      {/* 대화창의 "다음" 삼각형과 같은 모양: 눌러서 넘긴다는 표시 */}
      <svg className="messenger-next" viewBox="0 0 12 8" aria-hidden="true">
        <polygon points="0,0 12,0 6,8" />
      </svg>
    </button>
  ) : (
    // 대화창이 같은 문장을 읽으므로 보조기기에는 숨긴다
    <div className="messenger" aria-hidden="true">
      {body}
    </div>
  );
}
