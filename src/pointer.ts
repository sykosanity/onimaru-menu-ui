/** Single source of truth: normalized DUI coords → screen pixels → DOM hit. */

const IGNORE_IDS = new Set(["game-cursor"]);
const IGNORE_SELECTORS = [".keyboard-backdrop", ".desc-toast", ".notifications", "#page-error"];

export interface ScreenPoint {
  x: number;
  y: number;
}

export function viewportSize(): { width: number; height: number } {
  return {
    width: document.documentElement.clientWidth || window.innerWidth || 1,
    height: document.documentElement.clientHeight || window.innerHeight || 1,
  };
}

/** Convert Macho normalized pointer (0–1) to DUI pixel coordinates. */
export function pointerFromNorm(nx: number, ny: number): ScreenPoint {
  const { width, height } = viewportSize();
  return {
    x: Math.max(0, Math.min(width - 1, nx * width)),
    y: Math.max(0, Math.min(height - 1, ny * height)),
  };
}

function shouldIgnore(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return true;
  if (IGNORE_IDS.has(el.id)) return true;
  for (const sel of IGNORE_SELECTORS) {
    if (el.matches(sel) || el.closest(sel)) return true;
  }
  return false;
}

/** Topmost visible element under the pointer (skips cursor overlay). */
export function elementAtPoint(x: number, y: number): Element | null {
  if (typeof document.elementsFromPoint === "function") {
    for (const el of document.elementsFromPoint(x, y)) {
      if (!shouldIgnore(el)) return el;
    }
    return null;
  }
  const hit = document.elementFromPoint(x, y);
  if (!hit || shouldIgnore(hit)) return null;
  return hit;
}

export function normFromPointer(x: number, y: number): { nx: number; ny: number } {
  const { width, height } = viewportSize();
  return { nx: x / width, ny: y / height };
}
