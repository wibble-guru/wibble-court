import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Trait } from '@/game/script';
import { safeStorage } from '@/lib/safe-storage';

export type Scores = Record<Trait, number>;

/** 저장되는 진행 기록: 지금 보고 있는 장면과 그때까지의 점수 */
export type Progress = { sceneIndex: number; scores: Scores };

type GameState = {
  progress: Progress | null;
  saveProgress: (progress: Progress) => void;
  clearProgress: () => void;
};

export const emptyScores = (): Scores => ({ judge: 0, prosecutor: 0, defender: 0 });

/**
 * 진행 저장 스토어. 구독은 셀렉터로 필요한 값만: `useGame((s) => s.progress !== null)`.
 * 저장소 읽기가 막히면(iframe) progress 는 null 로 남아 타이틀에 [재판 시작]만 보인다.
 */
export const useGame = create<GameState>()(
  persist(
    (set) => ({
      progress: null,
      saveProgress: (progress) => set({ progress }),
      clearProgress: () => set({ progress: null }),
    }),
    {
      name: 'wibble-court:save',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ progress: s.progress }),
    },
  ),
);
