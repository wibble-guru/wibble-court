import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SceneId, StoryState } from '@/engine/types';
import { safeStorage } from '@/lib/safe-storage';

/** 이어하기용 저장: 보고 있던 장면·대사 위치와 그때까지의 진행 상태 */
export type StorySave = { sceneId: SceneId; lineIndex: number; state: StoryState };

type StoryStore = {
  save: StorySave | null;
  saveStory: (save: StorySave) => void;
  clearStory: () => void;
};

/**
 * 대본 진행 저장소. 구독은 셀렉터로 필요한 값만: `useStory((s) => s.save !== null)`.
 * 저장소 접근이 막히면(iframe 서드파티 저장소 차단 등) safeStorage 가 예외를 삼켜
 * 이어하기만 없어지고 게임은 계속된다.
 */
export const useStory = create<StoryStore>()(
  persist(
    (set) => ({
      save: null,
      saveStory: (save) => set({ save }),
      clearStory: () => set({ save: null }),
    }),
    {
      name: 'wibble-court:story',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ save: s.save }),
    },
  ),
);
