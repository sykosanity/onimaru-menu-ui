import type { UiOutMessage } from "./types";

declare global {
  interface Window {
    machoPost?: (payload: string) => void;
    invokeNative?: (name: string, payload: string) => void;
  }
}

export function emitToGame(payload: Omit<UiOutMessage, "source">): boolean {
  const msg: UiOutMessage = { source: "onimaru-ui", ...payload };
  const raw = JSON.stringify(msg);
  let sent = false;

  try {
    if (typeof window.machoPost === "function") {
      window.machoPost(raw);
      sent = true;
    }
  } catch {
    // ignore
  }

  try {
    if (typeof window.invokeNative === "function") {
      window.invokeNative("onimaruUi", raw);
      sent = true;
    }
  } catch {
    // ignore
  }

  try {
    window.parent.postMessage(raw, "*");
    sent = true;
  } catch {
    // ignore
  }

  return sent;
}
