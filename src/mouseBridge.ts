/** Macho DUI often does not deliver real DOM mouse events; Lua injects normalized coords instead. */

const INTERACTIVE =
  "button, .nav-item, .tab-item, .feature-row, .submenu-card, .dash-card, .scroll-ctrl, .toggle, .btn-pill, .slider-track, .dash-extend-btn";

const SCROLLABLE = ".dash-content, .dash-nav, .section-rows, .activity-list, .section-grid";

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
  const step = Math.max(32, Math.min(120, scroller.clientHeight * 0.15));
  scroller.scrollTop += delta > 0 ? step : -step;
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
    target.dispatchEvent(new MouseEvent("mousedown", opts));
    return true;
  }

  if (data.type === "up") {
    target.dispatchEvent(new MouseEvent("mouseup", opts));
    return true;
  }

  if (data.type === "click") {
    // Visual feedback only — Lua HandleGameClick runs the real onSelect handlers.
    target.click();
    return true;
  }

  return true;
}
