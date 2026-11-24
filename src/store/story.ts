import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Play } from '@/features/play/runner';
import { safeStorage } from '@/lib/safe-storage';

/** 이어하기용 저장: 보고 있던 장면의 대사·질문 위치와 그때까지의 진행 상태 */
export type StorySave = Play;

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
      // 2: 저장 위치를 대사 번호에서 커서(대사/질문)로 바꿈. 이전 형식은 버리고 처음부터
      version: 2,
      migrate: () => ({ save: null }),
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ save: s.save }),
    },
  ),
);
