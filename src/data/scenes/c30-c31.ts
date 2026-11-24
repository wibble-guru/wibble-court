import type { Scene } from '@/engine/types';

/** 대본 3부 [C30] ~ [C31-C] — 문장은 대본 그대로 */
export const C30_C31: Scene[] = [
  {
    id: 'C30',
    title: '통화 기록 — “그 애를 내보내지 마세요”',
    lines: [
      {
        speaker: '연출',
        text: '법정 조명이 조금 어두워지고 통화 녹음 재생 화면이 켜진다. 원본 통화는 짧고 잡음이 있다.',
        kind: 'direction',
      },
      { speaker: '검사', text: '오후 10시 12분, 경찰관이 피해자의 번호로 전화를 걸었습니다.' },
      { speaker: '녹음 속 강도현', text: '민태성 씨입니까?' },
      { speaker: '상대 음성', text: '네. 무슨 일이죠?' },
      { speaker: '강도현', text: '오지안 씨가 민태성 씨를 죽였다고 자백했습니다.' },
      { speaker: '상대 음성', text: '……지안이가 경찰서에 있다고요? 그 애를 내보내지 마세요.' },
      { speaker: '연출', text: '연결이 끊긴 뒤 2초간 침묵.', kind: 'direction' },
      { speaker: '검사', text: '피해자가 피고인을 경계했다는 해석이 가능합니다.' },
      { speaker: '변호인', text: '피해자가 피고인을 보호하려 했다는 해석도 가능합니다.' },
      { speaker: '검사', text: '그렇다면 그 말의 의미를 무엇으로 판단해야 합니까?' },
      {
        speaker: '변호인',
        text: '말의 뜻을 단정하기 전에, 누가 어떤 상황에서 했는지부터 살펴야 합니다.',
      },
      {
        speaker: '재판장',
        text: '세 쟁점 모두 중요합니다. 다음 기일의 보충 심리에서 우선 다룰 내용을 지정하겠습니다.',
      },
    ],
    prompts: [
      {
        id: 'Q3',
        title: '통화의 어느 불확실성을 우선 줄일 것인가',
        fields: [
          {
            kind: 'choice',
            target: 'q3_call',
            options: [
              {
                key: 'A',
                label: '통화 상대의 신원과 음성 신빙성을 우선 확인한다.',
                cost: '발언의 의도·관계 조사에 투입할 시간이 줄어듦.',
                next: 'C31-A',
              },
              {
                key: 'B',
                label: '피해자와 피고인의 관계 및 발언 맥락을 우선 심리한다.',
                cost: '말한 사람이 실제 피해자인지는 덜 명확한 상태로 남음.',
                next: 'C31-B',
              },
              {
                key: 'C',
                label: '통화 전후 시간표와 사망 확인 경위를 우선 재구성한다.',
                cost: '발언의 의도·음성 신원에 대한 심리가 제한됨.',
                next: 'C31-C',
              },
            ],
          },
        ],
      },
    ],
    gain: ['call-2212'],
    next: 'D40',
  },
  {
    id: 'C31-A',
    title: '음성 검증 우선',
    appearsIf: { key: 'q3_call', eq: 'A' },
    lines: [
      {
        speaker: '감정인',
        text: '통화 상대 목소리는 기존 민태성의 음성 자료와 유사한 특징을 보입니다. 다만 짧은 통화와 잡음 때문에 특정 인물이라고 단정할 수는 없습니다.',
      },
      { speaker: '검사', text: '피해자일 가능성이 높다는 뜻입니까?' },
      {
        speaker: '감정인',
        text: '유사성이 있다는 것입니다. 확률 수치를 단정적으로 제시하기 어렵습니다.',
      },
      {
        speaker: '변호인',
        text: '그렇다면 사건 당일 피해자가 생존 상태로 통화했다는 점도 완전히 확정되지는 않는군요.',
      },
      { speaker: '감정인', text: '이 음성만으로는 그렇습니다.' },
      { speaker: '재판장', text: '유사성과 신원 확정은 구분하겠습니다.' },
    ],
    mutation: {
      call_fact: 'VOICE_SIMILAR_NOT_IDENTIFIED',
    },
    gain: ['voice-analysis'],
    next: 'D40',
  },
  {
    id: 'C31-B',
    title: '관계·맥락 우선',
    appearsIf: { key: 'q3_call', eq: 'B' },
    lines: [
      {
        speaker: '변호인',
        text: "피해자의 업무용 계정에 오지안 앞으로 쓰다 만 메일이 남아 있었습니다. '그 사람이 누구든 혼자 만나지 마'라는 내용입니다.",
      },
      { speaker: '검사', text: '작성자가 피해자라는 점은 검증되었습니까?' },
      {
        speaker: '변호인',
        text: '피해자 계정에 저장된 것은 맞지만, 작성 과정의 모든 경위는 확인되지 않았습니다.',
      },
      {
        speaker: '검사',
        text: '그렇다면 그 문장이 피고인을 보호하려는 말이었는지도 확정할 수 없습니다.',
      },
      {
        speaker: '변호인',
        text: '그렇습니다. 하지만 ‘내보내지 말라’는 말을 위협의 증거라고 단정할 수도 없습니다.',
      },
      { speaker: '재판장', text: '어느 해석도 사실로 확정하지 않겠습니다.' },
    ],
    mutation: {
      call_fact: 'RELATION_AMBIGUOUS',
    },
    gain: ['email-draft'],
    next: 'D40',
  },
  {
    id: 'C31-C',
    title: '시간표 우선',
    appearsIf: { key: 'q3_call', eq: 'C' },
    lines: [
      {
        speaker: '검사',
        text: '22시 12분에 통화가 연결됐고, 22시 20분에 피해자가 사망한 채 발견됐습니다.',
      },
      {
        speaker: '변호인',
        text: "'22시 20분에 사망했다'는 표현은 사용하지 마십시오. 발견된 시각일 뿐입니다.",
      },
      { speaker: '감정인', text: '현재 자료로 정확한 사망 시점은 특정할 수 없습니다.' },
      { speaker: '검사', text: '그래도 통화 시각과 발견 시각은 확인되는군요.' },
      {
        speaker: '감정인',
        text: '그렇습니다. 다만 녹음 속 음성의 주체를 검증하지 않은 상태에서 생존 시점을 바로 도출할 수는 없습니다.',
      },
      { speaker: '재판장', text: '발견 시각을 사망 시각처럼 취급하지 않겠습니다.' },
    ],
    mutation: {
      call_fact: 'TIMELINE_AMBIGUOUS',
      time_reveal_early: true,
    },
    gain: ['timeline'],
    next: 'D40',
  },
];
