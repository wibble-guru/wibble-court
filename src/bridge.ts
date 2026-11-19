/**
 * 위블 사이트(호스트) <-> 이 게임 간 postMessage 규약 — 게임 쪽 구현.
 * 호스트 쪽 구현: wibble 사이트 `src/lib/game-bridge.ts`, 문서: `docs/api.md` "게임 연동".
 *
 *   game -> host  { source: "psytest-game", type: "ready" }            (init을 받을 때까지 300ms마다)
 *   host -> game  { source: "psytest-host", type: "init", slug, theme }
 *   game -> host  { source: "psytest-game", type: "result", resultId } (init에서 받은 origin으로만)
 *
 * iframe 밖에서 단독으로 열면(로컬 개발) 호스트 없이 바로 시작한다.
 * 이때 `?slug=&theme=horror` 쿼리로 값을 흉내 낼 수 있다.
 */

export type Theme = "default" | "horror";

export type HostContext = {
  /** 위블 사이트 iframe 안에서 실행 중인지. false면 결과를 화면에 직접 보여 준다. */
  embedded: boolean;
  slug: string;
  theme: Theme;
};

type InitMessage = { source: "psytest-host"; type: "init"; slug: string; theme: Theme };

/** 사이트와 같은 규칙. 결과 id는 URL에 그대로 들어간다. */
export const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

const DEFAULT_SLUG = "court";
const READY_INTERVAL_MS = 300;

/**
 * init을 받아도 되는 사이트 주소 목록 (쉼표 구분). 비워 두면 어떤 부모 페이지든 받는다.
 * 운영 빌드에서는 `VITE_ALLOWED_HOST_ORIGINS=https://wibble.guru` 처럼 채워 두자.
 */
const allowedHostOrigins = (import.meta.env.VITE_ALLOWED_HOST_ORIGINS ?? "")
  .split(",")
  .map((s: string) => s.trim())
  .filter(Boolean);

let hostOrigin: string | null = null;

function isInitMessage(data: unknown): data is InitMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.source === "psytest-host" &&
    msg.type === "init" &&
    typeof msg.slug === "string" &&
    (msg.theme === "default" || msg.theme === "horror")
  );
}

function standaloneContext(): HostContext {
  const params = new URLSearchParams(window.location.search);
  return {
    embedded: false,
    slug: params.get("slug") || DEFAULT_SLUG,
    theme: params.get("theme") === "horror" ? "horror" : "default",
  };
}

/** 호스트와 연결한다. iframe 안이면 init을 받을 때까지 기다리고, 아니면 바로 단독 모드로 시작. */
export function connectToHost(): Promise<HostContext> {
  if (window.parent === window) return Promise.resolve(standaloneContext());

  return new Promise((resolve) => {
    const sendReady = () => window.parent.postMessage({ source: "psytest-game", type: "ready" }, "*");

    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent || !isInitMessage(event.data)) return;
      if (allowedHostOrigins.length > 0 && !allowedHostOrigins.includes(event.origin)) return;
      hostOrigin = event.origin;
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
      resolve({ embedded: true, slug: event.data.slug, theme: event.data.theme });
    }

    window.addEventListener("message", onMessage);
    const timer = window.setInterval(sendReady, READY_INTERVAL_MS);
    sendReady();
  });
}

/**
 * 결과를 호스트에 알린다. 호스트는 `/t/{slug}/result/{resultId}`로 이동한다.
 * 단독 모드이거나 보낼 수 없으면 false — 그때는 게임이 결과를 직접 보여 준다.
 */
export function sendResult(resultId: string): boolean {
  if (!ID_PATTERN.test(resultId)) throw new Error(`잘못된 결과 id: ${resultId}`);
  if (!hostOrigin) return false;
  window.parent.postMessage({ source: "psytest-game", type: "result", resultId }, hostOrigin);
  return true;
}
