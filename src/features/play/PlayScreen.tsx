import { promptTitle } from '@/data/prompt-title';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Backdrop } from '@/components/Backdrop';
import { SceneBackground } from '@/components/SceneBackground';
import { INSERTS, messageView } from '@/data/evidence';
import { sceneTitle } from '@/data/scene-title';
import { JUDGE_AT_PROMPT } from '@/data/characters';
import { poseAt, poseSrcsIn } from '@/data/line-poses';
import { nextScenes, upcomingBackgrounds } from '@/data/scene-bg';
import { SCENES } from '@/data/scenes';
import { EvidenceBar } from '@/features/evidence/EvidenceBar';
import { Messenger } from '@/features/evidence/Messenger';
import { Epilogue } from '@/features/epilogue/Epilogue';
import { Notebook } from '@/features/notebook/Notebook';
import { loadResultCopy } from '@/features/result/ResultScreen';
import { isThoughtPrompt } from '@/features/thought/thought';
import type { ThoughtRecord as ThoughtRecordComponent } from '@/features/thought/ThoughtRecord';
import { cx } from '@/lib/cx';
import { preloadBackground, preloadImage } from '@/lib/preload';
import { useStory } from '@/store/story';
import type { AnswerInput } from '@/engine/engine';
import type { EvidenceId } from '@/engine/types';
import type { EvidenceModal as EvidenceModalComponent } from '@/features/evidence/EvidenceModal';
import { DialogueBox } from './DialogueBox';
import { PromptPanel } from './PromptPanel';
import { advance, backdropOf, currentPrompt, submit, visibleLines, type Play } from './runner';
import { Emphasis, Typewriter } from './Typewriter';
import './play.css';

type Props = {
  /** 처음부터면 startPlay(), 이어서면 저장된 진행 */
  start: Play;
  /** 장면이 더 없을 때 (엔딩 뒤 → RESULT, 에필로그 뒤 → 결과 전송) */
  onEnd: (play: Play) => void;
};

/** 대본에 없는 화면 문구. 한곳에 모은다 (보조기기용 대화창 이름, 확정 버튼) */
const UI_COPY = { nextLine: '다음 대사', confirm: '기록하기' };

/**
 * 플레이 화면 (P00 ~ 엔딩). 진행은 runner 가, 이 화면은 배치와 입력만.
 * - 대사 단계: 대화창(이름표 + 타자 효과). 누르면 다 안 나왔으면 전부 표시, 다 나왔으면 다음 대사
 * - 법정 질문: 대화창에 질문 제목·메모, 선택지는 PC 오른쪽 열·모바일 세로 대화창 위
 * - 생각 기록 질문(Q0, M65 …): 기록장 배경 위 종이 한 장 (features/thought)
 * - 왼쪽 위 저울 엠블럼(기록장, features/notebook) + 장면 제목 막대. 기록장이 열려 있는 동안 대사 넘김을 막는다
 * - 왼쪽 위 장면 제목 아래 증거 상자 (features/evidence). 칸·갈매기를 누르면 증거 모달, 떠 있는 동안 대사 넘김을 막는다
 * 바뀔 때마다 이어하기용으로 저장하고, 끝나면 저장을 지운다.
 */
export function PlayScreen({ start, onEnd }: Props) {
  const saveStory = useStory((s) => s.saveStory);
  const [play, setPlay] = useState(start);
  const { cursor } = play;
  const lineKey = cursor.at === 'line' ? `${cursor.sceneId}:${cursor.index}` : '';
  /** 끝까지 나타난 대사의 key (타자 효과가 끝났거나 눌러서 건너뜀) */
  const [revealed, setRevealed] = useState('');
  const done = lineKey !== '' && revealed === lineKey;
  const [notebookOpen, setNotebookOpen] = useState(false);
  /** 증거 모달: 닫힘 = null, { id: null } = 목록 */
  const [evidenceView, setEvidenceView] = useState<{ id: EvidenceId | null } | null>(null);
  const closeEvidence = useCallback(() => setEvidenceView(null), []);
  const modalOpen = notebookOpen || evidenceView !== null;
  /** 증거 모달은 별도 청크 (본편 번들 50KB 한도, 계획서 71) — 첫 증거가 생기면 미리 받아 둔다 */
  const [EvidenceModal, setEvidenceModal] = useState<typeof EvidenceModalComponent | null>(null);
  /** 생각 기록 시트도 별도 청크 (#98, 본편 번들 50KB 한도) — 플레이 화면에 들어오면 바로 받아 둔다 */
  const [ThoughtRecord, setThoughtRecord] = useState<typeof ThoughtRecordComponent | null>(null);
  useEffect(() => {
    void import('@/features/thought/ThoughtRecord').then((m) =>
      setThoughtRecord(() => m.ThoughtRecord),
    );
  }, []);

  // 진행할 때마다 저장. 끝(엔딩 뒤 RESULT, 에필로그 뒤)도 저장해 두고 App 이 다음 화면을 정한다
  useEffect(() => {
    saveStory(play);
    if (cursor.at === 'end') onEnd(play);
  }, [play, cursor.at, saveStory, onEnd]);

  // 증거 화면: 정해진 대사부터 그 장면의 대사가 끝날 때까지 (질문 단계에서는 숨김)
  const sceneLines = cursor.at === 'line' ? visibleLines(cursor.sceneId, play.story) : [];
  const cue = cursor.at === 'line' ? INSERTS[cursor.sceneId as keyof typeof INSERTS] : undefined;
  const cueAt = cue
    ? sceneLines.findIndex((l) => l.speaker === cue.speaker && l.text.startsWith(cue.starts ?? ''))
    : -1;
  const insert =
    cue && cursor.at === 'line' && cueAt >= 0 && cursor.index >= cueAt ? cue.insert : null;
  // 메시지는 메신저 화면: 말풍선 대사 동안은 대화창 대신 화면을 차지한다 (계획서 78)
  const message =
    insert?.kind === 'message' && cursor.at === 'line'
      ? messageView(insert, sceneLines, cueAt, cursor.index)
      : null;
  const messengerFull = message?.full ?? false;

  /** 에필로그는 타자 효과 없이 기록 카드라 한 번 누르면 다음 (features/epilogue) */
  const epilogue = cursor.at === 'line' && cursor.sceneId === 'EPILOGUE';
  const press = useCallback(() => {
    if (!lineKey) return;
    // 메신저가 화면을 차지한 대사는 타자 효과가 없어 한 번에 다음
    if (epilogue || messengerFull || revealed === lineKey) setPlay(advance);
    else setRevealed(lineKey);
  }, [lineKey, revealed, epilogue, messengerFull]);

  const reveal = useCallback(() => setRevealed(lineKey), [lineKey]);

  // Enter·Space = 대화창 누름 (버튼·입력에 포커스가 있으면 그쪽이 처리)
  useEffect(() => {
    if (!lineKey || modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target instanceof HTMLElement && e.target.closest('button, input')) return;
      e.preventDefault();
      if (!e.repeat) press();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lineKey, press, modalOpen]);

  // 대사 단계에선 대화창에, 질문 단계에선 질문 제목에 포커스 (키보드·스크린리더가 길을 잃지 않게)
  const panelRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const prompt = currentPrompt(play);
  useEffect(() => {
    (lineKey ? panelRef.current : titleRef.current)?.focus({ preventScroll: true });
  }, [lineKey, prompt, messengerFull, ThoughtRecord]);

  // 배경: 장면이 바뀌면 다음에 올 수 있는 장면들의 배경을 미리 받는다 (이미 받은 것은 캐시)
  const sceneId = cursor.at === 'end' ? null : cursor.sceneId;
  useEffect(() => {
    if (sceneId) upcomingBackgrounds(sceneId).forEach((id) => void preloadBackground(id));
    // 인물 포즈: 이 장면과 다음에 올 수 있는 장면에서 쓰는 포즈 그림만 (계획서 71)
    if (sceneId)
      [sceneId, ...nextScenes(sceneId)]
        .flatMap(poseSrcsIn)
        .forEach((src) => void preloadImage(src));
    // 결과 문구는 별도 청크 — 최후 변론(J100)부터 미리 받아 둔다
    if (sceneId === 'J100' || sceneId === 'J110') void loadResultCopy();
  }, [sceneId]);
  const [backdrop, setBackdrop] = useState(() => backdropOf(start));
  const current = backdropOf(play);
  if (current && (current.bg !== backdrop?.bg || current.effect !== backdrop?.effect)) {
    setBackdrop(current); // 끝(end)에서는 마지막 배경을 그대로 둔 채 암전
  }

  const line = cursor.at === 'line' ? (sceneLines[cursor.index] ?? null) : null;
  /** 지금 대사의 대본 줄 번호 (조건부 대사를 빼고 보여 주므로 화면 순번과 다를 수 있다) */
  const lineIndex = line && sceneId ? (SCENES[sceneId]?.lines.indexOf(line) ?? -1) : -1;

  // 증거: 이미 얻은 것 + 지금 장면에서 얻는 것 (장면에 들어가는 순간 나타남)
  const sceneGain = sceneId ? (SCENES[sceneId]?.gain ?? []) : [];
  const evidence = [...new Set([...play.story.acquired, ...sceneGain])];
  const hasEvidence = evidence.length > 0;
  useEffect(() => {
    if (!hasEvidence || EvidenceModal) return;
    void import('@/features/evidence/EvidenceModal').then((m) =>
      setEvidenceModal(() => m.EvidenceModal),
    );
  }, [hasEvidence, EvidenceModal]);
  const thought = prompt !== null && isThoughtPrompt(prompt);
  const promptKey = prompt && cursor.at === 'prompt' ? `${cursor.sceneId}:${prompt.id}` : '';
  const onSubmit = (input: AnswerInput) => setPlay((p) => submit(p, input).play);

  return (
    <main className="play-screen">
      {backdrop && <Backdrop bg={backdrop.bg} effect={backdrop.effect} />}
      {/* 생각 기록 질문 동안 재판장 기록장(L-08)이 법정 위로 페이드. 이어지는 생각 기록 사이에는 깜빡이지 않는다 */}
      <div className={cx('scene-layer notebook-layer', thought && 'is-on')} aria-hidden="true">
        <SceneBackground id="L-08_judge-notebook" />
      </div>

      {/* 메신저가 무대를 차지하는 동안 뒤 장면을 흐리게 (계획서 78) */}
      {messengerFull && <div className="messenger-veil" aria-hidden="true" />}
      <div className="play-stage" data-mode={line ? 'line' : thought ? 'thought' : 'prompt'}>
        {insert?.kind === 'message' && message && (
          <Messenger
            key={cursor.at === 'line' ? cursor.sceneId : ''}
            insert={insert}
            shown={message.shown}
            onPress={messengerFull ? press : undefined}
            pressLabel={UI_COPY.nextLine}
            buttonRef={panelRef}
          />
        )}
        {line && !epilogue && !messengerFull && (
          <DialogueBox
            speaker={line.speaker}
            pose={sceneId ? poseAt(sceneId, lineIndex) : 0}
            showNext={done}
            onPress={press}
            pressLabel={UI_COPY.nextLine}
            panelRef={panelRef}
          >
            <span className="dialogue-text">
              <Typewriter key={lineKey} text={line.text} done={done} onDone={reveal} />
            </span>
          </DialogueBox>
        )}

        {promptKey && prompt && thought && ThoughtRecord && (
          <ThoughtRecord
            key={promptKey}
            prompt={prompt}
            confirmLabel={UI_COPY.confirm}
            onSubmit={onSubmit}
            titleRef={titleRef}
          />
        )}

        {promptKey && prompt && !thought && (
          <>
            <DialogueBox key={`${promptKey}:box`} figure={JUDGE_AT_PROMPT}>
              <h2 id="prompt-title" ref={titleRef} tabIndex={-1} className="prompt-title">
                <Emphasis text={promptTitle(prompt)} />
              </h2>
              {prompt.memo && (
                <p className="prompt-memo">
                  <Emphasis text={prompt.memo} />
                </p>
              )}
            </DialogueBox>
            <PromptPanel
              key={`${promptKey}:panel`}
              prompt={prompt}
              confirmLabel={UI_COPY.confirm}
              onSubmit={onSubmit}
            />
          </>
        )}
      </div>
      {epilogue && cursor.at === 'line' ? (
        <Epilogue
          lines={visibleLines('EPILOGUE', play.story)}
          index={cursor.index}
          onPress={press}
          pressLabel={UI_COPY.nextLine}
          buttonRef={panelRef}
        />
      ) : (
        <>
          <EvidenceBar ids={evidence} onOpen={(id) => setEvidenceView({ id })} />
          {evidenceView && EvidenceModal && (
            <EvidenceModal
              ids={evidence}
              view={evidenceView.id}
              visited={sceneId ? [...play.story.visited, sceneId] : play.story.visited}
              cursor={
                sceneId
                  ? {
                      sceneId,
                      // 대사 단계는 지금 대사까지, 질문 단계는 장면 끝까지 (대본 줄 번호)
                      upTo: line ? lineIndex : Infinity,
                    }
                  : null
              }
              onView={(id) => setEvidenceView({ id })}
              onClose={closeEvidence}
            />
          )}
          <Notebook
            story={play.story}
            open={notebookOpen}
            onOpenChange={setNotebookOpen}
            title={sceneId ? sceneTitle(sceneId) : null}
          />
        </>
      )}
    </main>
  );
}
