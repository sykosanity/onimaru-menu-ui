/**
 * Install the inbound DUI bridge synchronously on first import — before React mounts.
 * Lua can send messages as soon as the page loads; without this, early MachoSendDuiMessage
 * calls are lost because App only wired the bridge inside useEffect.
 */
import { installDuiMessageBridge, parseDuiPayload } from "./duiBridge";
import type { UiMessage } from "./types";

type Listener = (msg: UiMessage) => void;

const queue: UiMessage[] = [];
const listeners = new Set<Listener>();

function dispatch(msg: UiMessage) {
  hideBootFallback(msg);
  if (listeners.size === 0) {
    queue.push(msg);
    return;
  }
  listeners.forEach((fn) => {
    try {
      fn(msg);
    } catch {
      // ignore listener errors
    }
  });
}

function hideBootFallback(msg: UiMessage) {
  if (
    msg.action === "showUI" ||
    msg.action === "updateKeyboard" ||
    msg.action === "updateElements" ||
    msg.action === "showNotification"
  ) {
    document.getElementById("boot-keybind-fallback")?.remove();
  }
}

function pushRaw(raw: unknown) {
  const msg = parseDuiPayload(raw);
  if (msg) dispatch(msg);
}

installDuiMessageBridge(dispatch);

const w = window as Window & {
  __ONIMARU_PENDING__?: unknown[];
  __ONIMARU_READY__?: (msg: UiMessage) => void;
  __ONIMARU_DUI?: { push: (raw: unknown) => void };
};

w.__ONIMARU_READY__ = dispatch;
w.__ONIMARU_DUI = { push: pushRaw };

function flushEarlyPending() {
  const pending = w.__ONIMARU_PENDING__;
  if (!pending?.length) return;
  w.__ONIMARU_PENDING__ = [];
  pending.forEach(pushRaw);
}

export function subscribeDuiMessages(listener: Listener): () => void {
  listeners.add(listener);
  if (queue.length) {
    const pending = queue.splice(0, queue.length);
    pending.forEach((msg) => listener(msg));
  }
  flushEarlyPending();
  return () => listeners.delete(listener);
}

flushEarlyPending();
