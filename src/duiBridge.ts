import type { UiMessage } from "./types";

export function parseDuiPayload(raw: unknown): UiMessage | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as UiMessage;
    } catch {
      return null;
    }
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.action === "string") return obj as UiMessage;
    if (typeof obj.data === "string") {
      try {
        return JSON.parse(obj.data) as UiMessage;
      } catch {
        return null;
      }
    }
    if (obj.payload != null) return parseDuiPayload(obj.payload);
  }

  return null;
}

export function installDuiMessageBridge(handler: (msg: UiMessage) => void): void {
  const dispatch = (raw: unknown) => {
    const msg = parseDuiPayload(raw);
    if (msg) handler(msg);
  };

  window.addEventListener("message", (event) => dispatch(event.data));

  const w = window as Window & {
    onDuiMessage?: (raw: unknown) => void;
    receiveDuiMessage?: (raw: unknown) => void;
    DuiMessage?: (raw: unknown) => void;
    __ONIMARU_DUI?: { push: (raw: unknown) => void };
  };

  w.onDuiMessage = dispatch;
  w.receiveDuiMessage = dispatch;
  w.DuiMessage = dispatch;
  w.__ONIMARU_DUI = { push: dispatch };
}
