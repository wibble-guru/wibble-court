/**
 * 증거 (로드맵 4b, 계획서 26-evidence.md).
 * - 아이콘 바: 증거 id → 이름(요청서 표 그대로) + 아이콘. 얻는 곳은 장면 데이터의 gain
 * - 증거 화면: 정해진 대사부터 장면 끝(대사 단계)까지 보이는 메신저 (시간표·녹음기 겹침은 #96 에서 삭제).
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

/**
 * 대사 중 겹쳐 뜨는 증거 화면: 메시지(메신저, 계획서 78)만 남았다. 시간표·녹음기 겹침은 #96 에서 지웠다.
 * in = 받은 말풍선, out = 보낸 말풍선. sender 는 상대 이름(대본 발언자 표기에 있는 것만),
 * time 은 대본 발언자 표기에 시각이 있을 때만
 */
export type Insert = {
  kind: 'message';
  sender?: string;
  bubbles: { side: 'in' | 'out'; text: string; time?: string }[];
};

/** 이 발언자의 대사(첫머리가 starts)부터 장면의 대사가 끝날 때까지 보인다 */
export type InsertCue = { speaker: string; starts?: string; insert: Insert };

export const INSERTS: Partial<Record<TrialSceneId, InsertCue>> = {
  E50: {
    speaker: '화면 / 발신자 불명',
    insert: {
      kind: 'message',
      sender: '발신자 불명', // 발언자 '화면 / 발신자 불명'
      bubbles: [
        { side: 'in', text: '네가 경찰서에 가면, 그 뒤에는 아무 일도 없을 거야.' },
        // 발언자 '화면 / 오지안, 22:00'
        { side: 'out', text: '알았어. 약속은 지켜. 그 사람은 건드리지 마.', time: '22:00' },
      ],
    },
  },
  F60: {
    speaker: '검사',
    starts: '또한 오후 9시 54분',
    insert: {
      kind: 'message',
      bubbles: [{ side: 'out', text: '17층에 계세요. 제가 곧 갈게요.' }],
    },
  },
};

export type MessageInsert = Extract<Insert, { kind: 'message' }>;

/**
 * 메신저가 지금 어떻게 보이는가 (계획서 78).
 * - 말풍선은 그 문장을 읽는 대사에 이르렀을 때 하나씩 올라온다. 대사에 없는 말풍선(검사가 인용만 하는 F60)은 처음부터 보인다
 * - 지금 대사가 말풍선 문장 그 자체면 full: 대화창을 숨기고 메신저가 화면을 차지한다
 * - 마지막 말풍선 대사(없으면 시작 대사)가 지나면 메신저를 닫고 장면으로 돌아간다
 */
export function messageView(
  insert: MessageInsert,
  lines: readonly { text: string }[],
  startAt: number,
  index: number,
): { shown: number; full: boolean } | null {
  const at = insert.bubbles.map((b) =>
    lines.findIndex((l, i) => i >= startAt && l.text === b.text),
  );
  const end = Math.max(startAt, ...at);
  if (index < startAt || index > end) return null;
  return {
    shown: at.filter((i) => i <= index).length,
    full: at.includes(index),
  };
}

/** 지나온 장면(visited, 지금 장면 포함) 가운데 이 증거를 얻은 첫 장면 */
export function gainedAt(
  id: EvidenceId,
  visited: readonly SceneId[],
  gainOf: (scene: SceneId) => readonly EvidenceId[] | undefined,
): SceneId | undefined {
  return visited.find((scene) => gainOf(scene)?.includes(id));
}
