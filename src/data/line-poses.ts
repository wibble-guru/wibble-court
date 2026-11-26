/**
 * 대사 상황에 맞는 인물 포즈 (계획서 71). 장면별로 대본 줄 순서대로 한 글자씩:
 * 숫자 = 그 줄 발언자의 포즈 번호(0 기본, 1~9 포즈 그림 — 인물마다 있는 번호만), '.' = 연출이거나 그림 없는 발언자.
 * 포즈 번호 뜻은 pose-names.ts (확인용, 번들에 안 들어감). line-poses.test 가 줄 수·발언자와 맞는지 확인한다.
 */
import type { SceneId } from '@/engine/types';
import { portraitOf, portraitSrc } from './characters';
import { SCENES } from './scenes';

export const LINE_POSES: Partial<Record<SceneId, string>> = {
  P00: '.11733574',
  A10: '.8.1124331',
  'A11-A': '1...1.4423',
  'A11-B': '1.2332',
  'A11-C': '511626',
  B20: '.32162625',
  'B21-A': '41243245',
  'B21-B': '124321',
  'B21-C': '412331',
  C30: '.7.....43351',
  'C31-A': '132346',
  'C31-B': '236231',
  'C31-C': '712442',
  D40: '324.2361561',
  'D41-A': '43312342.',
  'D41-B': '131326.',
  'D41-C': '143662',
  E50: '.7.1443326',
  'E51-A': '142312',
  'E51-B': '32346325',
  'E51-C': '13365.',
  F60: '.71242133644',
  'F61-A': '73451',
  'F61-B': '614366',
  'F61-C': '214521',
  G70: '.7145511334',
  'G71-A': '332641',
  'G71-B': '1323425',
  'G71-C': '34450356',
  H80: '.112432',
  'H81-A': '1734',
  'H81-B': '41556',
  'H81-C': '2731',
  I90: '.486',
  'I91-A': '4133326631',
  'I91-B': '4137541',
  'I91-C': '42346',
  J100: '.7124443331524333666265231',
  'GUILTY-A': '1422..',
  'GUILTY-B': '1.52..',
  'GUILTY-C': '1454..',
  'NOTGUILTY-A': '1563..',
  'NOTGUILTY-B': '1.53..',
  'NOTGUILTY-C': '1562..',
};

/** 이 장면 이 줄(대본 줄 번호)의 포즈. 표에 없으면 0(기본) */
export function poseAt(scene: SceneId, index: number): number {
  const c = LINE_POSES[scene]?.[index];
  return c && c !== '.' ? Number(c) : 0;
}

/** 이 장면에서 쓰는 포즈 그림 주소 (미리 받기용, 기본 그림 제외, 중복 없음) */
export function poseSrcsIn(scene: SceneId): string[] {
  const row = LINE_POSES[scene];
  const lines = SCENES[scene]?.lines;
  if (!row || !lines) return [];
  const srcs = new Set<string>();
  lines.forEach((line, i) => {
    const pose = Number(row[i]);
    const portrait = line.kind === 'direction' ? null : portraitOf(line.speaker);
    if (portrait && pose > 0) srcs.add(portraitSrc(portrait.id, pose));
  });
  return [...srcs];
}
