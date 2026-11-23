/** 사용자가 OS 에서 "동작 줄이기"를 켰는지. 켜져 있으면 등장·전환 연출 없이 바로 보여 준다. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
