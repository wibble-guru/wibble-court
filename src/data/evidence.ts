/**
 * 증거 (로드맵 4b, 계획서 26-evidence.md).
 * - 아이콘 바: 증거 id → 이름(요청서 표 그대로) + 아이콘. 얻는 곳은 장면 데이터의 gain
 * - 증거 화면: 정해진 대사부터 장면 끝(대사 단계)까지 배경 위에 겹쳐 보이는 녹음·메시지·시간표.
 *   문구는 모두 그 장면의 대사·연출 안에 있는 문장 그대로 (evidence.test 가 확인)
 */
import type { EvidenceId, SceneId, TrialSceneId } from '@/engine/types';
import type { IconId } from './assets';

export const EVIDENCE: Record<EvidenceId, { name: string; icon: IconId }> = {
  'confession-audio': { name: '자백 녹음', icon: 'I-01_recorder' },
  'yura-statement': { name: '한유라 진술', icon: 'I-02_statement' },
  'call-2212': { name: '22:12 통화 녹음', icon: 'I-03_call-phone' },
  'voice-analysis': { name: '통화 음성 감정', icon: 'I-04_voice-analysis' },
  'email-draft': { name: '미발송 이메일 초안', icon: 'I-05_laptop' }, // 그림은 증거물 봉투 (사용자 결정)
  timeline: { name: '사건 시간표', icon: 'I-06_timeline' },
  'x-statement': { name: '익명 참고인 X 진술', icon: 'I-07_sealed-envelope' },
  'anon-messages': { name: '익명 상대와의 메시지', icon: 'I-08_anon-phone' },
  'message-forensics': { name: '메시지 기록 감정', icon: 'I-09_usb' },
  'text-2154': { name: '21:54 발신 문자', icon: 'I-10_message-phone' },
};

export type Insert =
  /** 녹음 재생 화면 (재생 표시 + 빨간 점). label 은 대본에 파일 이름이 있을 때만 */
  | { kind: 'recorder'; label?: string }
  /** 메시지 화면. image: M-01 이미지(말풍선 2개) / css: 코드로 그린 폰. in = 받은 말풍선, out = 보낸 말풍선 */
  | { kind: 'message'; phone: 'image' | 'css'; bubbles: { side: 'in' | 'out'; text: string }[] }
  /** 시간표: from 에 취소선, 그다음 to */
  | { kind: 'timeline'; from: string; to: string };

/** 이 발언자의 대사(첫머리가 starts)부터 장면의 대사가 끝날 때까지 보인다 */
export type InsertCue = { speaker: string; starts?: string; insert: Insert };

export const INSERTS: Partial<Record<TrialSceneId, InsertCue>> = {
  // 연출: 검사 측 화면에 ‘자백 녹음 03:17’이라는 파일이 표시된다
  A10: {
    speaker: '검사',
    starts: '피고인의 최초 자백',
    insert: { kind: 'recorder', label: '자백 녹음 03:17' },
  },
  // 연출: 통화 녹음 재생 화면이 켜진다 (파일 이름은 대본에 없음)
  C30: { speaker: '녹음 속 강도현', insert: { kind: 'recorder' } },
  E50: {
    speaker: '화면 / 발신자 불명',
    insert: {
      kind: 'message',
      phone: 'image',
      bubbles: [
        { side: 'in', text: '네가 경찰서에 가면, 그 뒤에는 아무 일도 없을 거야.' },
        { side: 'out', text: '알았어. 약속은 지켜. 그 사람은 건드리지 마.' },
      ],
    },
  },
  F60: {
    speaker: '검사',
    starts: '게다가 오후 9시 54분',
    insert: {
      kind: 'message',
      phone: 'css',
      bubbles: [{ side: 'out', text: '17층에 계세요. 제가 곧 갈게요.' }],
    },
  },
  G70: {
    speaker: '변호인',
    starts: '방금 말씀하신 표현을',
    insert: { kind: 'timeline', from: '10시 20분에 사망', to: '10시 20분에 발견' },
  },
};

/**
 * 증거 모달에서 다시 보는 증거 화면 (계획서 55). 그 증거를 다루는 장면의 증거 화면.
 * 화면이 없는 증거는 그림·이름·얻은 장면만 보인다.
 */
export const REPLAY: Partial<Record<EvidenceId, TrialSceneId>> = {
  'confession-audio': 'A10',
  'call-2212': 'C30',
  'anon-messages': 'E50',
  'text-2154': 'F60',
  timeline: 'G70',
};

/** 지나온 장면(visited, 지금 장면 포함) 가운데 이 증거를 얻은 첫 장면 */
export function gainedAt(
  id: EvidenceId,
  visited: readonly SceneId[],
  gainOf: (scene: SceneId) => readonly EvidenceId[] | undefined,
): SceneId | undefined {
  return visited.find((scene) => gainOf(scene)?.includes(id));
}
