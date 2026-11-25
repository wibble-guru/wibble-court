import { describe, expect, it } from 'vitest';
import type { EvidenceId } from '@/engine/types';
import { EVIDENCE } from './evidence';
import { RECORDS, recordLines } from './evidence-record';
import { SCENES } from './scenes';

describe('증거 기록', () => {
  it('모든 증거에 기록이 있고, 참조한 줄이 모두 대본에 있다', () => {
    for (const id of Object.keys(EVIDENCE) as EvidenceId[]) {
      const { refs } = RECORDS[id];
      expect(refs.length, id).toBeGreaterThan(0);
      for (const [scene, index] of refs) {
        const line = SCENES[scene]?.lines[index];
        expect(line, `${id} ${scene}[${index}]`).toBeDefined();
        // 조건부 대사는 쓰지 않는다 (경로에 따라 안 나왔을 수 있음)
        expect(line!.when, `${id} ${scene}[${index}]`).toBeUndefined();
      }
    }
  });

  it('연출 줄은 통화가 끊긴 침묵 하나만', () => {
    const directions = Object.values(RECORDS).flatMap(({ refs }) =>
      refs.filter(([scene, index]) => SCENES[scene]!.lines[index]!.kind === 'direction'),
    );
    expect(directions).toEqual([['C30', 6]]);
    expect(SCENES.C30!.lines[6]!.text).toContain('2초간 침묵');
  });

  it('지나온 장면의 줄만, 지금 장면은 지금 줄까지만', () => {
    // 제한 공개(A11-B)를 고른 경로: 전체 공개(A11-A) 줄은 안 보인다
    const restricted = recordLines('confession-audio', ['P00', 'A10', 'A11-B'], null);
    expect(restricted.map((l) => l.speaker)).toEqual([
      '녹음 속 오지안',
      '녹음 속 경찰관',
      '오지안',
    ]);
    // A10 에서 녹음이 아직 안 나왔을 때
    expect(recordLines('confession-audio', ['P00'], { sceneId: 'A10', upTo: 1 })).toEqual([]);
    expect(recordLines('confession-audio', ['P00'], { sceneId: 'A10', upTo: 2 })).toHaveLength(1);
    // 지금 장면이 visited 에 같이 들어와도 지금 줄까지만
    expect(recordLines('call-2212', ['P00', 'C30'], { sceneId: 'C30', upTo: 1 })).toEqual([]);
  });
});
