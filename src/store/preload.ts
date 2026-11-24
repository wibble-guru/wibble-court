import { create } from 'zustand';

/** 뒤에서 미리 받는 에셋 진행률. 진행률 바만 구독한다: `usePreload((s) => s.done / s.total)` */
export const usePreload = create<{ done: number; total: number }>(() => ({ done: 0, total: 0 }));
