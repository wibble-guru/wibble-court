/**
 * 대사 상황에 맞는 인물 포즈 (계획서 71). 장면별로 대본 줄 순서대로 한 글자씩:
 * 숫자 = 그 줄 발언자의 포즈 번호(0 기본, 1~9 포즈 그림 — 인물마다 있는 번호만), '.' = 연출이거나 그림 없는 발언자.
 * 포즈 번호 뜻은 pose-names.ts (확인용, 번들에 안 들어감). line-poses.test 가 줄 수·발언자와 맞는지 확인한다.
 */
import type { SceneId } from '@/engine/types';
import { portraitOf, portraitSrc } from './characters';
import { SCENES } from './scenes';

export const LINE_POSES: Partial<Record<SceneId, string>> = {
  P00: '.11733541',
  A10: '.1.4123133',
  'A11-A': '1...1.4323',
  'A11-B': '1.2332',
  'A11-C': '111226',
  B20: '.42122613',
  'B21-A': '42233545',
  'B21-B': '124321',
  'B21-C': '412331',
  C30: '.1.....43331',
  'C31-A': '132246',
  'C31-B': '233211',
  'C31-C': '112422',
  D40: '324.2331523',
  'D41-A': '14332332.',
  'D41-B': '141325.',
  'D41-C': '145662',
  E50: '.1.1443526',
  'E51-A': '142312',
  'E51-B': '31334425',
  'E51-C': '13335.',
  F60: '.13242133143',
  'F61-A': '13451',
  'F61-B': '332366',
  'F61-C': '211125',
  G70: '.1125511342',
  'G71-A': '132615',
  'G71-B': '1463553',
  'G71-C': '34456326',
  H80: '.112332',
  'H81-A': '1134',
  'H81-B': '41551',
  'H81-C': '2133',
  I90: '.126',
  'I91-A': '4143326635',
  'I91-B': '4141543',
  'I91-C': '43346',
  J100: '.1121114114324333243465231',
  'GUILTY-A': '1422..',
  'GUILTY-B': '1.52..',
  'GUILTY-C': '1454..',
  'NOTGUILTY-A': '1533..',
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
