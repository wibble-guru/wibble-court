import type { ComponentChildren, Ref } from 'preact';
import { UI } from '@/data/assets';
import { type Portrait, portraitOf, portraitSrc } from '@/data/characters';
import { roleOf, sideOf } from '@/data/speakers';

type Props = {
  /** 대본 표기 그대로. 없으면(질문 단계) 이름표 없음 */
  speaker?: string;
  /** 대사가 다 나왔으면 갈매기(⌄)로 "다음"을 알린다 */
  showNext?: boolean;
  /** 있으면 패널 전체가 "다음" 버튼이 된다 (대사 단계) */
  onPress?: () => void;
  /** 보조기기용 버튼 이름 꼬리 (대사 뒤에 읽힘) */
  pressLabel?: string;
  panelRef?: Ref<HTMLButtonElement>;
  /** 발언자 없이 세울 인물 (질문 단계의 재판장) */
  figure?: Portrait;
  children: ComponentChildren;
};

/**
 * 대화창 (UI 키트 대화창·이름표 조각을 border-image 로, 월계수 이름표) + 말하는 인물 그림.
 * 이름표는 발언자 역할에 따라 왼쪽(검사·그 외)·오른쪽(변호인)·가운데(재판장)에 서고, 이름 글자는 역할 색.
 * 같은 사람이 이어 말하면 이름표는 그대로 있고(key = 발언자), 사람이 바뀔 때만 들어오는 움직임이 있다.
 */
export function DialogueBox({
  speaker,
  showNext,
  onPress,
  pressLabel,
  panelRef,
  figure,
  children,
}: Props) {
  const role = speaker ? roleOf(speaker) : 'narration';
  const side = sideOf(role);
  const portrait = portraitOf(speaker) ?? figure ?? null;
  const face = (
    <span className="dialogue-face">
      {children}
      {onPress && pressLabel && <span className="sr-only">{pressLabel}</span>}
      <svg
        className={showNext ? 'dialogue-next is-on' : 'dialogue-next'}
        viewBox="0 0 24 14"
        aria-hidden="true"
      >
        <polyline points="2,2 12,12 22,2" />
      </svg>
    </span>
  );

  return (
    <div className="dialogue" data-side={side} style={{ '--role': `var(--role-${role})` }}>
      {/* 말하는 인물 (그림이 있는 발언자만). 사람이 바뀔 때만 들어오는 움직임 (key = 인물) */}
      {portrait && (
        <img
          key={portrait.id}
          className="portrait"
          data-side={portrait.side}
          src={portraitSrc(portrait.id)}
          alt=""
          draggable={false}
        />
      )}
      {speaker && (
        <div key={speaker} className="nameplate">
          <img className="laurel" src={UI.laurelLeft} alt="" />
          <span className="plate">{speaker}</span>
          <img className="laurel" src={UI.laurelRight} alt="" />
        </div>
      )}
      {onPress ? (
        <button ref={panelRef} type="button" className="dialogue-frame" onClick={onPress}>
          {face}
        </button>
      ) : (
        <div className="dialogue-frame">{face}</div>
      )}
      <span className="dialogue-gem" aria-hidden="true" />
    </div>
  );
}
