/**
 * 장면 데이터와 진행 상태의 타입. 대본(script-v4) 7.1 "장면 최소 구성"과 5.8 "데이터 구조"를 따른다.
 * 필드 이름은 대본 표기(snake_case)를 그대로 쓴다 — 대본과 코드를 나란히 놓고 검수하기 위해서.
 */

/* ───────── 장면 id ───────── */

type Branch<P extends string> = `${P}-A` | `${P}-B` | `${P}-C`;

/** 본편 장면 (3부 P00 ~ J110). Q0·Q7·QG·Q10 처럼 장면 안에서 묻는 질문은 장면의 prompts 로 둔다 */
export type TrialSceneId =
  | 'P00'
  | 'A10'
  | Branch<'A11'>
  | 'B20'
  | Branch<'B21'>
  | 'C30'
  | Branch<'C31'>
  | 'D40'
  | Branch<'D41'>
  | 'E50'
  | Branch<'E51'>
  | 'F60'
  | Branch<'F61'>
  | 'M65'
  | 'QM'
  | 'G70'
  | Branch<'G71'>
  | 'H80'
  | Branch<'H81'>
  | 'I90'
  | Branch<'I91'>
  | 'J100'
  | 'J110';

/** 4부 엔딩 6개 — J110 판결 × Q7 선택으로 정해진다 */
export type EndingId = Branch<'GUILTY'> | Branch<'NOTGUILTY'>;

/** 결과 이후 진실 공개 (10부). 데이터는 별도 청크에만 둔다 — 여기에는 id 이름만 있다 */
export type TruthSceneId =
  'TRUTH-GATE' | 'TRUTH-01' | 'TRUTH-02' | 'TRUTH-03' | 'TRUTH-04' | 'TRUTH-05' | 'TRUTH-END';

export type SceneId = TrialSceneId | EndingId | 'RESULT' | 'EPILOGUE' | TruthSceneId | 'END';

/* ───────── 상태 ───────── */

export type ABC = 'A' | 'B' | 'C';
export type ABCD = ABC | 'D';
export type AtoF = ABCD | 'E' | 'F';
export type AtoG = AtoF | 'G';

/**
 * 플레이어가 고른 답. 5.8 `answer_keys` 와 같은 이름. 값은 고른 선택지 기호(A~F).
 * O/L/C/P 채점은 이 객체만 입력으로 받는다 — 판결·확신도는 여기에 들어오지 않는다 (5.2, 7.3).
 */
export type Answers = {
  q1_audio: ABC;
  q2_memory: ABC;
  q3_call: ABC;
  q4_witness: ABC;
  q5_sms: ABC;
  q6_motive: ABC;
  /** 엔딩 분기에만 쓰고 성향 점수는 0 (5.2) */
  q7_priority: ABC;
  q8_inference: ABC;
  q9_last_question: ABC;
  qm_basis: ABCD;
  qg_reconsider: ABCD;
  qj_persuasion: ABCD;
  /** Q10-3 마지막 결정을 좌우한 근거 (자기보고, 보조 점수) */
  final_reason: AtoF;
};

/** 플레이어 판단 기록 (1.4). 성향 점수 0 */
export type Judgment = {
  /** Q0 최초 생각 A 공모 / B 판단 보류 / C 보호 */
  impression_start: ABC;
  confidence_start: number;
  /** M65 1번: 공모 / 강요 / 기록 해석 문제 / 결정할 수 없음 */
  impression_mid: ABCD;
  guilt_probability_mid: number;
  confidence_mid: number;
  /** M65 4번: 자백 / 목격자 / 통화 / 제보자 / 문자 / 다툼 / 해당 없음 */
  anchor_mid: AtoG;
  verdict: 'GUILTY' | 'NOT_GUILTY';
  confidence_final: number;
  /** Q10-4 끝까지 남은 의문 (필수) */
  remaining_question: AtoF;
};

/** 증거 상태 (1.4 "증거 상태(가변)"). 대본의 "저장"·"획득" 값 */
export type Evidence = {
  audio_policy?: 'PUBLIC' | 'PROTECTED' | 'DEFER';
  audio_context?: 'HEARD' | 'NOT_YET_HEARD';
  witness_exposure?: 'HIGH' | 'LOW';
  memory_policy?: 'HEAR_CURRENT' | 'FIRST_STATEMENT' | 'TRACE_CHANGE';
  call_fact?: 'VOICE_SIMILAR_NOT_IDENTIFIED' | 'RELATION_AMBIGUOUS' | 'TIMELINE_AMBIGUOUS';
  /** C31-C 에서만 true. G70 조건부 대사에 쓴다 */
  time_reveal_early: boolean;
  witness_policy?: 'BROAD_EXAM' | 'PROTECTED_EXAM' | 'DEFER_EXAM';
  x_statement?: 'DIRECT_WORDS_ONLY' | 'OBSERVED_FEAR' | 'NOT_HEARD';
  x_followup?: 'REFUSED' | 'AVAILABLE' | 'UNKNOWN';
  sms_fact?: 'DEVICE_TRACE_PRESENT' | 'DEFENDANT_EXPLANATION' | 'CONTACT_ONLY';
  sms_context?: 'LIMITED' | 'EXPLORED' | 'UNTESTED';
  sms_sender?: 'UNKNOWN';
  motive_focus?: 'SELF_INTEREST' | 'PERCEIVED_RISK' | 'TESTIMONY_LIMIT';
  priority_evidence?: 'DEATH_WINDOW' | 'VOICE' | 'MESSAGE_TRACE';
  death_time?: 'UNRESOLVED';
  voice_identity?: 'UNRESOLVED';
  sender_identity?: 'UNKNOWN';
  inference_policy?: 'FULL_ARGUMENT' | 'PINPOINT_LINK' | 'SEPARATE_FACTS';
  final_question?: 'DEFENDANT_REASON' | 'PROSECUTION_LINK' | 'DEFENSE_CORROBORATION';
};

/** 증거 아이콘 id (4b 단계의 아이콘 바). 본편에서 얻을 수 있는 것만 — TRUTH 전용 증거는 별도 청크 */
export type EvidenceId =
  | 'confession-audio'
  | 'yura-statement'
  | 'call-2212'
  | 'voice-analysis'
  | 'email-draft'
  | 'timeline'
  | 'x-statement'
  | 'anon-messages'
  | 'message-forensics'
  | 'text-2154';

export type StoryState = {
  answers: Partial<Answers>;
  evidence: Evidence;
  judgment: Partial<Judgment>;
  /** 끝까지 본 장면 (순서대로, 중복 없음) */
  visited: SceneId[];
  /** 얻은 증거 (얻은 순서) */
  acquired: EvidenceId[];
  flags: { result_completed: boolean; epilogue_completed: boolean };
};

/** 조건·질문이 가리킬 수 있는 상태 값 */
type Fields = Answers & Required<Evidence> & Judgment;
export type StateKey = keyof Fields;
export type StateValue<K extends StateKey> = Fields[K];

/** 질문의 답을 저장할 곳 (answers 또는 judgment) */
export type TargetKey = keyof Answers | keyof Judgment;
type NumberTarget = { [K in TargetKey]: Fields[K] extends number ? K : never }[TargetKey];
type ChoiceTarget = Exclude<TargetKey, NumberTarget>;

/* ───────── 조건 ───────── */

/** 문자열 식 대신 데이터로 적는 조건. 없는 키·값은 타입 오류가 난다 */
export type Cond =
  | { [K in StateKey]: { key: K; eq: StateValue<K> } }[StateKey]
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond };

/* ───────── 장면 ───────── */

/**
 * 대사 한 줄. speaker 는 대본 표기 그대로 ('검사 차윤호', '녹음 속 오지안' …) — 발언자 분류는 화면 단계에서.
 * 대본의 `**연출:**` 문단은 순서를 지키려고 같은 목록에 kind: 'direction' 으로 둔다.
 * text 안의 `**…**` 는 대본의 강조 표시 그대로다.
 */
export type Line = { speaker: string; text: string; kind?: 'direction'; when?: Cond };

export type Option = {
  key: AtoG;
  label: string;
  /** 저장할 값. 없으면 key (판결은 'GUILTY' / 'NOT_GUILTY') */
  value?: string;
  /** 고른 뒤 나오는 판사(플레이어) 대사 — Q1, Q10-1 */
  judgeLine?: string;
  /** 대본의 "이익" / "비용" / "설명" 문장 */
  benefit?: string;
  cost?: string;
  note?: string;
  /** 분기 질문이면 이 선택지가 정하는 다음 장면 */
  next?: SceneId;
  /** 이 선택지로 바뀌는 증거 상태 */
  mutation?: Partial<Evidence>;
};

export type Field =
  | { kind: 'choice'; target: ChoiceTarget; label?: string; options: Option[] }
  | {
      kind: 'slider';
      target: NumberTarget;
      label?: string;
      /** 기본 50 (Q0) */
      initial: number;
      hint?: string;
    };

/**
 * 장면 안에서 묻는 질문 하나 (Q1, QM, Q0 …). 한 화면에 여러 항목을 묶을 수 있다 (Q0 = 선택 + 확신, M65 = 4항목).
 * 모든 항목은 필수 — 채워야 다음으로 넘어간다.
 */
export type Prompt = {
  id: string;
  title: string;
  /** 질문 위에 보일 화면 문구·내부 메모 (M65 '재판이 절반을 지났습니다…', QG '재판장의 내부 메모' 등) */
  memo?: string;
  fields: Field[];
};

export type Scene = {
  id: SceneId;
  title: string;
  /** 7.1 appears_if — 이 조건이 맞는 경로에서만 들어올 수 있다 */
  appearsIf?: Cond;
  /** 7.1 speaker_lines. 조건부 대사는 when */
  lines: Line[];
  /** 대사가 모두 끝난 뒤 차례로 묻는다 (7.1 화면 규칙 2: 이의 장면은 양측 설명 뒤에 선택지) */
  prompts?: Prompt[];
  /** 대본의 "저장"·"획득" — 장면을 떠날 때 반영 */
  mutation?: Partial<Evidence>;
  /** 이 장면을 지나면 아이콘 바에 추가할 증거 */
  gain?: EvidenceId[];
  /** 대본의 "다음". 선택지에 next 가 있으면 그쪽이 우선. { ending: true } 는 판결 엔딩 규칙 */
  next: SceneId | { ending: true };
};

export type SceneMap = Partial<Record<SceneId, Scene>>;
