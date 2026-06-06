/** Macho DUI: Lua sends normalized pointer; UI maps pixels → DOM hits (WYSIWYG). */

import { clickHitToGamePayload, resolveClickAt, resolveHoverAt, hoverTargetToRowIndex } from "./clickResolve";
import type { HoverTarget } from "./clickResolve";
import { emitToGame } from "./bridge";
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

function dispatchResolvedClick(x: number, y: number) {
  const hit = resolveClickAt(x, y);
  if (!hit) return;
  emitToGame(clickHitToGamePayload(hit) as Parameters<typeof emitToGame>[0]);
}

// While the pointer is held on a slider track, drag updates the value live.
let sliderDrag: { index: number; track: HTMLElement } | null = null;

function sliderTrackAt(x: number, y: number): { index: number; track: HTMLElement } | null {
  const hit = elementAtPoint(x, y);
  const track = hit?.closest(".slider-track");
  if (!(track instanceof HTMLElement)) return null;
  const raw = track.closest(".feature-row")?.getAttribute("data-index");
  const index = raw == null ? NaN : Number(raw);
  return Number.isFinite(index) ? { index, track } : null;
}

function emitSliderAt(drag: { index: number; track: HTMLElement }, x: number) {
  const rect = drag.track.getBoundingClientRect();
  if (rect.width <= 0) return;
  const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
  emitToGame({ action: "slider", index: drag.index, pct } as Parameters<typeof emitToGame>[0]);
}

export function installClickResolver(): void {
  const w = window as Window & { __onimaruResolveClick?: (x: number, y: number) => boolean };
  w.__onimaruResolveClick = (x: number, y: number) => {
    dispatchResolvedClick(x, y);
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
    if (sliderDrag) {
      emitSliderAt(sliderDrag, x);
    }
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
    sliderDrag = sliderTrackAt(x, y);
    if (sliderDrag) emitSliderAt(sliderDrag, x);
    reportHover(x, y, handlers);
    return true;
  }

  if (data.type === "up" || data.type === "click") {
    if (sliderDrag) {
      emitSliderAt(sliderDrag, x);
      sliderDrag = null;
    } else {
      dispatchResolvedClick(x, y);
    }
    reportHover(x, y, handlers);
    return true;
  }

  return true;
}
