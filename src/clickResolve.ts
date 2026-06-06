/** Resolve screen clicks/hover using the real DOM layout. */

import { elementAtPoint } from "./pointer";

export type ClickHit =
  | { kind: "sidebar"; label: string }
  | { kind: "category"; index: number }
  | { kind: "submenu"; label: string; index: number }
  | { kind: "select"; index: number }
  | { kind: "activate"; index: number; checked?: boolean }
  | { kind: "scroll"; index: number; dir: "left" | "right" }
  | { kind: "slider"; index: number; value: number }
  | { kind: "back" };

export type HoverTarget =
  | { kind: "row"; index: number }
  | { kind: "submenu"; index: number }
  | { kind: "nav"; label: string }
  | { kind: "tab"; index: number };

export type MenuEntryType =
  | "checkbox"
  | "scrollable-checkbox"
  | "slider-checkbox"
  | "button"
  | "scrollable"
  | "slider"
  | "subMenu"
  | "divider";

function readIndex(el: Element | null): number | null {
  if (!el) return null;
  const raw = el.closest("[data-index]")?.getAttribute("data-index");
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function entryTypeFromRow(row: Element | null): MenuEntryType | null {
  if (!(row instanceof HTMLElement)) return null;
  const raw = row.getAttribute("data-type");
  return raw as MenuEntryType | null;
}

function isActivatable(type: MenuEntryType | null): boolean {
  return (
    type === "checkbox" ||
    type === "scrollable-checkbox" ||
    type === "slider-checkbox" ||
    type === "button" ||
    type === "scrollable"
  );
}

function dashboardVisible(): HTMLElement | null {
  const dashboard = document.getElementById("dashboard");
  return dashboard?.classList.contains("visible") ? dashboard : null;
}

export function resolveHoverAt(x: number, y: number): HoverTarget | null {
  const dashboard = dashboardVisible();
  if (!dashboard) return null;

  const hit = elementAtPoint(x, y);
  if (!hit || !dashboard.contains(hit)) return null;

  const nav = hit.closest(".nav-item");
  if (nav instanceof HTMLElement) {
    const label = nav.getAttribute("data-label") || nav.querySelector("span:last-child")?.textContent?.trim();
    if (label) return { kind: "nav", label };
  }

  const tab = hit.closest(".tab-item");
  if (tab instanceof HTMLElement && !tab.textContent?.includes("Back")) {
    const idx = readIndex(tab);
    if (idx != null) return { kind: "tab", index: idx };
  }

  const row = hit.closest(".feature-row");
  if (row) {
    const index = readIndex(row);
    if (index != null) return { kind: "row", index };
  }

  const submenu = hit.closest(".submenu-card");
  if (submenu) {
    const index = readIndex(submenu);
    if (index != null) return { kind: "submenu", index };
  }

  return null;
}

export function resolveClickAt(x: number, y: number): ClickHit | null {
  const dashboard = dashboardVisible();
  if (!dashboard) return null;

  const hit = elementAtPoint(x, y);
  if (!hit || !dashboard.contains(hit)) return null;

  const backBtn = hit.closest(".tab-item");
  if (backBtn instanceof HTMLElement && backBtn.textContent?.includes("Back")) {
    return { kind: "back" };
  }

  const nav = hit.closest(".nav-item");
  if (nav instanceof HTMLElement) {
    const label = nav.getAttribute("data-label") || nav.querySelector("span:last-child")?.textContent?.trim();
    if (label) return { kind: "sidebar", label };
  }

  const tab = hit.closest(".tab-item");
  if (tab instanceof HTMLElement) {
    const idx = readIndex(tab);
    if (idx != null) return { kind: "category", index: idx };
  }

  const submenu = hit.closest(".submenu-card");
  if (submenu instanceof HTMLElement) {
    const idx = readIndex(submenu);
    const label = submenu.getAttribute("data-label") || submenu.querySelector(".submenu-card-title")?.textContent?.trim();
    if (label && idx != null) return { kind: "submenu", label, index: idx };
  }

  if (hit.closest(".scroll-ctrl")) {
    const row = hit.closest(".feature-row");
    const index = readIndex(row);
    if (index == null) return null;
    const ctrl = hit.closest(".scroll-ctrl");
    const text = ctrl?.textContent?.trim();
    return { kind: "scroll", index, dir: text === "‹" ? "left" : "right" };
  }

  const sliderTrack = hit.closest(".slider-track");
  if (sliderTrack instanceof HTMLElement) {
    const row = hit.closest(".feature-row");
    const index = readIndex(row);
    if (index == null) return null;
    const rect = sliderTrack.getBoundingClientRect();
    const pct = rect.width > 0 ? Math.max(0, Math.min(1, (x - rect.left) / rect.width)) : 0;
    return { kind: "slider", index, value: pct };
  }

  if (hit.closest(".toggle, .btn-pill")) {
    const row = hit.closest(".feature-row");
    const index = readIndex(row);
    if (index != null) return { kind: "activate", index };
  }

  const row = hit.closest(".feature-row");
  if (row instanceof HTMLElement) {
    const index = readIndex(row);
    if (index == null) return null;
    const type = entryTypeFromRow(row);
    if (isActivatable(type)) return { kind: "activate", index };
    return { kind: "select", index };
  }

  return null;
}

export function clickHitToGamePayload(hit: ClickHit): Record<string, unknown> {
  switch (hit.kind) {
    case "sidebar":
      return { action: "openSidebar", label: hit.label };
    case "category":
      return { action: "category", index: hit.index };
    case "submenu":
      return { action: "openSidebar", label: hit.label };
    case "select":
      return { action: "select", index: hit.index };
    case "activate":
      return { action: "activate", index: hit.index, checked: hit.checked };
    case "scroll":
      return { action: "scroll", index: hit.index, dir: hit.dir };
    case "slider":
      return { action: "slider", index: hit.index, pct: hit.value };
    case "back":
      return { action: "back" };
  }
}

export function hoverTargetToRowIndex(target: HoverTarget | null): number | null {
  if (!target) return null;
  if (target.kind === "row" || target.kind === "submenu") return target.index;
  return null;
}
