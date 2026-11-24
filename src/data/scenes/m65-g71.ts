import type { Scene } from '@/engine/types';

/** 대본 3부 [M65] ~ [G71-C] — 문장은 대본 그대로 */
export const M65_G71: Scene[] = [
  {
    id: 'M65',
    title: '중간 판단 기록 + 사고 기준 질문(QM) — 법정 밖의 플레이어 메모',
    lines: [],
    prompts: [
      {
        id: 'M65',
        title: '중간 판단 기록 + 사고 기준 질문(QM) — 법정 밖의 플레이어 메모',
        memo: '재판이 절반을 지났습니다. 지금의 생각이 시작과 같은가요?',
        fields: [
          {
            kind: 'choice',
            target: 'impression_mid',
            label: '현재 더 그럴듯하게 느끼는 설명',
            options: [
              { key: 'A', label: '공모' },
              { key: 'B', label: '강요' },
              { key: 'C', label: '기록 해석 문제' },
              { key: 'D', label: '결정할 수 없음' },
            ],
          },
          {
            kind: 'slider',
            target: 'guilt_probability_mid',
            label: '살인 공모 혐의가 유죄로 입증될 가능성',
            initial: 50,
          },
          {
            kind: 'slider',
            target: 'confidence_mid',
            label: '현재 판단에 대한 확신',
            initial: 50,
          },
          {
            kind: 'choice',
            target: 'anchor_mid',
            label: '가장 큰 영향을 준 증거 하나',
            options: [
              { key: 'A', label: '자백' },
              { key: 'B', label: '목격자' },
              { key: 'C', label: '통화' },
              { key: 'D', label: '제보자' },
              { key: 'E', label: '문자' },
              { key: 'F', label: '다툼' },
              { key: 'G', label: '해당 없음' },
            ],
          },
        ],
      },
    ],
    next: 'QM',
  },
  {
    id: 'QM',
    title: '내 판단을 바꿀 만한 근거는 무엇인가? — 내부 판단 기록',
    lines: [],
    prompts: [
      {
        id: 'QM',
        title: '내 판단을 바꿀 만한 근거는 무엇인가? — 내부 판단 기록',
        memo: '검사와 변호인이 서로 그럴듯한 설명을 한다. 그중 하나가 당신을 실제로 설득하려면 무엇이 더 필요할까?',
        fields: [
          {
            kind: 'choice',
            target: 'qm_basis',
            options: [
              {
                key: 'A',
                label:
                  '통화 시각·원본 파일·감정 결과처럼 **누구나 재확인할 수 있는 자료**가 보강되어야 한다.',
              },
              {
                key: 'B',
                label:
                  '확인된 사실에서 왜 **살인 공모라는 결론**이 나오는지 논리적 연결이 빈틈없이 설명되어야 한다.',
              },
              {
                key: 'C',
                label:
                  '피고인과 피해자가 **왜 그런 선택을 했는지** 당시 관계와 압박의 맥락이 더 드러나야 한다.',
              },
              {
                key: 'D',
                label:
                  '어느 한쪽에만 유리하지 않게 **양측이 같은 기준으로 검증할 기회**를 보장받아야 한다.',
              },
            ],
          },
        ],
      },
    ],
    next: 'G70',
  },
  {
    id: 'G70',
    title: '핵심 전제 붕괴 — 죽은 시각이 아니라 발견된 시각',
    lines: [
      {
        speaker: '연출',
        text: "검사가 사건 시간표를 설명하던 중, 변호인이 화면의 한 줄을 확대한다. 기존 자료에서 '사망 발견 22:20'이 익숙하게 반복됐지만, 내레이션은 자연스럽게 '22:20에 죽었다'고 받아들이기 쉬운 상태였다.",
        kind: 'direction',
      },
      {
        speaker: '검사',
        text: '피고인은 10시 8분 자백했고, 10시 20분 피해자는 숨진 채 발견됐습니다.',
      },
      {
        speaker: '변호인',
        text: "방금 말씀하신 표현을 정확히 기록해 주십시오. '10시 20분에 사망'이 아니라 '10시 20분에 발견'입니다.",
      },
      { speaker: '검사', text: '그 차이를 부정하지 않습니다.' },
      {
        speaker: '변호인',
        text: '그렇다면 피고인이 사망한 **정확한 시각**을 맞혔다고는 주장하실 수 없겠군요.',
      },
      {
        speaker: '검사',
        text: '피고인이 장소와 시간대를 예측했다는 사실까지 사라지는 것은 아닙니다.',
      },
      {
        speaker: '재판장',
        text: '양측 주장을 정확히 구분하겠습니다. 발견 시각은 22시 20분입니다. 사망 시각은 별도로 검증이 필요합니다.',
      },
      { speaker: '검사', text: '통화 기록, 문자 기록, 사망 추정 범위를 종합해 판단해야 합니다.' },
      { speaker: '변호인', text: '동의합니다. 다만 그 자료들이 모두 완벽한 것은 아닙니다.' },
      {
        speaker: '재판장',
        text: '이 부분은 앞선 심리에서도 확인했습니다. 이제 그 차이가 공모 혐의에 어떤 의미를 갖는지 묻겠습니다.',
        when: { key: 'time_reveal_early', eq: true },
      },
      {
        speaker: '재판장',
        text: '발견 시각과 사망 시각을 혼동하지 않도록 시간표를 정정하십시오.',
        when: { key: 'time_reveal_early', eq: false },
      },
    ],
    prompts: [
      {
        id: 'QG',
        title: '전제가 흔들렸을 때, 무엇부터 다시 생각하겠습니까?',
        memo: "'22시 20분에 죽었다'고 믿었던 것은 잘못된 표현이었다. 새 사실을 접한 지금, 어느 판단부터 수정해야 할까?",
        fields: [
          {
            kind: 'choice',
            target: 'qg_reconsider',
            options: [
              {
                key: 'A',
                label:
                  '정확한 시각과 자료의 작성 경위. **숫자와 기록의 정확성을 확인**하지 않으면 다른 결론도 불안정하다.',
              },
              {
                key: 'B',
                label:
                  '"정확히 예측했다 → 공모했다"라는 **추론의 연결**. 시간표가 흔들리면 인과 설명도 다시 세워야 한다.',
              },
              {
                key: 'C',
                label:
                  '피고인의 자백과 피해자의 말이 **어떤 상황에서 나왔는지**. 시간에 대한 오해로 사람의 의도도 다르게 읽었을 수 있다.',
              },
              {
                key: 'D',
                label:
                  '지금까지 무엇을 사실로 채택해 양측에 어떤 기준을 적용했는지. **판단의 공정한 기준**부터 재점검한다.',
              },
            ],
          },
        ],
      },
      {
        id: 'Q7',
        title: '보충 심리의 우선순위',
        memo: '당일 추가 감정에 필요한 협조 인력을 **우선 배정할 수 있는 분야는 한 가지**다. 다른 분야도 가능하지만 보고가 늦고 이 기일의 최후 변론에서는 활용되지 못할 수 있다.',
        fields: [
          {
            kind: 'choice',
            target: 'q7_priority',
            options: [
              {
                key: 'A',
                label: '사망 추정 시간 범위를 우선 확인한다.',
                benefit: '사건의 기본 시간표 정교화.',
                cost: '통화자의 신원과 문자 출처 검증이 늦어짐.',
                next: 'G71-A',
              },
              {
                key: 'B',
                label: '통화 음성의 출처·동일성을 우선 검토한다.',
                benefit: '22:12 대화가 생존의 증거인지 더 면밀히 검토.',
                cost: '실제 사망 시간의 폭은 그대로 남음.',
                next: 'G71-B',
              },
              {
                key: 'C',
                label: '익명 메시지의 시각·전송 경위를 우선 검토한다.',
                benefit: '범행 예고와 피고인 행동의 연결을 더 직접 검증.',
                cost: '생존 여부와 사망 시각은 확정되지 않음.',
                next: 'G71-C',
              },
            ],
          },
        ],
      },
    ],
    next: 'H80',
  },
  {
    id: 'G71-A',
    title: '시간 범위 검토',
    appearsIf: { key: 'q7_priority', eq: 'A' },
    lines: [
      {
        speaker: '감정인',
        text: '현재 자료만으로 사망 시각을 분 단위로 특정하기 어렵습니다. 통화 시점 전후 어느 순간인지도, 통화자의 신원이 확정되지 않은 이상 단정하기 어렵습니다.',
      },
      {
        speaker: '검사',
        text: '그럼 피고인이 시간을 미리 알았다는 검찰 주장이 틀렸다는 뜻입니까?',
      },
      {
        speaker: '감정인',
        text: '그런 법적 결론을 내린 것은 아닙니다. 발견 시각만으로 예고의 정확도를 입증할 수 없다는 뜻입니다.',
      },
      {
        speaker: '변호인',
        text: "피고인이 '22시 20분에 죽는다'고 정확히 예견했다는 인상은 약해졌습니다.",
      },
      {
        speaker: '검사',
        text: '피고인이 사망 장소와 시간대에 대한 구체적 정보를 갖고 있었다는 점은 여전합니다.',
      },
      {
        speaker: '재판장',
        text: "두 진술 모두 기록합니다. 다만 '시간을 맞혔다'는 표현은 유보합니다.",
      },
    ],
    mutation: {
      priority_evidence: 'DEATH_WINDOW',
      death_time: 'UNRESOLVED',
    },
    next: 'H80',
  },
  {
    id: 'G71-B',
    title: '통화 음성 정밀 검토',
    appearsIf: { key: 'q7_priority', eq: 'B' },
    lines: [
      {
        speaker: '감정인',
        text: '통화 상대의 음성은 피해자의 평소 목소리와 유사합니다. 다만 발언이 짧고 녹음 상태가 일정하지 않아 단일 화자라고 확정할 수 없습니다.',
      },
      { speaker: '검사', text: '합성이나 녹음 재생의 흔적이 확인됐습니까?' },
      {
        speaker: '감정인',
        text: '확인되지 않았습니다. 그러나 확인되지 않았다는 것이 그런 가능성이 없다는 뜻은 아닙니다.',
      },
      {
        speaker: '변호인',
        text: '그렇다면 피해자가 10시 12분에 살아 있었다고 완전히 확정할 수도 없겠군요.',
      },
      { speaker: '감정인', text: '이 자료 하나만으로는 단정하기 어렵습니다.' },
      { speaker: '검사', text: '동시에 다른 사람이었다고 입증된 것도 아닙니다.' },
      { speaker: '재판장', text: '맞습니다. 긍정도 부정도 확정되지 않았습니다.' },
    ],
    mutation: {
      priority_evidence: 'VOICE',
      voice_identity: 'UNRESOLVED',
    },
    next: 'H80',
  },
  {
    id: 'G71-C',
    title: '메시지 전송 경위 검토',
    appearsIf: { key: 'q7_priority', eq: 'C' },
    lines: [
      {
        speaker: '감정인',
        text: '피고인 기기에 메시지가 도착한 흔적과 시각은 확인됩니다. 다만 송신자가 누구인지, 사건 장소에서 전송됐는지는 이 자료로 확인할 수 없습니다.',
      },
      { speaker: '검사', text: '즉 피고인은 사건 전부터 누군가와 연락했습니다.' },
      { speaker: '감정인', text: '그 사실은 확인됩니다.' },
      {
        speaker: '변호인',
        text: '그 사람이 살인을 공모한 상대인지, 피고인을 위협한 상대인지는요?',
      },
      { speaker: '감정인', text: '알 수 없습니다.' },
      { speaker: '검사', text: '수신 내용이 사전에 작성된 것인지도 알 수 없습니까?' },
      { speaker: '감정인', text: '동일 문구가 언제 작성됐는지까지는 특정하기 어렵습니다.' },
      { speaker: '재판장', text: '연락의 존재와 발신자의 의도를 혼동하지 않겠습니다.' },
    ],
    mutation: {
      priority_evidence: 'MESSAGE_TRACE',
      sender_identity: 'UNKNOWN',
    },
    next: 'H80',
  },
];
