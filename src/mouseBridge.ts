/** Macho DUI often does not deliver real DOM mouse events; Lua injects normalized coords instead. */

import { clickHitToGamePayload, resolveClickAt } from "./clickResolve";
import { emitToGame } from "./bridge";

const INTERACTIVE =
  "button, .nav-item, .tab-item, .feature-row, .submenu-card, .dash-card, .scroll-ctrl, .toggle, .btn-pill, .slider-track, .dash-extend-btn";

const SCROLLABLE =
  ".dash-content, .dash-nav, .dash-tabs, .section-rows, .activity-list, .section-grid, .submenu-grid";

export type InjectedMouseType = "move" | "down" | "up" | "click" | "wheel";

export interface InjectedMouseMessage {
  action: "mouse";
  type: InjectedMouseType;
  x: number;
  y: number;
  delta?: number;
}

export function isInjectedMouseMessage(data: { action?: string; type?: string }): data is InjectedMouseMessage {
  return data.action === "mouse" && typeof data.type === "string";
}

function findScrollableParent(el: Element | null): HTMLElement | null {
  let node = el;
  while (node && node instanceof HTMLElement) {
    if (node.matches(SCROLLABLE)) return node;
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return document.querySelector(".dash-content") as HTMLElement | null;
}

function scrollAtPoint(x: number, y: number, delta: number) {
  const hit = document.elementFromPoint(x, y);
  const scroller = findScrollableParent(hit);
  if (!scroller) return;
  const step = Math.max(32, Math.min(120, Math.max(scroller.clientHeight, scroller.clientWidth) * 0.15));
  if (scroller.scrollHeight > scroller.clientHeight + 1) {
    scroller.scrollTop += delta > 0 ? step : -step;
  } else if (scroller.scrollWidth > scroller.clientWidth + 1) {
    scroller.scrollLeft += delta > 0 ? step : -step;
  }
}

let lastDownPoint: { x: number; y: number } | null = null;

function dispatchResolvedClick(x: number, y: number) {
  const hit = resolveClickAt(x, y);
  if (!hit) return;
  emitToGame(clickHitToGamePayload(hit) as Parameters<typeof emitToGame>[0]);

  const dashboard = document.getElementById("dashboard");
  if (!dashboard?.classList.contains("visible")) return;

  const el = document.elementFromPoint(x, y);
  const target = el?.closest(INTERACTIVE);
  if (target instanceof HTMLElement) {
    target.click();
  }
}

export function handleInjectedMouse(
  data: InjectedMouseMessage,
  onMove: (x: number, y: number) => void
): boolean {
  const nx = Number(data.x);
  const ny = Number(data.y);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return false;

  const x = Math.max(0, Math.min(window.innerWidth, nx * window.innerWidth));
  const y = Math.max(0, Math.min(window.innerHeight, ny * window.innerHeight));
  onMove(x, y);

  if (data.type === "wheel") {
    const delta = typeof data.delta === "number" ? data.delta : 0;
    if (delta !== 0) scrollAtPoint(x, y, delta);
    return true;
  }

  if (data.type === "move") return true;

  const dashboard = document.getElementById("dashboard");
  if (!dashboard?.classList.contains("visible")) return true;

  const hit = document.elementFromPoint(x, y);
  if (!hit || !dashboard.contains(hit)) return true;

  const target = hit.closest(INTERACTIVE);
  if (!(target instanceof HTMLElement)) return true;

  const opts: MouseEventInit = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };

  if (data.type === "down") {
    lastDownPoint = { x, y };
    target.dispatchEvent(new MouseEvent("mousedown", opts));
    return true;
  }

  if (data.type === "up") {
    target.dispatchEvent(new MouseEvent("mouseup", opts));
    if (lastDownPoint) {
      dispatchResolvedClick(lastDownPoint.x, lastDownPoint.y);
    }
    lastDownPoint = null;
    return true;
  }

  if (data.type === "click") {
    dispatchResolvedClick(x, y);
    return true;
  }

  return true;
}
