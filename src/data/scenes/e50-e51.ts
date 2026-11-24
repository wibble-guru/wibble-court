import type { Scene } from '@/engine/types';

/** 대본 3부 [E50] ~ [E51-C] — 문장은 대본 그대로 */
export const E50_E51: Scene[] = [
  {
    id: 'E50',
    title: '“약속대로 할게” — 사실이지만 뜻은 모른다',
    lines: [
      {
        speaker: '연출',
        text: '피고인의 휴대전화에 남은 대화 캡처가 스크린에 보인다. 발신번호는 특정되지 않았다. 등장인물 중 누구의 이름도 표시하지 않는다.',
        kind: 'direction',
      },
      {
        speaker: '검사',
        text: '사건 당일 21시 59분, 피고인은 알 수 없는 상대방으로부터 메시지를 받습니다.',
      },
      { speaker: '화면 / 발신자 불명', text: '네가 경찰서에 가면, 그 뒤에는 아무 일도 없을 거야.' },
      { speaker: '화면 / 오지안, 22:00', text: '알았어. 약속은 지켜. 그 사람은 건드리지 마.' },
      { speaker: '검사', text: "'약속'이라는 표현은 양측이 어떤 계획을 공유했음을 보여줍니다." },
      {
        speaker: '변호인',
        text: '혹은 피고인이 누군가의 요구에 응하면서 피해자의 안전을 구걸한 것일 수도 있습니다.',
      },
      { speaker: '검사', text: "문자 자체에 '협박'이라는 단어가 있습니까?" },
      { speaker: '변호인', text: "'그 사람은 건드리지 마'라는 말은 무엇을 뜻한다고 생각하십니까?" },
      { speaker: '검사', text: '그게 바로 다툼의 대상입니다.' },
      {
        speaker: '재판장',
        text: '검증해야 할 것은 둘입니다. 그 기록이 실제인지, 그 기록이 무엇을 의미하는지.',
      },
    ],
    prompts: [
      {
        id: 'Q5',
        title: '제한된 심리 시간 동안 어떤 접근을 우선할 것인가',
        fields: [
          {
            kind: 'choice',
            target: 'q5_sms',
            options: [
              {
                key: 'A',
                label: '기기 원본과 메시지 기록의 생성 여부부터 검증한다.',
                benefit: '조작·발췌 가능성을 줄인다.',
                cost: '관계·대화 맥락 심리가 늦어진다.',
                next: 'E51-A',
              },
              {
                key: 'B',
                label: '대화 당사자의 관계와 발언 전후 맥락을 먼저 심문한다.',
                benefit: '같은 문장의 다른 의미를 탐색한다.',
                cost: '아직 확인되지 않은 문자 기록을 이야기의 출발점으로 삼는 위험.',
                next: 'E51-B',
              },
              {
                key: 'C',
                label:
                  '현 단계에서는 연락 사실만 제한적으로 평가하고 공모·강요 어느 쪽으로도 단정하지 않는다.',
                benefit: '불확실한 해석을 핵심 근거로 사용하지 않음.',
                cost: '중요한 동기 설명을 충분히 다루지 못할 수 있음.',
                next: 'E51-C',
              },
            ],
          },
        ],
      },
    ],
    gain: ['anon-messages'],
    next: 'F60',
  },
  {
    id: 'E51-A',
    title: '원본 검증',
    appearsIf: { key: 'q5_sms', eq: 'A' },
    lines: [
      {
        speaker: '감정인',
        text: '피고인 휴대전화에 해당 문구를 포함한 대화 흔적은 남아 있습니다. 수신 시각도 대체로 일치합니다. 그러나 발신자의 실제 신원은 확인하지 못했습니다.',
      },
      { speaker: '검사', text: '연락이 실제로 있었다는 사실은 확인되는군요.' },
      {
        speaker: '감정인',
        text: '네. 다만 상대방이 누구인지, 어떤 목적이었는지는 이 자료로 알 수 없습니다.',
      },
      {
        speaker: '변호인',
        text: '그럼 메시지가 존재한다는 것과 공모가 있었다는 것은 별개의 명제겠군요.',
      },
      { speaker: '검사', text: '연락과 계획의 정황으로 평가할 수는 있습니다.' },
      { speaker: '재판장', text: '검증된 범위를 넘는 단정은 자제하십시오.' },
    ],
    mutation: {
      sms_fact: 'DEVICE_TRACE_PRESENT',
      sms_context: 'LIMITED',
    },
    gain: ['message-forensics'],
    next: 'F60',
  },
  {
    id: 'E51-B',
    title: '관계와 맥락 심문',
    appearsIf: { key: 'q5_sms', eq: 'B' },
    lines: [
      { speaker: '변호인', text: "오지안 씨. '약속'이 무엇이었습니까?" },
      {
        speaker: '오지안',
        text: '제가 경찰서에 가서 거짓말하면 민태성 PD님을 건드리지 않겠다는 말이었습니다.',
      },
      { speaker: '검사', text: '그 말을 실제로 누가 했습니까?' },
      { speaker: '오지안', text: '모릅니다. 계속 익명으로 연락했어요.' },
      { speaker: '검사', text: '그럼 상대방이 약속을 지킬 거라고 믿을 이유도 없었습니까?' },
      { speaker: '오지안', text: '믿을 수는 없었어요. 그래도 다른 방법이 없다고 생각했습니다.' },
      {
        speaker: '검사',
        text: '그럴 듯한 설명입니다. 하지만 아직 피고인의 설명이라는 사실은 변하지 않습니다.',
      },
      { speaker: '재판장', text: '피고인 진술의 일관성과 외부 정황을 함께 살펴야 합니다.' },
    ],
    mutation: {
      sms_fact: 'DEFENDANT_EXPLANATION',
      sms_context: 'EXPLORED',
      sms_sender: 'UNKNOWN',
    },
    next: 'F60',
  },
  {
    id: 'E51-C',
    title: '의미를 제한한다',
    appearsIf: { key: 'q5_sms', eq: 'C' },
    lines: [
      {
        speaker: '재판장',
        text: '문구만으로 공모나 강요를 확정하지 않겠습니다. 현재로서는 피고인이 누군가와 연락했다는 범위에서 평가하겠습니다.',
      },
      {
        speaker: '검사',
        text: '사건 직전에 상대와 행동을 조율한 정황이라고는 평가할 수 있습니까?',
      },
      {
        speaker: '재판장',
        text: '어느 정도의 정황인지 다른 증거와 함께 검토합니다. 합의를 인정한 것은 아닙니다.',
      },
      {
        speaker: '변호인',
        text: '변호인도 협박이 확정됐다고 주장하지 않겠습니다. 다만 강요 가능성을 배제해서는 안 됩니다.',
      },
      { speaker: '검사', text: '그 점에는 동의합니다.' },
      {
        speaker: '연출',
        text: '검사가 처음으로 변호인의 한 문장에 동의한다. 둘 다 이 자료가 모호하다는 것을 알고 있다.',
        kind: 'direction',
      },
    ],
    mutation: {
      sms_fact: 'CONTACT_ONLY',
      sms_context: 'UNTESTED',
    },
    next: 'F60',
  },
];
