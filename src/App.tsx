import { useEffect, useMemo, useRef, useState } from "react";
import { emitToGame } from "./bridge";
import type { BindItem, MenuCategory, MenuEntry, UiMessage, UiState } from "./types";

const ICONS: Record<string, string> = {
  self: "◎",
  player: "◎",
  server: "◉",
  weapon: "✦",
  vehicle: "▣",
  teleport: "⌖",
  teleports: "⌖",
  emotes: "♪",
  settings: "⚙",
  combat: "✸",
  exploits: "⚡",
  misc: "◇",
  world: "◈",
  default: "•",
};

const DEFAULT_STATE: UiState = {
  visible: false,
  elements: [],
  index: 0,
  categories: null,
  categoryIndex: 0,
  path: [],
  sidebar: [],
  sidebarActive: null,
  username: "Onimaru",
  menuColor: "139, 92, 246",
  inputVisible: false,
  inputTitle: "Input",
  inputValue: "",
  keybindsVisible: false,
  keybinds: [],
  freecamVisible: false,
};

type Notice = { id: number; type: string; title: string; desc: string };

function isLocalDevMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("preview") === "1" || params.get("dev") === "1") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "";
}

function iconFor(label = ""): string {
  const key = label.toLowerCase().replace(/[^a-z]/g, "");
  for (const k of Object.keys(ICONS)) {
    if (key.includes(k)) return ICONS[k];
  }
  return ICONS.default;
}

function formatSliderValue(entry: MenuEntry): string {
  const val = entry.value ?? entry.min ?? 0;
  return Number.isInteger(val) ? String(val) : Number(val).toFixed(2).replace(/\.?0+$/, "");
}

function scrollableLabel(entry: MenuEntry): string {
  if (!entry.values?.length) return "";
  const idx = Math.max(0, (entry.value || 1) - 1);
  return entry.values[idx] || "";
}

function isRootMenuElements(els: MenuEntry[]): boolean {
  return els.length > 0 && els.every((e) => e.type === "subMenu");
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function parsePayload(raw: unknown): UiMessage | null {
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
  }
  return null;
}

export default function App() {
  const [state, setState] = useState<UiState>(DEFAULT_STATE);
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const nextNoticeId = useRef(1);

  const activeTabs = useMemo(() => {
    if (state.categories?.length) return state.categories[state.categoryIndex]?.tabs || [];
    return state.elements || [];
  }, [state.categories, state.categoryIndex, state.elements]);

  const isRootSubmenuView = useMemo(() => {
    if (state.sidebar.length > 0) return false;
    if (state.categories?.length) return false;
    return isRootMenuElements(state.elements);
  }, [state.sidebar.length, state.categories, state.elements]);

  useEffect(() => {
    document.documentElement.style.setProperty("--menu-color", state.menuColor);
    document.documentElement.style.setProperty("--menu-rgb", state.menuColor);
    document.body.classList.toggle("menu-open", state.visible);
  }, [state.menuColor, state.visible]);

  const findSidebarEntry = (label: string, s: UiState = state): MenuEntry | undefined => {
    return s.sidebar.find((e) => e.type === "subMenu" && e.label === label) || s.elements.find((e) => e.type === "subMenu" && e.label === label);
  };

  const showNotice = (type: string, title: string, desc: string, duration = 3000) => {
    const id = nextNoticeId.current++;
    setNotifications((prev) => [...prev, { id, type, title, desc }]);
    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  };

  const openSidebarSection = (label: string) => {
    const entry = findSidebarEntry(label);
    if (!entry) return;
    const sidebarIndex = state.sidebar.findIndex((e) => e.type === "subMenu" && e.label === label);

    setState((prev) => {
      const next = { ...prev, sidebarActive: label, categoryIndex: 0, index: 0, path: ["Onimaru", label] };
      if (entry.categories?.length) {
        next.categories = clone(entry.categories);
        next.elements = next.categories[0]?.tabs || [];
      } else if (entry.subTabs?.length) {
        next.categories = null;
        next.elements = clone(entry.subTabs);
      }
      return next;
    });

    emitToGame({ action: "openSidebar", label, index: sidebarIndex >= 0 ? sidebarIndex : 0 });
  };

  const selectIndex = (index: number) => {
    if (!activeTabs[index] || activeTabs[index].type === "divider") return;
    setState((prev) => ({ ...prev, index }));
    emitToGame({ action: "select", index });
  };

  const activateAtIndex = (index: number) => {
    const entry = activeTabs[index];
    if (!entry) return;

    if (entry.type === "subMenu" && entry.label) {
      openSidebarSection(entry.label);
      return;
    }

    if (entry.type === "checkbox" || entry.type === "scrollable-checkbox" || entry.type === "slider-checkbox") {
      setState((prev) => {
        const nextTabs = clone(activeTabs);
        const current = nextTabs[index];
        current.checked = !current.checked;
        if (prev.categories?.length) {
          const categories = clone(prev.categories);
          categories[prev.categoryIndex] = { ...categories[prev.categoryIndex], tabs: nextTabs };
          return { ...prev, categories, elements: nextTabs, index };
        }
        return { ...prev, elements: nextTabs, index };
      });
      emitToGame({ action: "activate", index });
      return;
    }

    setState((prev) => ({ ...prev, index }));
    emitToGame({ action: "activate", index });
    if (isLocalDevMode() && entry.type === "button") {
      showNotice("success", entry.label || "Action", "Triggered (dev preview)", 2000);
    }
  };

  const switchCategory = (index: number) => {
    if (!state.categories?.length) return;
    setState((prev) => ({
      ...prev,
      categoryIndex: index,
      elements: clone(prev.categories?.[index]?.tabs || []),
      index: 0,
    }));
    emitToGame({ action: "category", index });
  };

  const adjustScrollable = (index: number, dir: -1 | 1) => {
    const tab = activeTabs[index];
    if (!tab?.values?.length) return;
    const n = tab.values.length;
    const value = tab.value || 1;
    const nextValue = dir < 0 ? (value - 1 < 1 ? n : value - 1) : (value + 1 > n ? 1 : value + 1);

    setState((prev) => {
      const nextTabs = clone(activeTabs);
      nextTabs[index].value = nextValue;
      if (prev.categories?.length) {
        const categories = clone(prev.categories);
        categories[prev.categoryIndex] = { ...categories[prev.categoryIndex], tabs: nextTabs };
        return { ...prev, categories, elements: nextTabs, index };
      }
      return { ...prev, elements: nextTabs, index };
    });
    emitToGame({ action: "scroll", index, dir: dir < 0 ? "left" : "right" });
  };

  const adjustSlider = (index: number, clientX: number, track: HTMLDivElement, commit: boolean) => {
    const tab = activeTabs[index];
    if (!tab) return;
    const min = tab.min ?? 0;
    const max = tab.max ?? 100;
    const step = tab.step || 1;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let val = min + pct * (max - min);
    val = Math.round(val / step) * step;
    const clamped = Math.max(min, Math.min(max, val));

    setState((prev) => {
      const nextTabs = clone(activeTabs);
      nextTabs[index].value = clamped;
      if (prev.categories?.length) {
        const categories = clone(prev.categories);
        categories[prev.categoryIndex] = { ...categories[prev.categoryIndex], tabs: nextTabs };
        return { ...prev, categories, elements: nextTabs, index };
      }
      return { ...prev, elements: nextTabs, index };
    });

    if (commit) emitToGame({ action: "slider", index, value: clamped });
  };

  const processMessage = (data: UiMessage) => {
    switch (data.action) {
      case "showUI":
      case "updateElements":
        setState((prev) => {
          const next: UiState = { ...prev };
          if (typeof data.visible === "boolean") next.visible = data.visible;
          if (Array.isArray(data.elements)) next.elements = clone(data.elements as MenuEntry[]);
          if (typeof data.index === "number") next.index = data.index;
          if (Array.isArray(data.categories)) next.categories = clone(data.categories as MenuCategory[]);
          else if (data.action === "showUI") next.categories = null;
          if (typeof data.categoryIndex === "number") next.categoryIndex = data.categoryIndex;
          if (Array.isArray(data.path)) next.path = data.path as string[];
          if (Array.isArray(data.sidebar)) next.sidebar = clone(data.sidebar as MenuEntry[]);
          if (typeof data.sidebarActive === "string") next.sidebarActive = data.sidebarActive;
          if (typeof data.username === "string") next.username = data.username;
          if (typeof data.bannerColor === "string") next.menuColor = data.bannerColor;

          if (next.sidebar.length && isRootMenuElements(next.elements) && !next.categories?.length) {
            const fallback = next.sidebarActive || next.sidebar.find((e) => e.type === "subMenu")?.label;
            if (fallback) {
              const fallbackEntry =
                next.sidebar.find((e) => e.type === "subMenu" && e.label === fallback) ||
                next.elements.find((e) => e.type === "subMenu" && e.label === fallback);
              if (fallbackEntry?.categories?.length) {
                next.sidebarActive = fallback;
                next.categories = clone(fallbackEntry.categories);
                next.categoryIndex = 0;
                next.elements = next.categories[0]?.tabs || [];
                next.index = 0;
              }
            }
          }
          return next;
        });
        break;
      case "keydown":
        if (typeof data.index === "number") setState((prev) => ({ ...prev, index: data.index }));
        break;
      case "updateBanner":
        if (typeof data.bannerColor === "string") setState((prev) => ({ ...prev, menuColor: data.bannerColor }));
        break;
      case "updateKeyboard":
        setState((prev) => ({
          ...prev,
          inputVisible: !!data.visible,
          inputTitle: typeof data.title === "string" ? data.title : prev.inputTitle,
          inputValue: data.value !== undefined ? String(data.value) : prev.inputValue,
        }));
        break;
      case "displayBinds":
        setState((prev) => ({
          ...prev,
          keybindsVisible: !!data.visible,
          keybinds: Array.isArray(data.binds) ? (data.binds as BindItem[]) : prev.keybinds,
        }));
        break;
      case "displayFreecam":
        setState((prev) => ({ ...prev, freecamVisible: !!data.visible }));
        break;
      case "showNotification":
        showNotice(String(data.type || "info"), String(data.title || "Notice"), String(data.desc || data.message || ""));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const parsed = parsePayload(ev.data);
      if (parsed) processMessage(parsed);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!isLocalDevMode()) return;
    document.body.classList.add("page-preview");
    processMessage({
      action: "showUI",
      visible: true,
      username: "Onimaru",
      path: ["Onimaru", "Self"],
      sidebarActive: "Self",
      sidebar: [
        { type: "subMenu", label: "Self" },
        { type: "subMenu", label: "Server" },
        { type: "subMenu", label: "Weapon" },
        { type: "subMenu", label: "Vehicle" },
        { type: "subMenu", label: "Teleports" },
        { type: "subMenu", label: "Settings" },
      ],
      categories: [
        {
          label: "Self",
          tabs: [
            { type: "divider", label: "Movement" },
            { type: "checkbox", label: "Noclip", checked: true, desc: "Fly through walls" },
            { type: "checkbox", label: "Freecam", checked: false },
            { type: "checkbox", label: "Fast Run", checked: false },
            { type: "slider", label: "Health", value: 200, min: 0, max: 200 },
          ],
        },
        { label: "Combat", tabs: [{ type: "checkbox", label: "Infinite Ammo", checked: false }] },
      ],
      elements: [],
    });
  }, []);

  const groupedSections = useMemo(() => {
    const sections: { title: string; items: { entry: MenuEntry; index: number }[] }[] = [];
    let current = { title: "General", items: [] as { entry: MenuEntry; index: number }[] };
    activeTabs.forEach((entry, index) => {
      if (entry.type === "divider") {
        if (current.items.length) sections.push(current);
        current = { title: entry.label || "More", items: [] };
      } else current.items.push({ entry, index });
    });
    if (current.items.length) sections.push(current);
    return sections;
  }, [activeTabs]);

  return (
    <>
      <div id="page-error">
        <div>
          <strong>Onimaru UI failed to load</strong>
          <br />
          <br />
          Build failed, check console.
        </div>
      </div>

      <div id="dashboard" className={`dashboard ${state.visible ? "visible" : ""}`}>
        <aside className="dash-sidebar">
          <div className="dash-brand">
            <span className="brand-mark" />
            <span className="brand-text">{state.username.toLowerCase()}</span>
          </div>
          <nav className="dash-nav">
            {state.sidebar
              .filter((e) => e.type === "subMenu")
              .map((entry) => (
                <button
                  type="button"
                  key={entry.label}
                  className={`nav-item ${state.sidebarActive === entry.label ? "active" : ""}`}
                  onClick={() => entry.label && openSidebarSection(entry.label)}
                >
                  <span className="nav-icon">{iconFor(entry.label)}</span>
                  <span>{entry.label}</span>
                </button>
              ))}
          </nav>
          <div className="dash-profile">
            <div className="profile-avatar" />
            <div className="profile-meta">
              <span className="profile-name">{state.username || "Player"}</span>
              <span className="profile-badge">ACTIVE</span>
            </div>
          </div>
        </aside>

        <main className="dash-main">
          <header className="dash-header">
            <nav className="dash-tabs">
              {state.path.length > 1 && (
                <button className="tab-item" type="button" onClick={() => emitToGame({ action: "back" })}>
                  ← Back
                </button>
              )}
              {(state.categories || []).map((cat, i) => (
                <button
                  key={`${cat.label}-${i}`}
                  className={`tab-item ${i === state.categoryIndex ? "active" : ""}`}
                  type="button"
                  onClick={() => switchCategory(i)}
                >
                  {cat.label || "Tab"}
                </button>
              ))}
            </nav>
            <div className="dash-header-right">
              <span className="dash-hint">↑↓ navigate · ←→ adjust · Enter select</span>
            </div>
          </header>

          <div className={`dash-content ${isRootSubmenuView ? "single-column" : ""}`}>
            {isRootSubmenuView ? (
              <div className="submenu-grid">
                {state.elements
                  .filter((e) => e.type === "subMenu")
                  .map((entry) => (
                    <button key={entry.label} className="submenu-card" type="button" onClick={() => entry.label && openSidebarSection(entry.label)}>
                      <span className="nav-icon">{iconFor(entry.label)}</span>
                      <span className="submenu-card-title">{entry.label}</span>
                      <span className="sub-arrow" style={{ marginLeft: "auto" }}>
                        ›
                      </span>
                    </button>
                  ))}
              </div>
            ) : (
              groupedSections.map((section) => (
                <div key={section.title} className="section-card">
                  <div className="section-title">{section.title}</div>
                  <div className="section-rows">
                    {section.items.map(({ entry, index }) => (
                      <div key={`${entry.label}-${index}`} className={`feature-row ${index === state.index ? "active" : ""}`} onClick={() => selectIndex(index)}>
                        <div className="feature-icon">{iconFor(entry.label)}</div>
                        <div className="feature-body">
                          <div className="feature-label">{entry.label}</div>
                          {entry.desc ? <div className="feature-sub">{entry.desc}</div> : null}
                        </div>
                        <div className="feature-actions">
                          {(entry.type === "scrollable" || entry.type === "scrollable-checkbox") && (
                            <>
                              <button type="button" className="scroll-ctrl" onClick={() => adjustScrollable(index, -1)}>
                                ‹
                              </button>
                              <span className="scroll-value">{scrollableLabel(entry)}</span>
                              <button type="button" className="scroll-ctrl" onClick={() => adjustScrollable(index, 1)}>
                                ›
                              </button>
                            </>
                          )}
                          {(entry.type === "checkbox" || entry.type === "scrollable-checkbox" || entry.type === "slider-checkbox") && (
                            <button type="button" className={`toggle ${entry.checked ? "on" : ""}`} onClick={() => activateAtIndex(index)} />
                          )}
                          {entry.type === "button" && (
                            <button type="button" className="btn-pill" onClick={() => activateAtIndex(index)}>
                              Run
                            </button>
                          )}
                          {(entry.type === "slider" || entry.type === "slider-checkbox") && (
                            <SliderControl entry={entry} onSet={(x, el, commit) => adjustSlider(index, x, el, commit)} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <div className={`desc-toast ${activeTabs[state.index]?.desc && state.visible ? "visible" : ""}`}>{activeTabs[state.index]?.desc || ""}</div>

      <div className={`input-wrapper ${state.inputVisible ? "visible" : ""}`}>
        <div className="input-header">{state.inputTitle}</div>
        <div className="input-body">
          <span>{state.inputValue}</span>
        </div>
      </div>

      <div className={`kbl-wrapper ${state.keybindsVisible ? "visible" : ""}`}>
        <div className="kbl-header">
          <span className="kbl-icon">⌨</span> Keybinds
        </div>
        <div className="kbl-list">
          {state.keybinds.map((b, i) => (
            <div className="kbl-row" key={`${b.label}-${i}`}>
              <span>{b.label || ""}</span>
              <span>{b.keyLabel || b.key || ""}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="notifications">
        {notifications.map((n) => (
          <div key={n.id} className={`notification show ${n.type}`}>
            <div className="notification-title">{n.title}</div>
            <div className="notification-desc">{n.desc}</div>
          </div>
        ))}
      </div>

      <div className={`fc-wrapper ${state.freecamVisible ? "visible" : ""}`}>
        {["Default", "Teleport", "Shoot Weapon", "Kick from Vehicle", "Hijack Vehicle", "Delete Vehicle"].map((o, i) => (
          <div key={o} className={`fc-option ${i === 0 ? "selected" : ""}`}>
            {o}
          </div>
        ))}
      </div>
    </>
  );
}

function SliderControl({
  entry,
  onSet,
}: {
  entry: MenuEntry;
  onSet: (clientX: number, el: HTMLDivElement, commit: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const drag = useRef(false);
  const min = entry.min ?? 0;
  const max = entry.max ?? 100;
  const val = entry.value ?? min;
  const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current || !ref.current) return;
      onSet(e.clientX, ref.current, false);
    };
    const up = (e: PointerEvent) => {
      if (!drag.current || !ref.current) return;
      onSet(e.clientX, ref.current, true);
      drag.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [onSet]);

  return (
    <div className="slider-wrap">
      <div
        ref={ref}
        className="slider-track"
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={val}
        onPointerDown={(e) => {
          if (!ref.current) return;
          drag.current = true;
          onSet(e.clientX, ref.current, false);
        }}
      >
        <div className="slider-fill" style={{ width: `${pct}%` }} />
        <div className="slider-thumb" style={{ left: `${pct}%` }} />
      </div>
      <span className="slider-num">{formatSliderValue(entry)}</span>
    </div>
  );
}
