/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** init을 받아도 되는 사이트 origin 목록 (쉼표 구분). 비우면 제한 없음 */
  readonly VITE_ALLOWED_HOST_ORIGINS?: string;
}
