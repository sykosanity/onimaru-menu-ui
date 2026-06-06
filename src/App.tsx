import { useEffect, useMemo, useRef, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { emitToGame } from "./bridge";
import { buildMockShowUiPayload } from "./mockData";
import { handleInjectedMouse, installClickResolver, isInjectedMouseMessage } from "./mouseBridge";
import { subscribeDuiMessages } from "./duiBootstrap";
import { installOutboundBridge } from "./bridge";
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
  inputMode: "typeable",
  inputTitle: "Input",
  inputValue: "",
  keybindsVisible: false,
  keybinds: [],
  freecamVisible: false,
};

type Notice = { id: number; type: string; title: string; desc: string };
type Metric = { label: string; value: string };

function isLocalDevMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("preview") === "1" || params.get("dev") === "1") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "";
}

function isGameMode(): boolean {
  return !isLocalDevMode();
}

function scrollActiveMenuItem(displayIndex: number) {
  document.querySelector(`.feature-row[data-index="${displayIndex}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  document.querySelector(".nav-item.active")?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  document.querySelector(".tab-item.active")?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  document.querySelector(".submenu-card.active")?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
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

function toRouteLabel(label = ""): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toContractKey(...parts: Array<string | undefined>): string {
  return parts
    .filter(Boolean)
    .map((p) => (p || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, ""))
    .filter(Boolean)
    .join(".");
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

function sectionMetrics(section: string, tabs: MenuEntry[], selected?: MenuEntry): Metric[] {
  const togglesOn = tabs.filter((t) => (t.type === "checkbox" || t.type === "scrollable-checkbox" || t.type === "slider-checkbox") && t.checked).length;
  const sliders = tabs.filter((t) => t.type === "slider" || t.type === "slider-checkbox");
  const avgSlider =
    sliders.length > 0
      ? (
          sliders.reduce((acc, item) => {
            const min = item.min ?? 0;
            const max = item.max ?? 100;
            const val = item.value ?? min;
            const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
            return acc + pct;
          }, 0) / sliders.length
        ).toFixed(0) + "%"
      : "N/A";

  const common: Metric[] = [
    { label: "Section", value: section || "Overview" },
    { label: "Enabled", value: `${togglesOn}` },
    { label: "Slider Avg", value: avgSlider },
    { label: "Selected", value: selected?.label || "None" },
  ];

  switch (section.toLowerCase()) {
    case "self":
      return [
        { label: "Player State", value: togglesOn >= 2 ? "Enhanced" : "Normal" },
        { label: "Protections", value: `${togglesOn}` },
        { label: "Vitals", value: avgSlider },
        { label: "Focus", value: selected?.label || "Movement" },
      ];
    case "server":
      return [
        { label: "Session Mode", value: selected?.type === "scrollable" ? "Profiled" : "Standard" },
        { label: "Tasks", value: `${tabs.filter((t) => t.type === "button").length}` },
        { label: "Live Toggles", value: `${togglesOn}` },
        { label: "Focus", value: selected?.label || "Session" },
      ];
    case "weapon":
      return [
        { label: "Loadout", value: tabs.some((t) => t.label === "Primary") ? "Configured" : "Default" },
        { label: "Modifiers", value: `${togglesOn}` },
        { label: "Tuning", value: avgSlider },
        { label: "Focus", value: selected?.label || "Weapon" },
      ];
    case "vehicle":
      return [
        { label: "Garage", value: tabs.some((t) => t.label === "Model") ? "Ready" : "Empty" },
        { label: "Handling", value: avgSlider },
        { label: "Safety", value: `${togglesOn}` },
        { label: "Focus", value: selected?.label || "Vehicle" },
      ];
    case "teleports":
      return [
        { label: "Destinations", value: `${tabs.filter((t) => t.type === "scrollable").length}` },
        { label: "Safety Flags", value: `${togglesOn}` },
        { label: "Travel Mode", value: selected?.type === "button" ? "Execute" : "Select" },
        { label: "Focus", value: selected?.label || "Location" },
      ];
    case "settings":
      return [
        { label: "Profile", value: "Mock Default" },
        { label: "UI Toggles", value: `${togglesOn}` },
        { label: "Scale/Tuning", value: avgSlider },
        { label: "Focus", value: selected?.label || "Interface" },
      ];
    default:
      return common;
  }
}

declare global {
  interface Window {
    OnimaruUI?: {
      send: (payload: UiMessage) => void;
      preview: () => void;
      getState: () => UiState;
    };
  }
}

function RoutedApp() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [state, setState] = useState<UiState>(DEFAULT_STATE);
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const [gameCursor, setGameCursor] = useState({ x: 0, y: 0 });
  const [gameCursorOn, setGameCursorOn] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [bootAwaitingKey, setBootAwaitingKey] = useState(() => isGameMode());
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

  const useGameCursor = state.visible && !state.inputVisible && !isLocalDevMode();
  const showGameCursor = (useGameCursor || gameCursorOn) && !state.inputVisible && !isLocalDevMode();
  const keyboardPromptOpen = state.inputVisible && state.inputMode === "keybind";
  const showKeybindOverlay = bootAwaitingKey || (keyboardPromptOpen && !state.visible);
  const displayIndex = hoverIndex ?? state.index;

  useEffect(() => {
    if (!state.visible) return;
    requestAnimationFrame(() => {
      document.querySelector(".dash-content")?.scrollTo({ top: 0, behavior: "auto" });
      scrollActiveMenuItem(displayIndex);
    });
  }, [state.sidebarActive, state.categoryIndex, state.visible, displayIndex]);

  useEffect(() => {
    if (!state.visible) return;
    requestAnimationFrame(() => scrollActiveMenuItem(displayIndex));
  }, [displayIndex, state.visible, state.categoryIndex, state.sidebarActive]);

  useEffect(() => {
    document.documentElement.style.setProperty("--menu-color", state.menuColor);
    document.documentElement.style.setProperty("--menu-rgb", state.menuColor);
    document.body.classList.toggle("menu-open", state.visible);
    document.body.classList.toggle("game-cursor", showGameCursor);
    document.body.classList.toggle("keyboard-prompt", keyboardPromptOpen);
    document.body.classList.toggle("keybind-boot", showKeybindOverlay);
  }, [state.menuColor, state.visible, showGameCursor, keyboardPromptOpen, showKeybindOverlay]);

  useEffect(() => {
    if (!isLocalDevMode() || !state.visible) return;

    const onMove = (event: MouseEvent) => {
      setGameCursor({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [state.visible]);

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

  const emitUiContract = (type: string, payload: Record<string, unknown> = {}) => {
    emitToGame({
      action: "uiContract",
      contract: {
        type,
        timestamp: Date.now(),
        ...payload,
      },
    });
  };

  const runMockAction = (entry: MenuEntry) => {
    if (entry.type !== "button") return;
    showNotice("info", entry.label || "Action", "Mock action executed. Wire this label in Lua onSelect.", 1800);
  };

  const openSidebarSection = (label: string, opts?: { emit?: boolean; route?: boolean; replace?: boolean }) => {
    const emit = opts?.emit !== false;
    const route = opts?.route !== false;
    const replace = opts?.replace === true;
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

    if (emit) {
      emitToGame({ action: "openSidebar", label, index: sidebarIndex >= 0 ? sidebarIndex : 0 });
      emitUiContract("navigate.section", {
        section: label,
        key: toContractKey(label),
        index: sidebarIndex >= 0 ? sidebarIndex : 0,
      });
    }
    if (route) {
      const target = `/${toRouteLabel(label)}`;
      const current = section ? `/${section}` : "/";
      if (current !== target) navigate(target, { replace });
    }
  };

  const clickActivate = (index: number) => {
    const entry = activeTabs[index];
    if (!entry || entry.type === "divider") return;

    if (isGameMode()) {
      emitToGame({ action: "activate", index });
      return;
    }
    activateAtIndex(index);
  };

  const clickRow = (index: number) => {
    const entry = activeTabs[index];
    if (!entry || entry.type === "divider") return;

    // Submenus open on a row click. Everything else (toggles, sliders, buttons,
    // scrollables) only highlights here — the value changes ONLY when its own
    // control (toggle switch, slider track, ‹/›, Run) is clicked directly.
    if (entry.type === "subMenu" && entry.label) {
      openSidebarSection(entry.label);
      return;
    }
    selectIndex(index);
  };

  const selectIndex = (index: number) => {
    const selected = activeTabs[index];
    if (!selected || selected.type === "divider") return;
    setState((prev) => ({ ...prev, index }));
    emitToGame({ action: "select", index });
    emitUiContract("select.item", {
      section: state.sidebarActive,
      category: state.categories?.[state.categoryIndex]?.label,
      key: toContractKey(state.sidebarActive || "", state.categories?.[state.categoryIndex]?.label, selected.label),
      label: selected.label,
      index,
    });
  };

  const activateAtIndex = (index: number) => {
    const entry = activeTabs[index];
    if (!entry) return;

    if (entry.type === "subMenu" && entry.label) {
      openSidebarSection(entry.label);
      return;
    }

    if (isGameMode()) {
      return;
    }

    if (entry.type === "checkbox" || entry.type === "scrollable-checkbox" || entry.type === "slider-checkbox") {
      const newChecked = !entry.checked;
      setState((prev) => {
        const nextTabs = clone(activeTabs);
        const current = nextTabs[index];
        current.checked = newChecked;
        if (prev.categories?.length) {
          const categories = clone(prev.categories);
          categories[prev.categoryIndex] = { ...categories[prev.categoryIndex], tabs: nextTabs };
          return { ...prev, categories, elements: nextTabs, index };
        }
        return { ...prev, elements: nextTabs, index };
      });
      emitToGame({ action: "activate", index, checked: newChecked });
      emitUiContract("toggle.item", {
        section: state.sidebarActive,
        category: state.categories?.[state.categoryIndex]?.label,
        key: toContractKey(state.sidebarActive || "", state.categories?.[state.categoryIndex]?.label, entry.label),
        label: entry.label,
        checked: newChecked,
        index,
      });
      return;
    }

    setState((prev) => ({ ...prev, index }));
    emitToGame({ action: "activate", index });
    if (entry.type === "button") {
      emitUiContract("trigger.button", {
        section: state.sidebarActive,
        category: state.categories?.[state.categoryIndex]?.label,
        key: toContractKey(state.sidebarActive || "", state.categories?.[state.categoryIndex]?.label, entry.label),
        label: entry.label,
        index,
      });
    }
    if (isLocalDevMode() && entry.type === "button") {
      runMockAction(entry);
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
    emitUiContract("navigate.category", {
      section: state.sidebarActive,
      category: state.categories[index]?.label,
      key: toContractKey(state.sidebarActive || "", state.categories[index]?.label),
      index,
    });
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
    emitToGame({ action: "scroll", index, dir: dir < 0 ? "left" : "right", value: nextValue });
    emitUiContract("set.value", {
      section: state.sidebarActive,
      category: state.categories?.[state.categoryIndex]?.label,
      key: toContractKey(state.sidebarActive || "", state.categories?.[state.categoryIndex]?.label, tab.label),
      label: tab.label,
      kind: "scrollable",
      value: nextValue,
      valueLabel: tab.values?.[Math.max(0, nextValue - 1)] || "",
      index,
    });
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

    if (commit) {
      emitToGame({ action: "slider", index, value: clamped });
      emitUiContract("set.value", {
        section: state.sidebarActive,
        category: state.categories?.[state.categoryIndex]?.label,
        key: toContractKey(state.sidebarActive || "", state.categories?.[state.categoryIndex]?.label, tab.label),
        label: tab.label,
        kind: "slider",
        value: clamped,
        index,
      });
    }
  };

  const processMessage = (data: UiMessage) => {
    switch (data.action) {
      case "showUI":
      case "updateElements":
        if (data.action === "showUI" && typeof data.visible === "boolean") {
          const dash = document.getElementById("dashboard");
          dash?.classList.toggle("visible", data.visible);
          document.body.classList.toggle("menu-open", data.visible);
          if (data.visible) {
            setBootAwaitingKey(false);
            document.getElementById("boot-keybind-fallback")?.remove();
          }
          if (!isLocalDevMode()) {
            setGameCursorOn(data.visible);
          }
        }
        setState((prev) => {
          const next: UiState = { ...prev };
          if (typeof data.visible === "boolean") next.visible = data.visible;
          if (Array.isArray(data.elements)) next.elements = clone(data.elements as MenuEntry[]);
          if (typeof data.index === "number") next.index = data.index;
          if (Array.isArray(data.categories)) {
            next.categories = clone(data.categories as MenuCategory[]);
            if (Array.isArray(data.elements) && next.categories.length && typeof data.categoryIndex === "number") {
              const ci = Math.max(0, Math.min(next.categories.length - 1, data.categoryIndex));
              next.categories[ci] = { ...next.categories[ci], tabs: clone(data.elements as MenuEntry[]) };
            }
          } else if (data.action === "showUI") next.categories = null;
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
        if (typeof data.index === "number") setHoverIndex(null);
        break;
      case "keydown":
      case "highlight":
        if (typeof data.index === "number" || typeof data.index === "string") {
          const nextIndex = Number(data.index);
          if (Number.isFinite(nextIndex)) {
            setHoverIndex(null);
            setState((prev) => ({ ...prev, index: nextIndex }));
          }
        }
        break;
      case "updateBanner":
        if (typeof data.bannerColor === "string") {
          const nextColor = data.bannerColor;
          setState((prev) => ({ ...prev, menuColor: nextColor }));
        }
        break;
      case "updateKeyboard":
        if (data.visible && data.mode === "keybind") {
          setBootAwaitingKey(true);
        }
        if (!data.visible) {
          setBootAwaitingKey(false);
          document.getElementById("boot-keybind-fallback")?.remove();
        }
        if (data.value !== undefined) {
          const el = document.getElementById("boot-key-value");
          if (el) el.textContent = String(data.value) || "Waiting for key…";
        }
        setState((prev) => ({
          ...prev,
          inputVisible: !!data.visible,
          inputMode: data.mode === "keybind" || data.mode === "typeable" ? data.mode : prev.inputMode,
          inputTitle: typeof data.title === "string" ? data.title : prev.inputTitle,
          inputValue: data.value !== undefined ? String(data.value) : prev.inputValue,
        }));
        if (!data.visible) {
          setGameCursorOn(false);
        }
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
      case "setCursor":
        setGameCursorOn(!!data.visible);
        break;
      case "mouse":
        if (isInjectedMouseMessage(data)) {
          handleInjectedMouse(data, {
            onMove: (x, y) => setGameCursor({ x, y }),
            onHover: (index) => setHoverIndex(index),
          });
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    installOutboundBridge();
    installClickResolver();
    return subscribeDuiMessages((msg) => processMessage(msg));
  }, []);

  useEffect(() => {
    window.OnimaruUI = {
      send: (payload: UiMessage) => processMessage(payload),
      preview: () => processMessage(buildMockShowUiPayload()),
      getState: () => clone(state),
    };
    return () => {
      if (window.OnimaruUI) delete window.OnimaruUI;
    };
  }, [state]);

  useEffect(() => {
    if (!state.sidebar.length) return;
    if (!section) {
      const active = state.sidebarActive || state.sidebar.find((e) => e.type === "subMenu")?.label;
      if (active) navigate(`/${toRouteLabel(active)}`, { replace: true });
      return;
    }
    const matched = state.sidebar.find((e) => e.type === "subMenu" && toRouteLabel(e.label || "") === section);
    if (matched?.label && matched.label !== state.sidebarActive) {
      openSidebarSection(matched.label, { emit: false, route: false });
    }
  }, [section, state.sidebar, state.sidebarActive]);

  useEffect(() => {
    if (!isLocalDevMode()) return;
    document.body.classList.add("page-preview");
    processMessage(buildMockShowUiPayload());
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

  const dashboardMetrics = useMemo(
    () => sectionMetrics(state.sidebarActive || "", activeTabs, activeTabs[displayIndex]),
    [state.sidebarActive, activeTabs, displayIndex]
  );

  const activityItems = useMemo(() => {
    const top = activeTabs.slice(0, 8);
    return top.map((entry) => {
      if (entry.type === "slider" || entry.type === "slider-checkbox") {
        return `${entry.label || "Slider"}: ${formatSliderValue(entry)}`;
      }
      if (entry.type === "checkbox" || entry.type === "scrollable-checkbox") {
        return `${entry.label || "Toggle"}: ${entry.checked ? "ON" : "OFF"}`;
      }
      if (entry.type === "scrollable") {
        return `${entry.label || "Option"}: ${scrollableLabel(entry)}`;
      }
      return entry.label || "Entry";
    });
  }, [activeTabs]);

  return (
    <>
      {showGameCursor ? (
        <div
          id="game-cursor"
          className="game-cursor"
          style={{ left: `${gameCursor.x}px`, top: `${gameCursor.y}px` }}
          aria-hidden
        />
      ) : null}

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
                  data-label={entry.label}
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
                <button
                  className="tab-item"
                  type="button"
                  onClick={() => {
                    emitToGame({ action: "back" });
                    emitUiContract("navigate.back", {
                      section: state.sidebarActive,
                      category: state.categories?.[state.categoryIndex]?.label,
                    });
                    navigate(-1);
                  }}
                >
                  ← Back
                </button>
              )}
              {(state.categories || []).map((cat, i) => (
                <button
                  key={`${cat.label}-${i}`}
                  className={`tab-item ${i === state.categoryIndex ? "active" : ""}`}
                  type="button"
                  data-index={i}
                  onClick={() => switchCategory(i)}
                >
                  {cat.label || "Tab"}
                </button>
              ))}
            </nav>
            {/* <div className="dash-header-right"> */}
              {/* <span className="dash-hint">↑↓ navigate · ←→ adjust · Enter select</span> */}
            {/* </div> */}
          </header>

          <div className={`dash-content ${isRootSubmenuView ? "single-column" : ""}`}>
            <section className="dash-page">
              {isRootSubmenuView ? (
                <div className="submenu-grid">
                  {state.elements
                    .map((entry, index) => ({ entry, index }))
                    .filter(({ entry }) => entry.type === "subMenu")
                    .map(({ entry, index }) => (
                      <button
                        key={entry.label}
                        className={`submenu-card ${index === displayIndex ? "active" : ""}`}
                        type="button"
                        data-index={index}
                        data-label={entry.label}
                        onClick={() => entry.label && openSidebarSection(entry.label)}
                      >
                        <span className="nav-icon">{iconFor(entry.label)}</span>
                        <span className="submenu-card-title">{entry.label}</span>
                        <span className="sub-arrow" style={{ marginLeft: "auto" }}>
                          ›
                        </span>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="dashboard-layout">
                  <div className="metric-row">
                    {dashboardMetrics.map((m) => (
                      <div key={m.label} className="metric-card">
                        <span className="metric-label">{m.label}</span>
                        <strong>{m.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="content-split">
                    <div className="section-grid">
                      {groupedSections.map((section) => (
                        <div key={section.title} className="section-card">
                          <div className="section-title">{section.title}</div>
                          <div className="section-rows">
                            {section.items.map(({ entry, index }) => (
                              <div key={`${entry.label}-${index}`} className={`feature-row ${index === displayIndex ? "active" : ""}`} data-index={index} data-type={entry.type} onClick={() => clickRow(index)}>
                                <div className="feature-icon">{iconFor(entry.label)}</div>
                                <div className="feature-body">
                                  <div className="feature-label">{entry.label}</div>
                                  {entry.desc ? <div className="feature-sub">{entry.desc}</div> : null}
                                </div>
                                <div className="feature-actions" onClick={(e) => e.stopPropagation()}>
                                  {(entry.type === "scrollable" || entry.type === "scrollable-checkbox") && (
                                    <>
                                      <button type="button" className="scroll-ctrl" onClick={(e) => { e.stopPropagation(); adjustScrollable(index, -1); }}>
                                        ‹
                                      </button>
                                      <span className="scroll-value">{scrollableLabel(entry)}</span>
                                      <button type="button" className="scroll-ctrl" onClick={(e) => { e.stopPropagation(); adjustScrollable(index, 1); }}>
                                        ›
                                      </button>
                                    </>
                                  )}
                                  {(entry.type === "checkbox" || entry.type === "scrollable-checkbox" || entry.type === "slider-checkbox") && (
                                    <button type="button" className={`toggle ${entry.checked ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); clickActivate(index); }} />
                                  )}
                                  {entry.type === "button" && (
                                    <button type="button" className="btn-pill" onClick={(e) => { e.stopPropagation(); clickActivate(index); }}>
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
                      ))}
                    </div>

                    <aside className="activity-panel">
                      <div className="section-title">Activity</div>
                      <div className="activity-list">
                        {activityItems.map((text, idx) => (
                          <div key={`${text}-${idx}-activity`} className="activity-item">
                            <span className="activity-dot" />
                            <span>{text}</span>
                          </div>
                        ))}
                      </div>
                    </aside>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <div className={`desc-toast ${activeTabs[displayIndex]?.desc && state.visible ? "visible" : ""}`}>{activeTabs[displayIndex]?.desc || ""}</div>

      {keyboardPromptOpen || bootAwaitingKey ? <div className="keyboard-backdrop" aria-hidden /> : null}

      <div
        className={`input-wrapper ${state.inputVisible || bootAwaitingKey ? "visible" : ""} ${state.inputMode === "keybind" || bootAwaitingKey ? "input-keybind" : ""}`}
      >
        <div className="input-header">{bootAwaitingKey && !state.inputTitle ? "Choose Menu Key" : state.inputTitle}</div>
        <div className="input-body">
          {state.inputMode === "keybind" || bootAwaitingKey ? (
            <>
              <p className="input-hint">Press any key on your keyboard to set the menu open key.</p>
              <div className="input-key-display">{state.inputValue || "Waiting for key…"}</div>
            </>
          ) : (
            <span>{state.inputValue}</span>
          )}
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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RoutedApp />} />
        <Route path="/:section" element={<RoutedApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
