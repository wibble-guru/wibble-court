import type { Scene } from '@/engine/types';

/** 대본 3부 [P00] ~ [A11-C] — 문장은 대본 그대로 */
export const P00_A11: Scene[] = [
  {
    id: 'P00',
    title: '개정 — 12분 앞선 자백',
    lines: [
      {
        speaker: '연출',
        text: '어두운 법정. 재판장이 들어오면 모두 기립한다. 카메라는 검사→변호인→피고인→비어 있는 증인석 순으로 움직인다. 배경 음악은 최소화한다.',
        kind: 'direction',
      },
      { speaker: '법원 직원', text: '모두 일어나 주십시오.' },
      {
        speaker: '재판장(플레이어)',
        text: '앉으십시오. 피고인 오지안에 대한 사건 심리를 시작하겠습니다. 검사는 공소사실을 말씀하십시오.',
      },
      {
        speaker: '검사 차윤호',
        text: '피고인은 11월 14일 밤, 피해자 민태성의 사망을 미리 알고 있었습니다. 그 사실을 스스로 경찰에게 말했습니다. 검찰은 피고인이 신원을 알 수 없는 제3자와 범행을 공모한 것으로 보고 있습니다.',
      },
      {
        speaker: '변호인 문하경',
        text: '피고인은 자신이 살인범이라고 거짓말한 사실을 인정합니다. 그러나 거짓 자백과 살인 공모는 같은 범죄가 아닙니다. 검찰은 피고인이 실제로 공모했다는 사실을 입증해야 합니다.',
      },
      { speaker: '검사', text: '피고인은 어떻게 사망 장소를 알았습니까?' },
      { speaker: '변호인', text: '그 질문에는 검찰도 답하지 못하고 있습니다.' },
      { speaker: '검사', text: '그래서 이 법정에서 확인할 겁니다.' },
      { speaker: '재판장', text: '양측 주장을 들었습니다. 증거조사를 진행하겠습니다.' },
    ],
    prompts: [
      {
        id: 'Q0',
        title: '최초 생각 기록 — 공개되지 않는 내부 질문',
        fields: [
          {
            kind: 'choice',
            target: 'impression_start',
            options: [
              { key: 'A', label: '공모 가능성이 더 높아 보인다.' },
              { key: 'B', label: '아직 어느 쪽도 판단하기 어렵다.' },
              { key: 'C', label: '거짓 자백으로 피해자를 보호하려 했을 가능성이 더 높아 보인다.' },
            ],
          },
          {
            kind: 'slider',
            target: 'confidence_start',
            label: '현재 판단에 대한 확신 0~100',
            initial: 50,
          },
        ],
      },
    ],
    next: 'A10',
  },
  {
    id: 'A10',
    title: '첫 번째 이의 — “모두가 들어야 할 진실인가?”',
    lines: [
      {
        speaker: '연출',
        text: '검사 측 화면에 ‘자백 녹음 03:17’이라는 파일이 표시된다.',
        kind: 'direction',
      },
      { speaker: '검사', text: '피고인의 최초 자백을 듣겠습니다.' },
      { speaker: '녹음 속 오지안', text: '제가 민태성을 죽였습니다.' },
      { speaker: '검사', text: '피고인이 스스로 범행을 인정한 첫 문장입니다.' },
      { speaker: '변호인', text: '이의 있습니다. 전체 3분 17초 중 다섯 초만 재생되었습니다.' },
      { speaker: '검사', text: '필요하면 전부 재생하면 됩니다.' },
      {
        speaker: '변호인',
        text: '그 녹음에는 이 사건의 핵심 참고인으로 추정되는 제3자의 신원이 포함돼 있습니다. 해당 인물은 이미 신변 보호를 요청했습니다. 무제한 공개는 증인에게 불이익을 줄 수 있습니다.',
      },
      {
        speaker: '검사',
        text: '그 사람의 정체가 공모 여부를 판단하는 핵심일 수도 있습니다. 공개 법정에서 제대로 검증할 수 있어야 합니다.',
      },
      { speaker: '변호인', text: '동일한 검증 목적을 달성하면서 피해를 줄일 방법이 있습니다.' },
      {
        speaker: '재판장',
        text: '양측의 주장은 확인했습니다. 공개 범위와 심리 방식에 관해 결정하겠습니다.',
      },
    ],
    prompts: [
      {
        id: 'Q1',
        title: '녹음의 심리 방식',
        fields: [
          {
            kind: 'choice',
            target: 'q1_audio',
            options: [
              {
                key: 'A',
                label: '공개 법정에서 전체 녹음을 심리한다.',
                judgeLine:
                  '핵심 증거를 공개적으로 검증할 필요가 있습니다. 제3자 정보의 공개 위험은 알고 있습니다.',
                benefit: '공개적 반박·교차검증.',
                cost: '참고인 신원 노출 및 증언 협조 약화 위험.',
                next: 'A11-A',
              },
              {
                key: 'B',
                label: '신원 식별 정보는 보호하고 나머지를 심리한다.',
                judgeLine:
                  '핵심 진술은 확인하되, 관련성이 검증되지 않은 신원 정보의 공개는 제한하겠습니다.',
                benefit: '정보 보호와 검증의 절충.',
                cost: '인물 관계·이해관계의 공개 검증이 제한됨.',
                next: 'A11-B',
              },
              {
                key: 'C',
                label: '제3자 보호 필요성을 먼저 확인할 때까지 녹음 심리를 보류한다.',
                judgeLine:
                  '일단 그 정보의 위험과 관련성을 확인하겠습니다. 녹음의 실질적 평가는 그다음에 하겠습니다.',
                benefit: '회복 어려운 공개 피해 예방.',
                cost: '피고인에게 유리할 수도 있는 내용도 함께 늦게 다뤄짐.',
                next: 'A11-C',
              },
            ],
          },
        ],
      },
    ],
    gain: ['confession-audio'],
    next: 'B20',
  },
  {
    id: 'A11-A',
    title: '공개 재생',
    appearsIf: { key: 'q1_audio', eq: 'A' },
    lines: [
      { speaker: '검사', text: '녹음 전체를 재생하겠습니다.' },
      { speaker: '녹음 속 경찰관', text: '어떻게 죽였습니까?' },
      {
        speaker: '녹음 속 오지안',
        text: '아직 안 죽었을지도 몰라요. 제가 그 사람이 죽는다고 들었어요. 제발 방송국으로 가주세요.',
      },
      { speaker: '경찰관', text: '누구에게서 그런 말을 들었죠?' },
      {
        speaker: '오지안',
        text: '……제게 처음 연락하라고 한 사람은 방송국 자료팀의 이서원 씨였어요. 그런데 그 사람이 진짜 보낸 건지는 몰라요.',
      },
      {
        speaker: '연출',
        text: '이서원은 실존 인물이지만, 피고인의 진술만으로 메시지 발신자·제보자 X·범행 관련자와 동일하다고 단정하지 않는다. 그 사람을 어둡게 비추거나 악역처럼 클로즈업하지 않는다. 해당 이름의 공개가 후속 조사 협조에 불이익을 주었다는 점만 남긴다.',
        kind: 'direction',
      },
      { speaker: '검사', text: '피고인이 제3자의 존재를 알고 있었다는 사실이 드러났습니다.' },
      { speaker: '변호인', text: '동시에 피해자를 구해달라고 했다는 사실도 드러났습니다.' },
      { speaker: '검사', text: '그 둘은 동시에 사실일 수 있습니다.' },
      { speaker: '변호인', text: '그렇습니다. 그래서 결론을 서둘러서는 안 된다는 겁니다.' },
    ],
    mutation: {
      audio_policy: 'PUBLIC',
      audio_context: 'HEARD',
      witness_exposure: 'HIGH',
    },
    next: 'B20',
  },
  {
    id: 'A11-B',
    title: '제한 공개',
    appearsIf: { key: 'q1_audio', eq: 'B' },
    lines: [
      {
        speaker: '재판장',
        text: '신원 정보는 보호하고, 필요하면 양측이 별도 절차에서 검증하십시오.',
      },
      { speaker: '녹음 속 경찰관', text: '어떻게 죽였습니까?' },
      {
        speaker: '오지안',
        text: '아직 안 죽었을지도 몰라요. 제가 그 사람이 죽는다고 들었어요. 제발 방송국으로 가주세요.',
      },
      {
        speaker: '검사',
        text: '그 사람이 누군지 가린 상태에서 어떻게 피고인과의 관계를 확인합니까?',
      },
      {
        speaker: '변호인',
        text: '관계 확인 자체를 막자는 것이 아니라 공개 범위를 제한하자는 것입니다.',
      },
      {
        speaker: '재판장',
        text: '신원은 따로 검증하되, 오늘 심리에서 그 신원이 곧 공모의 증거라고 주장하지 마십시오.',
      },
    ],
    mutation: {
      audio_policy: 'PROTECTED',
      audio_context: 'HEARD',
      witness_exposure: 'LOW',
    },
    next: 'B20',
  },
  {
    id: 'A11-C',
    title: '녹음 심리 보류',
    appearsIf: { key: 'q1_audio', eq: 'C' },
    lines: [
      { speaker: '재판장', text: '녹음의 내용에 관한 판단은 일단 보류하겠습니다.' },
      {
        speaker: '검사',
        text: '그럼 자백에 앞서 피고인과 피해자가 다퉜다는 증인을 먼저 신청하겠습니다.',
      },
      {
        speaker: '변호인',
        text: '검사님은 자백 전체를 보류한 상황에서 그 일부만 전제로 질문해서는 안 됩니다.',
      },
      { speaker: '검사', text: '그 점을 전제로 묻지 않겠습니다. 언쟁 자체를 확인하겠습니다.' },
      { speaker: '오지안(작게)', text: '그런데 제가 왜 경찰서에 갔는지는 언제 듣나요?' },
      { speaker: '변호인', text: '그 문제도 다룰 겁니다.' },
    ],
    mutation: {
      audio_policy: 'DEFER',
      audio_context: 'NOT_YET_HEARD',
      witness_exposure: 'LOW',
    },
    next: 'B20',
  },
];
