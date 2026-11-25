import { describe, expect, it } from 'vitest';
import type { EvidenceId, SceneId, TrialSceneId } from '@/engine/types';
import { EVIDENCE, gainedAt, INSERTS, REPLAY } from './evidence';
import { SCENES } from './scenes';

const scenes = Object.values(SCENES).filter((s) => s !== undefined);

describe('증거', () => {
  it('장면에서 얻는 모든 증거에 이름과 아이콘이 있다', () => {
    const gains = new Set(scenes.flatMap((s) => s.gain ?? []));
    expect([...gains].sort()).toEqual((Object.keys(EVIDENCE) as EvidenceId[]).sort());
  });

  it('사건 시간표는 C31-C 와 G70 에서 얻는다 (로드맵 표)', () => {
    const where = scenes.filter((s) => s.gain?.includes('timeline')).map((s) => s.id);
    expect(where).toEqual(['C31-C', 'G70']);
  });

  it('증거 화면은 실제 대사에서 시작하고, 문구는 그 장면의 대사·연출 안에 글자 그대로 있다', () => {
    for (const [id, cue] of Object.entries(INSERTS) as [
      TrialSceneId,
      (typeof INSERTS)[TrialSceneId],
    ][]) {
      const lines = SCENES[id as SceneId]!.lines;
      const start = lines.filter(
        (l) =>
          l.kind !== 'direction' &&
          l.speaker === cue!.speaker &&
          l.text.startsWith(cue!.starts ?? ''),
      );
      expect(start, id).toHaveLength(1);

      const all = lines.map((l) => l.text).join('\n');
      const insert = cue!.insert;
      const texts =
        insert.kind === 'recorder'
          ? [insert.label ?? '']
          : insert.kind === 'message'
            ? insert.bubbles.map((b) => b.text)
            : [insert.from, insert.to];
      for (const text of texts) expect(all.includes(text), `${id}: ${text}`).toBe(true);
    }
  });

  it('E50 말풍선은 화면에 나온 두 문장 그대로 (받은 것, 보낸 것 순서)', () => {
    const lines = SCENES.E50!.lines.filter((l) => l.speaker.startsWith('화면 /'));
    const insert = INSERTS.E50!.insert;
    expect(insert.kind === 'message' && insert.bubbles.map((b) => b.text)).toEqual(
      lines.map((l) => l.text),
    );
  });

  it('다시 보기 화면은 모두 실제 증거 화면이 있는 장면이다', () => {
    for (const [id, scene] of Object.entries(REPLAY)) {
      expect(INSERTS[scene!], id).toBeDefined();
    }
  });

  it('얻은 장면은 지나온 장면 가운데 그 증거를 얻은 첫 장면', () => {
    const gainOf = (id: SceneId) => SCENES[id]?.gain;
    expect(gainedAt('timeline', ['P00', 'C30', 'C31-C', 'G70'], gainOf)).toBe('C31-C');
    expect(gainedAt('timeline', ['P00', 'C30', 'G70'], gainOf)).toBe('G70');
    expect(gainedAt('timeline', ['P00'], gainOf)).toBeUndefined();
  });
});
