import { useEffect } from 'preact/hooks';
import { cx } from '@/lib/cx';
import { prefersReducedMotion } from '@/lib/motion';

/** 한 글자가 나타나는 간격과 나타나는 시간 (play.css 의 .tw-char 와 같게) */
export const CHAR_MS = 28;
const FADE_MS = 80;

type Props = {
  text: string;
  /** true 면 남은 글자를 바로 모두 보인다 */
  done: boolean;
  /** 마지막 글자까지 나타났을 때 (동작 줄이기면 바로) */
  onDone: () => void;
};

/**
 * 타자 효과. 글을 잘라 다시 그리지 않고, 글자마다 span 을 두고 CSS 로 opacity 만 차례로 올린다
 * — 대사 한 줄에 렌더 한 번, 스크린리더는 처음부터 문장 전체를 읽는다.
 * 어절은 nowrap 으로 묶어 글자 span 사이에서 줄이 끊기지 않게 한다. 대본의 `**강조**` 는 굵게.
 */
export function Typewriter({ text, done, onDone }: Props) {
  const segments = text.split('**');
  const count = text.replaceAll('**', '').replaceAll(' ', '').length;

  useEffect(() => {
    if (done) return;
    const ms = prefersReducedMotion() ? 0 : count * CHAR_MS + FADE_MS;
    const timer = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(timer);
  }, [done, count, onDone]);

  let i = 0;
  return (
    <span className={cx('tw', done && 'is-done')}>
      {segments.map((segment, s) => {
        const words = segment.split(' ').map((word, w) => (
          <>
            {w > 0 && ' '}
            {word && (
              <span className="tw-word">
                {[...word].map((char) => (
                  <span className="tw-char" style={{ '--i': i++ }}>
                    {char}
                  </span>
                ))}
              </span>
            )}
          </>
        ));
        return s % 2 === 1 ? <strong key={s}>{words}</strong> : <span key={s}>{words}</span>;
      })}
    </span>
  );
}

/** 타자 효과 없이 대본의 `**강조**` 만 굵게 (질문 제목·메모·선택지) */
export function Emphasis({ text }: { text: string }) {
  return (
    <>{text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}</>
  );
}
