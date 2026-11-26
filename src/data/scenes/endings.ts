import type { Scene } from '@/engine/types';

/** 대본 4부 판결 엔딩 6개 — 문장은 대본 그대로 */
export const ENDINGS: Scene[] = [
  {
    id: 'GUILTY-A',
    title: '시간 범위를 확인한 뒤 유죄',
    appearsIf: {
      all: [
        { key: 'verdict', eq: 'GUILTY' },
        { key: 'q7_priority', eq: 'A' },
      ],
    },
    lines: [
      { speaker: '재판장', text: '피고인 오지안에 대해 유죄를 선고합니다.' },
      { speaker: '오지안', text: '사망 시각도 아직 모르는 거잖아요.' },
      { speaker: '검사', text: '검찰은 시각 하나만으로 공모를 주장하지 않았습니다.' },
      {
        speaker: '변호인',
        text: '공모했다는 합의나 협력의 실체도 여전히 불확실합니다. 판결문을 검토하겠습니다.',
      },
      {
        speaker: '내레이션',
        text: '당신은 사망 시각을 특정할 수 없다는 사실을 알고도, 남은 행동의 연결이 공모 혐의를 뒷받침한다고 판단했다.',
      },
      {
        speaker: '잔여 질문',
        text: '불완전한 시간표 안에서, 여러 정황의 결합은 어디까지 입증이 될 수 있는가?',
      },
    ],
    next: 'RESULT',
  },
  {
    id: 'GUILTY-B',
    title: '통화 음성을 검토한 뒤 유죄',
    appearsIf: {
      all: [
        { key: 'verdict', eq: 'GUILTY' },
        { key: 'q7_priority', eq: 'B' },
      ],
    },
    lines: [
      { speaker: '재판장', text: '피고인 오지안에 대해 유죄를 선고합니다.' },
      { speaker: '강도현', text: '저는 그날 분명 민태성 씨라고 생각하고 통화했습니다.' },
      {
        speaker: '변호인',
        text: '그 판단이 정직했다는 사실과 실제 통화자가 누구였는지는 다릅니다.',
      },
      {
        speaker: '검사',
        text: '통화가 누구의 목소리였든 피고인이 사건을 사전에 알고 행동했다는 기록은 남습니다.',
      },
      {
        speaker: '내레이션',
        text: '당신은 불확실한 통화자 신원보다 피고인의 사전 행동에 더 큰 무게를 두었다.',
      },
      {
        speaker: '잔여 질문',
        text: '가장 중요한 확인 하나가 끝내 불가능할 때, 다른 정황은 그 공백을 얼마나 메울 수 있을까?',
      },
    ],
    next: 'RESULT',
  },
  {
    id: 'GUILTY-C',
    title: '메시지 경위를 검토한 뒤 유죄',
    appearsIf: {
      all: [
        { key: 'verdict', eq: 'GUILTY' },
        { key: 'q7_priority', eq: 'C' },
      ],
    },
    lines: [
      { speaker: '재판장', text: '피고인 오지안에 대해 유죄를 선고합니다.' },
      { speaker: '검사', text: '사건 전부터 제3자와 연락했다는 사실은 분명합니다.' },
      {
        speaker: '변호인',
        text: "그러나 그 연락을 '공모'로 볼 수 있는지는 끝까지 다툼이 있었습니다.",
      },
      { speaker: '오지안', text: '제가 그 사람을 살려달라고 했던 말도 들으셨잖아요.' },
      {
        speaker: '내레이션',
        text: '당신은 협박 가능성을 알고도 연락과 행동의 정합성이 더 중요하다고 판단했다.',
      },
      {
        speaker: '잔여 질문',
        text: '약속을 지킨 사람과 범행을 함께 계획한 사람은 언제 같은 사람이 되는가?',
      },
    ],
    next: 'RESULT',
  },
  {
    id: 'NOTGUILTY-A',
    title: '시간 범위를 확인한 뒤 무죄',
    appearsIf: {
      all: [
        { key: 'verdict', eq: 'NOT_GUILTY' },
        { key: 'q7_priority', eq: 'A' },
      ],
    },
    lines: [
      { speaker: '재판장', text: '피고인 오지안의 살인 공모 혐의에 대해 무죄를 선고합니다.' },
      { speaker: '검사', text: '피고인은 사건을 미리 알았고 그에 맞춰 행동했습니다.' },
      {
        speaker: '재판장',
        text: '그 사정만으로 공모가 합리적 의심 없이 증명된다고 보기 어렵습니다.',
      },
      {
        speaker: '변호인',
        text: '피고인의 모든 행동이 옳았다는 뜻은 아닙니다. 이 혐의가 입증되지 않았다는 뜻입니다.',
      },
      {
        speaker: '내레이션',
        text: '당신은 발견 시각과 사망 시각을 구분했고, 불확실한 시간표에서 단정적 결론을 경계했다.',
      },
      {
        speaker: '잔여 질문',
        text: '정확히 알지 못하는 시각 하나가 판단 전체를 어느 정도 바꾸었는가?',
      },
    ],
    next: 'RESULT',
  },
  {
    id: 'NOTGUILTY-B',
    title: '통화 음성을 검토한 뒤 무죄',
    appearsIf: {
      all: [
        { key: 'verdict', eq: 'NOT_GUILTY' },
        { key: 'q7_priority', eq: 'B' },
      ],
    },
    lines: [
      { speaker: '재판장', text: '피고인 오지안의 살인 공모 혐의에 대해 무죄를 선고합니다.' },
      { speaker: '강도현', text: '그날 전화에서 들은 말은 아직도 기억합니다.' },
      { speaker: '검사', text: '연락 기록 자체는 확인됐습니다.' },
      {
        speaker: '변호인',
        text: '그러나 통화자의 신원과 발언의 의미는 끝까지 단정할 수 없었습니다.',
      },
      {
        speaker: '내레이션',
        text: '당신은 통화 기록의 존재와, 그 통화가 입증할 수 있는 범위를 분리했다.',
      },
      {
        speaker: '잔여 질문',
        text: '기억이 선명한 사람의 말과 신원을 확인할 수 없는 기록 중 무엇을 어느 정도 믿을 것인가?',
      },
    ],
    next: 'RESULT',
  },
  {
    id: 'NOTGUILTY-C',
    title: '메시지 경위를 검토한 뒤 무죄',
    appearsIf: {
      all: [
        { key: 'verdict', eq: 'NOT_GUILTY' },
        { key: 'q7_priority', eq: 'C' },
      ],
    },
    lines: [
      { speaker: '재판장', text: '피고인 오지안의 살인 공모 혐의에 대해 무죄를 선고합니다.' },
      { speaker: '검사', text: '피고인이 제3자와 연락한 사실은 변하지 않습니다.' },
      {
        speaker: '변호인',
        text: '그러나 그 연락이 협박이었는지 공모였는지 검찰은 입증하지 못했습니다.',
      },
      {
        speaker: '오지안',
        text: '그날 메시지를 지울 걸 그랬다고 생각한 적도 있어요. 지금은 아니에요.',
      },
      {
        speaker: '내레이션',
        text: '당신은 동일한 메시지가 여러 방향으로 해석될 수 있다는 한계를 판결에 반영했다.',
      },
      {
        speaker: '잔여 질문',
        text: '사실은 확인했지만 의미를 확인하지 못한 증거를, 판결에서 어떻게 다뤄야 하는가?',
      },
    ],
    next: 'RESULT',
  },
];
