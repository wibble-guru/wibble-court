import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage 를 try/catch 로 감싼 저장소.
 * 사이트 iframe 안에서는 브라우저 설정(서드파티 저장소 차단 등)에 따라 localStorage 접근 자체가 예외를 던질 수 있다.
 * 읽기에 실패하면 "저장 없음"(null)으로, 쓰기에 실패하면 조용히 넘어간다.
 */
export const safeStorage: StateStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // 저장 못 해도 게임은 계속한다
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 지울 수 없으면 그대로 둔다
    }
  },
};
