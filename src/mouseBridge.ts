/**
 * Macho DUI input bridge.
 *
 * Lua streams the in-game pointer as normalized coords + synthetic mouse events.
 * Instead of re-deriving "what was clicked" with a parallel resolver, we replay the
 * pointer as REAL DOM events on the element under the cursor. React's own handlers
 * (clickRow, clickActivate, adjustSlider, openSidebarSection, ...) then fire exactly
 * like they do for a real browser click — so in-game behaviour matches the browser 1:1.
 */

import { resolveHoverAt, hoverTargetToRowIndex } from "./clickResolve";
import type { HoverTarget } from "./clickResolve";
import { elementAtPoint, pointerFromNorm } from "./pointer";

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

export interface MouseBridgeHandlers {
  onMove: (x: number, y: number) => void;
  onHover?: (rowIndex: number | null, target: HoverTarget | null) => void;
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
  const hit = elementAtPoint(x, y);
  const scroller = findScrollableParent(hit);
  if (!scroller) return;
  const step = Math.max(32, Math.min(120, Math.max(scroller.clientHeight, scroller.clientWidth) * 0.15));
  if (scroller.scrollHeight > scroller.clientHeight + 1) {
    scroller.scrollTop += delta > 0 ? step : -step;
  } else if (scroller.scrollWidth > scroller.clientWidth + 1) {
    scroller.scrollLeft += delta > 0 ? step : -step;
  }
}

function reportHover(x: number, y: number, handlers: MouseBridgeHandlers) {
  const target = resolveHoverAt(x, y);
  handlers.onHover?.(hoverTargetToRowIndex(target), target);
}

function fireMouse(target: EventTarget, type: string, x: number, y: number) {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0, clientX: x, clientY: y }),
  );
}

function firePointer(target: EventTarget, type: string, x: number, y: number) {
  const Ctor = (window as unknown as { PointerEvent?: typeof PointerEvent }).PointerEvent;
  if (Ctor) {
    target.dispatchEvent(
      new Ctor(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
      }),
    );
  } else {
    fireMouse(target, type === "pointerdown" ? "mousedown" : type === "pointerup" ? "mouseup" : "mousemove", x, y);
  }
}

let pressed = false;

/** Optional hook kept for Lua-side forced resolution: replays a click at a pixel. */
export function installClickResolver(): void {
  const w = window as Window & { __onimaruResolveClick?: (x: number, y: number) => boolean };
  w.__onimaruResolveClick = (x: number, y: number) => {
    const el = elementAtPoint(x, y);
    if (!el) return false;
    firePointer(el, "pointerdown", x, y);
    firePointer(window, "pointerup", x, y);
    fireMouse(el, "click", x, y);
    return true;
  };
}

export function handleInjectedMouse(data: InjectedMouseMessage, handlers: MouseBridgeHandlers): boolean {
  const nx = Number(data.x);
  const ny = Number(data.y);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return false;

  const { x, y } = pointerFromNorm(nx, ny);
  handlers.onMove(x, y);

  if (data.type === "move") {
    // While the button is held, replay drag so sliders (pointermove on window) track live.
    if (pressed) firePointer(window, "pointermove", x, y);
    reportHover(x, y, handlers);
    return true;
  }

  if (data.type === "wheel") {
    const delta = typeof data.delta === "number" ? data.delta : 0;
    if (delta !== 0) scrollAtPoint(x, y, delta);
    reportHover(x, y, handlers);
    return true;
  }

  const dashboard = document.getElementById("dashboard");
  if (!dashboard?.classList.contains("visible")) return true;

  if (data.type === "down") {
    const el = elementAtPoint(x, y);
    if (el) {
      pressed = true;
      firePointer(el, "pointerdown", x, y);
      fireMouse(el, "mousedown", x, y);
    }
    reportHover(x, y, handlers);
    return true;
  }

  if (data.type === "up" || data.type === "click") {
    const el = elementAtPoint(x, y);
    // Pointerup on window first so any active slider drag commits its final value.
    firePointer(window, "pointerup", x, y);
    if (el) {
      fireMouse(el, "mouseup", x, y);
      // A real browser only emits "click" when up lands on the press target; for a
      // single in-game tap that is the same element, so this mirrors browser behaviour.
      fireMouse(el, "click", x, y);
    }
    pressed = false;
    reportHover(x, y, handlers);
    return true;
  }

  return true;
}
