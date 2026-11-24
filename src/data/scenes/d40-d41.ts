import type { Scene } from '@/engine/types';

/** 대본 3부 [D40] ~ [D41-C] — 문장은 대본 그대로 */
export const D40_D41: Scene[] = [
  {
    id: 'D40',
    title: '보호받아야 할 증인인가, 검증되어야 할 증인인가',
    lines: [
      {
        speaker: '변호인',
        text: '앞서 자백 녹음에서 언급된 사람의 신원은 이미 공개되었습니다. 하지만 지금 신청하는 제보자가 그 사람과 동일인이라는 근거는 없습니다. 또 다른 증인을 같은 방식으로 노출해서는 안 됩니다.',
        when: { key: 'audio_policy', eq: 'PUBLIC' },
      },
      {
        speaker: '검사',
        text: '앞서 보호한 인물과 지금의 X가 같은 사람인지조차 알 수 없습니다. 관계 검증에 한계가 있다는 점을 기억해 주십시오.',
        when: { key: 'audio_policy', eq: 'PROTECTED' },
      },
      {
        speaker: '변호인',
        text: '핵심 녹음도 보류된 상태이므로 이 증인의 진술이 피고인에게 유일한 설명 통로가 될 수 있습니다.',
        when: { key: 'audio_policy', eq: 'DEFER' },
      },
      {
        speaker: '연출',
        text: '변호인이 봉인된 진술서를 제출한다. 증인 정보는 공개 화면에서 가려져 있다. 이 증인은 자백 녹음에서 오지안이 언급한 사람과 **동일인이라는 확인이 없다.**',
        kind: 'direction',
      },
      {
        speaker: '변호인',
        text: '참고인 X는 사건 발생 전날 피고인이 누군가의 압박을 받고 있었다고 말합니다. 다만 자신의 신원이 드러나는 순간 직장과 생활에 피해가 올 수 있다고 우려하고 있습니다.',
      },
      {
        speaker: '검사',
        text: "참고인의 주장이 사실인지 확인하려면 그 사람이 사건에 어느 정도 접근할 수 있었는지 알아야 합니다. 그 사실을 모르는 상태에서 '압박을 받았다'는 주장만 들을 수는 없습니다.",
      },
      {
        speaker: '변호인',
        text: '제보자는 본인도 사건의 일부를 직접 보지 못했다고 인정합니다. 그럼에도 알고 있는 사실만큼은 말하려 합니다.',
      },
      {
        speaker: '검사',
        text: '그렇다면 제보자의 신원, 피고인과의 관계, 지식의 출처를 검증할 수 있어야 합니다.',
      },
      { speaker: '변호인', text: '신원 공개가 곧 증언의 전제조건이라는 말씀입니까?' },
      { speaker: '검사', text: '아닙니다. 하지만 반대신문할 권리까지 비워둘 수 없다는 뜻입니다.' },
      {
        speaker: '재판장',
        text: '필요한 심문과 증인 보호를 어느 범위에서 병행할 것인지 정하겠습니다.',
      },
    ],
    prompts: [
      {
        id: 'Q4',
        title: '익명 참고인의 진술 방식',
        fields: [
          {
            kind: 'choice',
            target: 'q4_witness',
            options: [
              {
                key: 'A',
                label: '양측의 폭넓은 신빙성 검증을 우선한다.',
                note: '참고인의 신원·이해관계에 관한 질문 기회를 넓힌다. 보호조치는 유지하되 확인 범위가 더 넓어진다.',
                benefit: '진술의 출처와 이해관계를 꼼꼼히 확인.',
                cost: '증인의 협조 축소 및 신원 노출 위험 증가.',
                next: 'D41-A',
              },
              {
                key: 'B',
                label: '보호된 형태로 진술을 허용하되 검증의 한계를 판결에 반영한다.',
                note: '제한된 정보는 법원과 양측 대리인이 법에 허용되는 범위에서 확인한다.',
                benefit: '진술 기회를 살림.',
                cost: '일부 관계를 공개적으로 검증하기 어렵다.',
                next: 'D41-B',
              },
              {
                key: 'C',
                label: '충분한 검증이 가능해질 때까지 해당 진술의 증거조사를 보류한다.',
                benefit: '확인하기 어려운 주장을 핵심 증거로 삼지 않음.',
                cost: '중요한 정황이 현재 변론에서 빠질 수 있음.',
                next: 'D41-C',
              },
            ],
          },
        ],
      },
    ],
    gain: ['x-statement'],
    next: 'E50',
  },
  {
    id: 'D41-A',
    title: '검증 범위를 넓힌다',
    appearsIf: { key: 'q4_witness', eq: 'A' },
    lines: [
      {
        speaker: '재판장',
        text: '증인의 신빙성과 피고인과의 관계에 대한 질문을 허용하겠습니다. 불필요한 개인정보는 공개하지 마십시오.',
      },
      { speaker: '검사', text: '참고인, 피고인이 협박을 받고 있었다는 말을 직접 들었습니까?' },
      {
        speaker: '제보자 X',
        text: "피고인이 '누군가가 시키는 대로 해야 한다'고 말한 적은 있습니다.",
      },
      { speaker: '검사', text: '누구에게서 어떤 위협을 받았다는 것인지 직접 확인했습니까?' },
      { speaker: '제보자 X', text: '직접 본 건 아닙니다.' },
      { speaker: '변호인', text: '그렇다면 증인이 직접 들은 말은 존재한다는 것이군요.' },
      { speaker: '제보자 X', text: '그렇습니다.' },
      { speaker: '검사', text: '그러나 그 말을 한 목적까지 증인이 알 수는 없습니다.' },
      {
        speaker: '연출',
        text: '질문 범위가 넓어졌다는 사실에 참고인은 이후 상세 면담에 응하지 않겠다고 통보한다. 이는 진범의 신호가 아니라 협조 범위의 변화다.',
        kind: 'direction',
      },
    ],
    mutation: {
      witness_policy: 'BROAD_EXAM',
      x_statement: 'DIRECT_WORDS_ONLY',
      x_followup: 'REFUSED',
    },
    next: 'E50',
  },
  {
    id: 'D41-B',
    title: '보호와 검증을 병행한다',
    appearsIf: { key: 'q4_witness', eq: 'B' },
    lines: [
      {
        speaker: '재판장',
        text: '신원 보호가 필요한 범위를 유지하면서 양측의 질문 기회를 보장하겠습니다. 확인되지 않은 신빙성 부분은 별도로 표시합니다.',
      },
      { speaker: '검사', text: '피고인이 실제로 협박받는 장면을 보았습니까?' },
      {
        speaker: '제보자 X',
        text: '아니요. 피고인이 어떤 메시지를 보고 두려워하는 모습을 봤습니다.',
      },
      { speaker: '변호인', text: '증인이 본 것은 피고인이 실제로 두려워했다는 점이군요.' },
      { speaker: '검사', text: '두려워 보였다는 인상이지, 협박의 존재를 입증한 건 아닙니다.' },
      { speaker: '재판장', text: '그 구별을 기록합니다.' },
      {
        speaker: '연출',
        text: '보호 조건으로 참고인은 후속 설명에 협조한다. 다만 상대가 누구였는지는 알지 못한다고 한다.',
        kind: 'direction',
      },
    ],
    mutation: {
      witness_policy: 'PROTECTED_EXAM',
      x_statement: 'OBSERVED_FEAR',
      x_followup: 'AVAILABLE',
    },
    next: 'E50',
  },
  {
    id: 'D41-C',
    title: '진술 심리를 보류한다',
    appearsIf: { key: 'q4_witness', eq: 'C' },
    lines: [
      {
        speaker: '재판장',
        text: '검증할 수 있는 범위가 확보되기 전에는 이 진술에 실질적 무게를 두지 않겠습니다. 후속 심리 가능성은 열어두겠습니다.',
      },
      {
        speaker: '검사',
        text: '현재 상태에서 제보자의 주장은 핵심 증거로 사용할 수 없다는 뜻이군요.',
      },
      { speaker: '변호인', text: '동시에 제보자의 주장이 거짓이라는 뜻도 아닙니다.' },
      {
        speaker: '재판장',
        text: '맞습니다. 확인하지 못한 것과 사실이 아니라고 확인한 것은 다릅니다.',
      },
      { speaker: '오지안', text: '그 사람이 나오면 알 수 있을 줄 알았는데…….' },
      { speaker: '검사', text: '피고인의 기대와 증거의 신뢰성은 별개입니다.' },
    ],
    mutation: {
      witness_policy: 'DEFER_EXAM',
      x_statement: 'NOT_HEARD',
      x_followup: 'UNKNOWN',
    },
    next: 'E50',
  },
];
