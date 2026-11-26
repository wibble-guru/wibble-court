import type { ComponentChildren, Ref } from 'preact';
import { useState } from 'preact/hooks';
import { flipped, type Portrait, portraitOf, portraitSrc } from '@/data/characters';
import { roleOf, sideOf, splitSpeaker } from '@/data/speakers';

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
  /** 발언자의 포즈 (data/line-poses, 0 기본) */
  pose?: number;
  /** 발언자 없이 세울 인물 (질문 단계의 재판장) */
  figure?: Portrait;
  children: ComponentChildren;
};

/**
 * 대화창 (계획서 83, 림버스풍): 상자 없이 화면 아래 어둠 위에 대사, 그 위에 소속 꼬리표 + 이름 명판.
 * 꼬리표 글자는 역할 색. 인물 그림은 어둠 뒤에 서서 아랫부분이 어둠에 잠긴다.
 * 같은 사람이 이어 말하면 이름표는 그대로 있고(key = 발언자), 사람이 바뀔 때만 들어오는 움직임이 있다.
 * 인물 그림은 대사마다 포즈가 바뀐다 (계획서 71): 사람이 바뀌면 옆에서 들어오고, 같은 사람의 포즈만 바뀌면 짧게 겹쳐 바뀐다.
 */
export function DialogueBox({
  speaker,
  showNext,
  onPress,
  pressLabel,
  panelRef,
  pose = 0,
  figure,
  children,
}: Props) {
  const role = speaker ? roleOf(speaker) : 'narration';
  const side = sideOf(role);
  const { tag, name } = speaker ? splitSpeaker(speaker) : { tag: undefined, name: '' };
  const speakerPortrait = portraitOf(speaker);
  const portrait = speakerPortrait ? { ...speakerPortrait, pose } : (figure ?? null);
  // 그림이 바뀐 차례: 사람이 바뀌면 0(옆에서 들어옴), 같은 사람의 포즈만 바뀌면 1, 2, … (겹쳐 바뀜)
  const imageKey = portrait ? `${portrait.id}-${portrait.pose ?? 0}` : null;
  const [shown, setShown] = useState({ id: portrait?.id ?? null, key: imageKey, step: 0 });
  if (shown.key !== imageKey) {
    const id = portrait?.id ?? null;
    setShown({ id, key: imageKey, step: id !== null && id === shown.id ? shown.step + 1 : 0 });
  }
  const samePerson = shown.key === imageKey && shown.step > 0;
  const face = (
    <span className="dialogue-face">
      {children}
      {onPress && pressLabel && <span className="sr-only">{pressLabel}</span>}
      <svg
        className={showNext ? 'dialogue-next is-on' : 'dialogue-next'}
        viewBox="0 0 12 8"
        aria-hidden="true"
      >
        <polygon points="0,0 12,0 6,8" />
      </svg>
    </span>
  );

  return (
    <div className="dialogue" data-side={side} style={{ '--role': `var(--role-${role})` }}>
      {/* 말하는 인물 (그림이 있는 발언자만). key = 인물·포즈 — 사람이 바뀌면 들어오고, 포즈만 바뀌면 겹쳐 바뀜 */}
      {portrait && (
        <img
          key={imageKey}
          className={samePerson ? 'portrait is-swap' : 'portrait'}
          data-side={portrait.side}
          data-flip={flipped(portrait) || undefined}
          src={portraitSrc(portrait.id, portrait.pose)}
          alt=""
          draggable={false}
        />
      )}
      {speaker && (
        <div key={speaker} className="nameplate">
          {tag && <span className="plate-tag">{tag}</span>}
          <span className="plate">{name}</span>
        </div>
      )}
      {onPress ? (
        <button ref={panelRef} type="button" className="dialogue-frame" onClick={onPress}>
          {face}
        </button>
      ) : (
        <div className="dialogue-frame">{face}</div>
      )}
    </div>
  );
}
