/** Macho DUI often does not deliver real DOM mouse events; Lua injects normalized coords instead. */

const INTERACTIVE =
  "button, .nav-item, .tab-item, .feature-row, .submenu-card, .dash-card, .scroll-ctrl, .toggle, .btn-pill, .slider-track, .dash-extend-btn";

export type InjectedMouseType = "move" | "down" | "up" | "click";

export interface InjectedMouseMessage {
  action: "mouse";
  type: InjectedMouseType;
  x: number;
  y: number;
}

export function isInjectedMouseMessage(data: { action?: string }): data is InjectedMouseMessage {
  return data.action === "mouse" && typeof data.type === "string";
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
    target.click();
    return true;
  }

  return true;
}
