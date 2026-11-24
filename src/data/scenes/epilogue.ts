import type { Scene } from '@/engine/types';

/** 대본 4부 [EPILOGUE] (결과 화면 뒤, 진실 공개 전) — 문장은 대본 그대로 */
export const EPILOGUE: Scene[] = [
  {
    id: 'EPILOGUE',
    title: '판결 당시의 미해결 기록',
    lines: [
      {
        speaker: '화면',
        text: '‘재판 이후’라는 제목 아래 사건 기록 세 장이 차례로 지나간다.',
        kind: 'direction',
      },
      { speaker: '경찰서 체류 영상', text: '오지안은 자백 이후 경찰서를 떠나지 않았다.' },
      {
        speaker: '익명 연락',
        text: '메시지의 존재 또는 일부 흔적은 확인되었지만 실제 발신자의 정체는 확정되지 않았다.',
      },
      {
        speaker: '22:20',
        text: '사망 확인·발견 시각이다. 정확한 사망 시각, 통화 상대, 당시 사건의 전체 경위에 관한 의문은 남는다.',
      },
      {
        speaker: '내레이션',
        text: '판결 당시의 자료로는 이 물음들이 남아 있었다. 그러나 재판이 끝난 뒤에도 사건 조사는 계속되었다.',
      },
      { speaker: '마지막 화면', text: '**이것이 당시 법정이 알 수 있었던 사실의 전부입니다.**' },
      { speaker: '마지막 화면', text: '그런데, 재판이 끝난 뒤 새로운 자료가 발견되었습니다.' },
    ],
    next: 'TRUTH-GATE',
  },
];
