/** 타이틀 화면 문구. 기획에서 받은 문구만 쓴다 — 새로 만들지 않는다. */
export const TITLE_COPY = {
  logline: '제가 민태성을 죽였습니다.',
  /** 게임 이름 (큰 제목) */
  title: '12분 앞선 자백',
  /** 월계수 플레이트 위 문구 */
  subtitle: '당신의 머릿속 법정',
  info: '법정 스릴러 × 판단 성향 테스트 · 약 18~25분',
  start: '재판 시작',
  continue: '이어서 하기',
  restart: '처음부터',
  restartConfirm: {
    message: '저장된 진행 기록이 지워집니다. 처음부터 시작할까요?',
    confirm: '시작하기',
    cancel: '취소',
  },
  hint: '화면을 클릭하거나 Enter 키를 눌러 시작',
} as const;
