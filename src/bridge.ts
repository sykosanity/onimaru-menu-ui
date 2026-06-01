import type { UiOutMessage } from "./types";

declare global {
  interface Window {
    machoPost?: (payload: string) => void;
    invokeNative?: (name: string, payload: string) => void;
    cfx?: { postMessage?: (payload: string) => void };
    __ONIMARU_OUTBOUND__?: boolean;
  }
}

export function installOutboundBridge(): void {
  if (window.__ONIMARU_OUTBOUND__) return;
  window.__ONIMARU_OUTBOUND__ = true;
}

export function emitToGame(payload: Omit<UiOutMessage, "source">): boolean {
  const msg: UiOutMessage = { source: "onimaru-ui", ...payload };
  const raw = JSON.stringify(msg);
  let sent = false;

  const trySend = (fn: (() => void) | undefined) => {
    if (typeof fn !== "function") return;
    try {
      fn();
      sent = true;
    } catch {
      // ignore
    }
  };

  trySend(() => window.machoPost?.(raw));
  trySend(() => window.invokeNative?.("onimaruUi", raw));
  trySend(() => window.invokeNative?.("duiCallback", raw));
  trySend(() => window.invokeNative?.("sendDuiMessage", raw));
  trySend(() => window.cfx?.postMessage?.(raw));

  try {
    window.parent.postMessage(raw, "*");
    sent = true;
  } catch {
    // ignore
  }

  return sent;
}
