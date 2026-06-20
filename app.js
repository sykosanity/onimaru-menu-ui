(function () {
    function boot() {
    const ICONS = {
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

    const state = {
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
    };

    const dashboard = document.getElementById("dashboard");
    const sidebarNav = document.getElementById("sidebar-nav");
    const tabNav = document.getElementById("tab-nav");
    const contentEl = document.getElementById("content");
    const brandEl = document.getElementById("brand");
    const profileName = document.getElementById("profile-name");
    const descEl = document.getElementById("desc-toast");
    const inputWrap = document.getElementById("input-wrapper");
    const inputTitle = document.getElementById("input-title");
    const inputValue = document.getElementById("input-value");
    const kblWrap = document.getElementById("kbl-wrapper");
    const kblList = document.getElementById("kbl-list");
    const notifWrap = document.getElementById("notifications");
    const fcWrap = document.getElementById("fc-wrapper");
    const extendBtn = document.getElementById("extend-btn");
    let isExpanded = false;

    if (!dashboard || !sidebarNav || !contentEl) {
        document.body.classList.add("load-failed");
        return;
    }

    function setMenuColor(rgb) {
        if (!rgb) return;
        state.menuColor = rgb;
        document.documentElement.style.setProperty("--menu-color", rgb);
        document.documentElement.style.setProperty("--menu-rgb", rgb);
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function iconFor(label) {
        const key = (label || "").toLowerCase().replace(/[^a-z]/g, "");
        for (const k of Object.keys(ICONS)) {
            if (key.includes(k)) return ICONS[k];
        }
        return ICONS.default;
    }

    function formatSliderValue(entry) {
        const val = entry.value ?? entry.min ?? 0;
        if (Number.isInteger(val)) return String(val);
        return Number(val).toFixed(2).replace(/\.?0+$/, "");
    }

    function scrollableLabel(entry) {
        if (!entry.values || !entry.values.length) return "";
        const idx = Math.max(0, (entry.value || 1) - 1);
        return entry.values[idx] || "";
    }

    function getActiveTabs() {
        if (state.categories && state.categories.length) {
            const cat = state.categories[state.categoryIndex];
            return cat && cat.tabs ? cat.tabs : [];
        }
        return state.elements || [];
    }

    function isRootMenuElements(els) {
        const list = els || [];
        return list.length > 0 && list.every((e) => e.type === "subMenu");
    }

    /** Legacy full-screen grid only when there is no sidebar nav. */
    function isRootSubmenuView() {
        if (state.sidebar.length > 0) return false;
        if (state.categories && state.categories.length) return false;
        return isRootMenuElements(state.elements);
    }

    function findSidebarMenuIndex(label) {
        const source = state.sidebar.length ? state.sidebar : state.elements;
        return source.findIndex((e) => e.type === "subMenu" && e.label === label);
    }

    function loadSidebarSection(label) {
        const entry =
            state.sidebar.find((e) => e.type === "subMenu" && e.label === label) ||
            state.elements.find((e) => e.type === "subMenu" && e.label === label);
        if (!entry) return false;

        state.sidebarActive = label;
        state.index = 0;

        if (entry.categories?.length) {
            state.categories = entry.categories;
            const catIdx = Math.max(0, Math.min(entry.categories.length - 1, state.categoryIndex || 0));
            state.categoryIndex = catIdx;
            state.elements = entry.categories[catIdx].tabs || [];
        } else if (entry.subTabs?.length) {
            state.categories = null;
            state.elements = entry.subTabs;
        } else {
            return false;
        }
        return true;
    }

    function ensureSidebarContent() {
        if (!state.sidebar.length) return;

        const atRoot = isRootMenuElements(state.elements) && !(state.categories && state.categories.length);

        if (!atRoot) {
            if (!state.sidebarActive && state.path && state.path.length > 1) {
                state.sidebarActive = state.path[1];
            }
            return;
        }

        if (!state.sidebarActive) {
            const first = state.sidebar.find((e) => e.type === "subMenu");
            if (first) state.sidebarActive = first.label;
        }
        if (state.sidebarActive) {
            loadSidebarSection(state.sidebarActive);
        }
    }

    function openSidebarSection(label) {
        if (!loadSidebarSection(label)) {
            if (isGameMode()) emitToGame({ action: "openSidebar", label });
            return;
        }
        state.path = ["Onimaru", label];
        state.sidebarActive = label;
        emitToGame({ action: "openSidebar", label });
        render();
    }

    function cloneData(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function mutateActiveTabs(mutator) {
        if (state.categories && state.categories.length) {
            const tabs = state.categories[state.categoryIndex].tabs;
            if (tabs) mutator(tabs);
            state.elements = tabs;
        } else {
            mutator(state.elements);
        }
    }

    function pushUpdate() {
        const payload = {
            action: "updateElements",
            elements: cloneData(state.elements),
            categoryIndex: state.categoryIndex,
            index: state.index,
            sidebar: state.sidebar,
            sidebarActive: state.sidebarActive,
            path: state.path,
            username: state.username,
        };
        if (state.categories) payload.categories = cloneData(state.categories);
        processMessage(payload);
    }

    function selectIndex(index) {
        const tabs = getActiveTabs();
        if (!tabs.length) return;
        if (tabs[index]?.type === "divider") return;
        state.index = index;
        emitToGame({ action: "select", index });
        render();
    }

    function switchCategory(index) {
        if (!state.categories || !state.categories.length) return;
        state.categoryIndex = index;
        state.elements = state.categories[index].tabs || [];
        state.index = 0;
        emitToGame({ action: "category", index });
        render();
    }

    function rowActivatesOnClick(entry) {
        if (!entry || entry.type === "divider") return false;
        const t = entry.type;
        return (
            t === "checkbox" ||
            t === "button" ||
            t === "slider" ||
            t === "slider-checkbox" ||
            t === "scrollable-checkbox" ||
            t === "scrollable" ||
            t === "subMenu"
        );
    }

    function handleFeatureRowClick(idx, x, y, row, clickTarget) {
        const entry = getActiveTabs()[idx];
        if (!entry || entry.type === "divider") return;

        state.index = idx;

        if (entry.type === "slider-checkbox") {
            if (clickTarget && clickTarget.closest(".toggle")) {
                toggleAtIndex(idx);
                return;
            }
            const track = row.querySelector(".slider-track");
            if (track && clickTarget && (clickTarget.closest(".slider-wrap") || clickTarget.closest(".slider-track") || clickTarget.closest(".slider-num"))) {
                adjustSlider(idx, x, track);
                return;
            }
            toggleAtIndex(idx);
            return;
        }

        if (entry.type === "slider") {
            const track = row.querySelector(".slider-track");
            if (track) {
                adjustSlider(idx, x, track);
                return;
            }
            activateAtIndex(idx);
            return;
        }

        if (entry.type === "checkbox" || entry.type === "scrollable-checkbox") {
            toggleAtIndex(idx);
            return;
        }

        if (rowActivatesOnClick(entry)) {
            activateAtIndex(idx);
            return;
        }

        selectIndex(idx);
    }

    function rectContains(el, x, y) {
        const r = el.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    function findMenuTargetAt(x, y) {
        const stack =
            typeof document.elementsFromPoint === "function"
                ? document.elementsFromPoint(x, y)
                : [document.elementFromPoint(x, y)].filter(Boolean);

        const pairs = [
            [".toggle", "toggle"],
            [".scroll-ctrl", "scroll"],
            [".scroll-value", "scroll-value"],
            [".slider-track", "slider"],
            [".slider-num", "slider-num"],
            [".btn-pill", "pill"],
            [".tab-item", "tab"],
            [".nav-item", "nav"],
            [".submenu-card", "subcard"],
            [".feature-row", "row"],
        ];

        for (const [selector, kind] of pairs) {
            for (const el of stack) {
                if (!(el instanceof HTMLElement)) continue;
                if (el.id === "game-cursor") continue;
                const target = el.closest(selector);
                if (target && dashboard.contains(target)) {
                    return { kind, target };
                }
            }
        }

        // CEF/Macho DUI often fails elementsFromPoint for injected clicks — fall back to bounds.
        const rectPairs = [
            [".toggle", "toggle"],
            [".btn-pill", "pill"],
            [".slider-track", "slider"],
            [".scroll-ctrl", "scroll"],
            [".tab-item", "tab"],
            [".nav-item", "nav"],
            [".submenu-card", "subcard"],
            [".feature-row", "row"],
        ];
        for (const [selector, kind] of rectPairs) {
            const nodes = dashboard.querySelectorAll(selector);
            for (let i = nodes.length - 1; i >= 0; i--) {
                const node = nodes[i];
                if (rectContains(node, x, y)) {
                    return { kind, target: node };
                }
            }
        }

        return null;
    }

    function adjustScrollable(index, dir) {
        mutateActiveTabs((tabs) => {
            const tab = tabs[index];
            if (!tab || !tab.values?.length) return;
            tab.value = tab.value || 1;
            const n = tab.values.length;
            tab.value = dir < 0 ? tab.value - 1 : tab.value + 1;
            if (tab.value < 1) tab.value = n;
            if (tab.value > n) tab.value = 1;
        });
        state.index = index;
        afterLocalChange({
            action: "scroll",
            index,
            dir: dir < 0 ? "left" : "right",
        });
        render();
    }

    function adjustSlider(index, clientX, trackEl, opts) {
        const commit = !opts || opts.commit !== false;
        mutateActiveTabs((tabs) => {
            const tab = tabs[index];
            if (!tab) return;
            const min = tab.min ?? 0;
            const max = tab.max ?? 100;
            const rect = trackEl.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const step = tab.step || 1;
            let val = min + pct * (max - min);
            val = Math.round(val / step) * step;
            tab.value = Math.max(min, Math.min(max, val));
        });
        state.index = index;
        if (!commit) {
            render();
            return;
        }
        const tab = getActiveTabs()[index];
        afterLocalChange({
            action: "slider",
            index,
            value: tab?.value,
            pct:
                trackEl && trackEl.getBoundingClientRect
                    ? Math.max(
                          0,
                          Math.min(
                              1,
                              (clientX - trackEl.getBoundingClientRect().left) /
                                  Math.max(1, trackEl.getBoundingClientRect().width)
                          )
                      )
                    : undefined,
        });
        render();
    }

    function uiOutboundExtras() {
        const extra = {};
        if (state.categories?.length) {
            extra.categoryIndex = state.categoryIndex || 0;
        }
        if (state.sidebarActive) {
            extra.section = state.sidebarActive;
        }
        return extra;
    }

    function emitActivate(index, entry) {
        const payload = { action: "activate", index, ...uiOutboundExtras() };
        if (entry?.label) payload.label = entry.label;
        emitToGame(payload);
    }

    function toggleAtIndex(index) {
        const tabs = getActiveTabs();
        const tab = tabs?.[index];
        if (!tab) return;
        const t = tab.type;
        if (t !== "checkbox" && t !== "slider-checkbox" && t !== "scrollable-checkbox") return;

        state.index = index;
        const nextChecked = !tab.checked;
        tab.checked = nextChecked;
        render();

        emitToGame({
            action: "activate",
            index,
            label: tab.label,
            checked: nextChecked,
            ...uiOutboundExtras(),
        });
    }

    function activateAtIndex(index) {
        const list = state.categories?.length
            ? state.categories[state.categoryIndex].tabs
            : state.elements;
        const entry = list?.[index];
        if (!entry) return;

        state.index = index;

        if (entry.type === "subMenu") {
            if (entry.categories?.length || entry.subTabs?.length) {
                state.sidebarActive = entry.label;
                if (entry.categories?.length) {
                    state.categories = entry.categories;
                    state.categoryIndex = 0;
                    state.elements = entry.categories[0].tabs || [];
                } else {
                    state.categories = null;
                    state.elements = entry.subTabs;
                }
                state.index = 0;
                emitActivate(index, entry);
            } else {
                emitActivate(index, entry);
            }
            render();
            return;
        }

        if (entry.type === "checkbox" || entry.type === "slider-checkbox" || entry.type === "scrollable-checkbox") {
            toggleAtIndex(index);
            return;
        }

        if (entry.type === "button") {
            emitActivate(index, entry);
            if (isLocalDevMode()) {
                showNotification({
                    type: "success",
                    title: entry.label || "Action",
                    desc: "Triggered (dev preview)",
                    duration: 2000,
                });
            }
            return;
        }

        emitActivate(index, entry);
    }

    function emitToGame(payload) {
        const msg = { source: "onimaru-ui", ...payload };
        const raw = JSON.stringify(msg);
        window.__ONIMARU_UI_OUTBOX__ = window.__ONIMARU_UI_OUTBOX__ || [];
        window.__ONIMARU_LAST_MSG__ = msg;
        window.__ONIMARU_UI_OUTBOX__.push(raw);

        try {
            if (typeof window.machoPost === "function") {
                window.machoPost(raw);
            }
        } catch {
            /* ignore */
        }

        try {
            if (typeof window.invokeNative === "function") {
                window.invokeNative("onimaruUi", raw);
                window.invokeNative("duiCallback", raw);
                window.invokeNative("sendDuiMessage", raw);
            }
        } catch {
            /* ignore */
        }

        try {
            if (window.cfx && typeof window.cfx.postMessage === "function") {
                window.cfx.postMessage(raw);
            }
        } catch {
            /* ignore */
        }

        try {
            window.parent.postMessage(raw, "*");
        } catch {
            /* ignore */
        }

        return true;
    }

    function viewportSize() {
        return {
            width: document.documentElement.clientWidth || window.innerWidth || 1,
            height: document.documentElement.clientHeight || window.innerHeight || 1,
        };
    }

    function pointerFromNorm(nx, ny) {
        const { width, height } = viewportSize();
        return {
            x: Math.max(0, Math.min(width - 1, nx * width)),
            y: Math.max(0, Math.min(height - 1, ny * height)),
        };
    }

    function elementAtPoint(x, y) {
        const ignore = new Set(["game-cursor"]);
        const ignoreSel = [".keyboard-backdrop", ".notifications", "#page-error"];
        const stack =
            typeof document.elementsFromPoint === "function"
                ? document.elementsFromPoint(x, y)
                : [document.elementFromPoint(x, y)].filter(Boolean);
        for (const el of stack) {
            if (!(el instanceof HTMLElement)) continue;
            if (ignore.has(el.id)) continue;
            let skip = false;
            for (const sel of ignoreSel) {
                if (el.matches(sel) || el.closest(sel)) {
                    skip = true;
                    break;
                }
            }
            if (!skip) return el;
        }
        return null;
    }

    let pointerPressed = false;
    let lastUiClickAt = 0;

    function menuIsInteractive() {
        return state.visible || dashboard.classList.contains("visible");
    }

    function findFeatureRowAt(x, y) {
        if (!contentEl) return null;

        if (typeof document.elementsFromPoint === "function") {
            for (const el of document.elementsFromPoint(x, y)) {
                if (!(el instanceof HTMLElement)) continue;
                if (el.id === "game-cursor") continue;
                const row = el.closest(".feature-row");
                if (row && contentEl.contains(row)) return row;
            }
        }

        const rows = contentEl.querySelectorAll(".feature-row");
        for (let i = rows.length - 1; i >= 0; i--) {
            if (rectContains(rows[i], x, y)) return rows[i];
        }
        return null;
    }

    let hoverRaf = 0;
    let lastHoverIdx = -1;
    let hoveredNavEl = null;
    let hoveredTabEl = null;

    function findNavAt(x, y) {
        if (!sidebarNav) return null;
        const items = sidebarNav.querySelectorAll(".nav-item");
        for (let i = items.length - 1; i >= 0; i--) {
            if (rectContains(items[i], x, y)) return items[i];
        }
        return null;
    }

    function findTabAt(x, y) {
        if (!tabNav) return null;
        const items = tabNav.querySelectorAll(".tab-item");
        for (let i = items.length - 1; i >= 0; i--) {
            if (rectContains(items[i], x, y)) return items[i];
        }
        return null;
    }

    function applyChromeHover() {
        if (sidebarNav) {
            sidebarNav.querySelectorAll(".nav-item").forEach((node) => {
                node.classList.toggle("hover", node === hoveredNavEl);
            });
        }
        if (tabNav) {
            tabNav.querySelectorAll(".tab-item").forEach((node) => {
                node.classList.toggle("hover", node === hoveredTabEl);
            });
        }
    }

    function updateHoverAt(x, y) {
        if (!menuIsInteractive()) return;
        if (hoverRaf) return;
        hoverRaf = requestAnimationFrame(() => {
            hoverRaf = 0;

            const nextNav = findNavAt(x, y);
            const nextTab = findTabAt(x, y);
            if (nextNav !== hoveredNavEl || nextTab !== hoveredTabEl) {
                hoveredNavEl = nextNav;
                hoveredTabEl = nextTab;
                applyChromeHover();
            }

            const row = findFeatureRowAt(x, y);
            if (!row) return;
            const idx = parseInt(row.dataset.idx, 10);
            if (Number.isNaN(idx) || idx === lastHoverIdx) return;
            lastHoverIdx = idx;
            if (idx !== state.index) {
                state.index = idx;
                render();
            }
        });
    }

    function markClickResolved() {
        window.__ONIMARU_CLICK_RESOLVED__ = true;
    }

    function resolveChromeClickAt(x, y) {
        const nav = findNavAt(x, y);
        if (nav && nav.dataset.sidebar) {
            openSidebarSection(nav.dataset.sidebar);
            return true;
        }

        const tab = findTabAt(x, y);
        if (tab) {
            if (tab.dataset.uiAction === "back") {
                emitToGame({ action: "back" });
            } else {
                switchCategory(parseInt(tab.dataset.tabIndex, 10));
            }
            return true;
        }

        return false;
    }

    function rectHitExpanded(el, x, y, padX, padY) {
        const r = el.getBoundingClientRect();
        return x >= r.left - padX && x <= r.right + padX && y >= r.top - padY && y <= r.bottom + padY;
    }

    function findToggleAt(x, y) {
        if (!contentEl) return null;
        const toggles = contentEl.querySelectorAll(".toggle");
        for (let i = toggles.length - 1; i >= 0; i--) {
            const el = toggles[i];
            if (rectHitExpanded(el, x, y, 6, 10)) return el;
        }
        return null;
    }

    function findPillAt(x, y) {
        if (!contentEl) return null;
        const pills = contentEl.querySelectorAll(".btn-pill");
        for (let i = pills.length - 1; i >= 0; i--) {
            if (rectContains(pills[i], x, y)) return pills[i];
        }
        return null;
    }

    function resolveMenuActionAt(x, y) {
        if (!menuIsInteractive()) return false;

        const now = Date.now();
        if (now - lastUiClickAt < 120) return false;

        if (resolveChromeClickAt(x, y)) {
            lastUiClickAt = now;
            markClickResolved();
            return true;
        }

        const toggle = findToggleAt(x, y);
        if (toggle) {
            const toggleRow = toggle.closest(".feature-row");
            if (toggleRow) {
                lastUiClickAt = now;
                markClickResolved();
                toggleAtIndex(parseInt(toggleRow.dataset.idx, 10));
                return true;
            }
        }

        const pill = findPillAt(x, y);
        if (pill) {
            const pillRow = pill.closest(".feature-row");
            if (pillRow) {
                lastUiClickAt = now;
                markClickResolved();
                activateAtIndex(parseInt(pillRow.dataset.idx, 10));
                return true;
            }
        }

        const hit = findMenuTargetAt(x, y);
        if (hit && hit.kind === "subcard") {
            lastUiClickAt = now;
            markClickResolved();
            activateAtIndex(parseInt(hit.target.dataset.idx, 10));
            return true;
        }

        const row = findFeatureRowAt(x, y);
        if (row) {
            lastUiClickAt = now;
            markClickResolved();
            const idx = parseInt(row.dataset.idx, 10);
            let clickTarget = row;
            if (typeof document.elementsFromPoint === "function") {
                for (const el of document.elementsFromPoint(x, y)) {
                    if (!(el instanceof HTMLElement)) continue;
                    if (el.id === "game-cursor") continue;
                    if (el instanceof HTMLElement && row.contains(el)) {
                        clickTarget = el;
                        break;
                    }
                }
            }
            handleFeatureRowClick(idx, x, y, row, clickTarget);
            return true;
        }

        if (!hit) return false;

        lastUiClickAt = now;
        markClickResolved();
        const { kind, target } = hit;

        if (kind === "toggle") {
            const toggleRow = target.closest(".feature-row");
            if (toggleRow) toggleAtIndex(parseInt(toggleRow.dataset.idx, 10));
            return true;
        }

        if (kind === "scroll") {
            const scrollRow = target.closest(".feature-row");
            if (!scrollRow) return false;
            adjustScrollable(
                parseInt(scrollRow.dataset.idx, 10),
                target.dataset.dir === "left" ? -1 : 1
            );
            return true;
        }

        if (kind === "scroll-value") {
            const scrollRow = target.closest(".feature-row");
            if (scrollRow) activateAtIndex(parseInt(scrollRow.dataset.idx, 10));
            return true;
        }

        if (kind === "slider") {
            const sliderRow = target.closest(".feature-row");
            if (!sliderRow) return false;
            adjustSlider(parseInt(sliderRow.dataset.idx, 10), x, target);
            return true;
        }

        if (kind === "slider-num") {
            const numRow = target.closest(".feature-row");
            if (!numRow) return false;
            const track = numRow.querySelector(".slider-track");
            if (track) {
                adjustSlider(parseInt(numRow.dataset.idx, 10), x, track);
            }
            return true;
        }

        if (kind === "pill") {
            const pillRow = target.closest(".feature-row");
            if (pillRow) activateAtIndex(parseInt(pillRow.dataset.idx, 10));
            return true;
        }

        if (kind === "row") {
            handleFeatureRowClick(parseInt(target.dataset.idx, 10), x, y, target, target);
            return true;
        }

        return false;
    }

    function fireMouse(target, type, x, y) {
        target.dispatchEvent(
            new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0,
                clientX: x,
                clientY: y,
            })
        );
    }

    function firePointer(target, type, x, y) {
        const Ctor = window.PointerEvent;
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
                })
            );
        } else {
            fireMouse(target, type === "pointerdown" ? "mousedown" : type === "pointerup" ? "mouseup" : "mousemove", x, y);
        }
    }

    function scrollAtPoint(x, y, delta) {
        const hit = elementAtPoint(x, y);
        let node = hit;
        while (node && node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            const oy = style.overflowY;
            if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight + 1) {
                const step = Math.max(32, Math.min(120, node.clientHeight * 0.15));
                node.scrollTop += delta > 0 ? step : -step;
                return;
            }
            node = node.parentElement;
        }
    }

    function handleInjectedMouse(data) {
        if (typeof data.x !== "number" || typeof data.y !== "number") return;
        const { x, y } = pointerFromNorm(data.x, data.y);

        let gc = document.getElementById("game-cursor");
        if (!gc && !isLocalDevMode()) {
            gc = document.createElement("div");
            gc.id = "game-cursor";
            gc.className = "game-cursor";
            gc.setAttribute("aria-hidden", "true");
            document.body.appendChild(gc);
        }
        if (gc) {
            gc.style.left = x + "px";
            gc.style.top = y + "px";
        }

        if (!menuIsInteractive()) return;

        if (data.type === "move") {
            updateHoverAt(x, y);
            if (pointerPressed) firePointer(window, "pointermove", x, y);
            return;
        }

        if (data.type === "wheel") {
            const delta = typeof data.delta === "number" ? data.delta : 0;
            if (delta !== 0) scrollAtPoint(x, y, delta);
            return;
        }

        if (data.type === "down") {
            const el = elementAtPoint(x, y);
            if (el) {
                pointerPressed = true;
                firePointer(el, "pointerdown", x, y);
                fireMouse(el, "mousedown", x, y);
            }
            return;
        }

        if (data.type === "up") {
            const el = elementAtPoint(x, y);
            firePointer(window, "pointerup", x, y);
            if (el) {
                fireMouse(el, "mouseup", x, y);
            }
            pointerPressed = false;
            return;
        }

        if (data.type === "click") {
            const el = elementAtPoint(x, y);
            firePointer(window, "pointerup", x, y);
            if (el) {
                fireMouse(el, "mouseup", x, y);
            }
            if (!resolveMenuActionAt(x, y) && el) {
                fireMouse(el, "click", x, y);
            }
            pointerPressed = false;
        }
    }

    function afterLocalChange(gamePayload) {
        emitToGame(gamePayload);
        if (isLocalDevMode()) pushUpdate();
    }

    function renderSliderWrap(entry) {
        const min = entry.min ?? 0;
        const max = entry.max ?? 100;
        const val = entry.value ?? min;
        const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
        return `<div class="slider-wrap">
                <div class="slider-track" role="slider" aria-valuenow="${val}" aria-valuemin="${min}" aria-valuemax="${max}">
                    <div class="slider-fill" style="width:${pct}%"></div>
                    <div class="slider-thumb" style="left:${pct}%"></div>
                </div>
                <span class="slider-num">${formatSliderValue(entry)}</span>
            </div>`;
    }

    function renderControl(entry) {
        const type = entry.type || "button";
        if (type === "checkbox" || type === "scrollable-checkbox" || type === "slider-checkbox") {
            const on = !!entry.checked;
            let extra = "";
            if (type === "scrollable-checkbox") {
                extra = `<button type="button" class="scroll-ctrl" data-dir="left" title="Previous">‹</button>
                    <span class="scroll-value">${escapeHtml(scrollableLabel(entry))}</span>
                    <button type="button" class="scroll-ctrl" data-dir="right" title="Next">›</button>`;
            } else if (type === "slider-checkbox") {
                extra = renderSliderWrap(entry);
            }
            return `${extra}<button type="button" class="toggle ${on ? "on" : ""}" aria-pressed="${on}"></button>`;
        }
        if (type === "slider") {
            return renderSliderWrap(entry);
        }
        if (type === "scrollable") {
            return `<button type="button" class="scroll-ctrl" data-dir="left" title="Previous">‹</button>
                <span class="scroll-value">${escapeHtml(scrollableLabel(entry))}</span>
                <button type="button" class="scroll-ctrl" data-dir="right" title="Next">›</button>`;
        }
        if (type === "subMenu") {
            return `<span class="sub-arrow">›</span>`;
        }
        if (type === "button") {
            return `<button type="button" class="btn-pill">Run</button>`;
        }
        return "";
    }

    function groupIntoSections(tabs) {
        const sections = [];
        let current = { title: "General", items: [] };

        tabs.forEach((entry, index) => {
            if (entry.type === "divider") {
                if (current.items.length) sections.push(current);
                current = { title: entry.label || "More", items: [] };
                return;
            }
            current.items.push({ entry, index });
        });

        if (current.items.length) sections.push(current);
        return sections;
    }

    function renderFeatureRow(item, isActive) {
        const entry = item.entry;
        const type = entry.type || "button";
        let sub = "";
        if (entry.locked) sub = "Locked";
        else if (entry.hazardous) sub = "Use with caution";
        else if (type === "scrollable" || type === "scrollable-checkbox") sub = scrollableLabel(entry);
        else if (entry.desc) sub = entry.desc.slice(0, 48) + (entry.desc.length > 48 ? "…" : "");

        const showDots = type === "slider" || type === "slider-checkbox" || type === "scrollable";

        return `<div class="feature-row ${isActive ? "active" : ""}" data-idx="${item.index}">
            <div class="feature-icon">${iconFor(entry.label)}</div>
            <div class="feature-body">
                <div class="feature-label">${escapeHtml(entry.label || "")}</div>
                ${sub ? `<div class="feature-sub">${escapeHtml(sub)}</div>` : ""}
            </div>
            <div class="feature-actions">
                ${showDots ? '<span class="row-menu-btn">⋯</span>' : ""}
                ${renderControl(entry)}
            </div>
        </div>`;
    }

    function renderSidebar() {
        sidebarNav.innerHTML = "";
        const items = state.sidebar.length ? state.sidebar : [];
        const hoveredLabel = state.elements[state.index]?.label;

        items.forEach((entry) => {
            if (entry.type !== "subMenu") return;
            const label = entry.label || "Menu";
            const active = state.sidebarActive
                ? state.sidebarActive === label
                : hoveredLabel === label;
            const el = document.createElement("button");
            el.type = "button";
            el.className = "nav-item" + (active ? " active" : "");
            el.dataset.sidebar = label;
            el.innerHTML = `<span class="nav-icon">${iconFor(label)}</span><span>${escapeHtml(label)}</span>`;
            sidebarNav.appendChild(el);
        });
    }

    function renderTabs() {
        if (!tabNav) return;
        tabNav.innerHTML = "";
        if (state.path && state.path.length > 1) {
            const back = document.createElement("button");
            back.type = "button";
            back.className = "tab-item";
            back.dataset.uiAction = "back";
            back.textContent = "← Back";
            tabNav.appendChild(back);
        }
        if (!state.categories || !state.categories.length) return;

        state.categories.forEach((cat, i) => {
            const el = document.createElement("button");
            el.type = "button";
            el.className = "tab-item" + (i === state.categoryIndex ? " active" : "");
            el.dataset.tabIndex = String(i);
            el.textContent = cat.label || "Tab";
            tabNav.appendChild(el);
        });
    }

    function renderContent() {
        contentEl.innerHTML = "";
        contentEl.classList.remove("single-column");

        if (isRootSubmenuView()) {
            contentEl.classList.add("single-column");
            const grid = document.createElement("div");
            grid.className = "submenu-grid";
            state.elements.forEach((entry, i) => {
                if (entry.type !== "subMenu") return;
                const card = document.createElement("button");
                card.type = "button";
                card.className = "submenu-card" + (i === state.index ? " active" : "");
                card.dataset.idx = String(i);
                card.innerHTML = `<span class="nav-icon">${iconFor(entry.label)}</span>
                    <span class="submenu-card-title">${escapeHtml(entry.label || "")}</span>
                    <span class="sub-arrow" style="margin-left:auto">›</span>`;
                grid.appendChild(card);
            });
            contentEl.appendChild(grid);
            return;
        }

        const tabs = getActiveTabs();
        const sections = groupIntoSections(tabs);

        if (!sections.length) {
            contentEl.innerHTML = `<div class="section-card" style="grid-column:1/-1;padding:24px;color:var(--text-dim);font-size:13px;">No options in this section.</div>`;
            return;
        }

        sections.forEach((section) => {
            const card = document.createElement("div");
            card.className = "section-card";
            card.innerHTML = `<div class="section-title">${escapeHtml(section.title)}</div><div class="section-rows"></div>`;
            const rows = card.querySelector(".section-rows");
            section.items.forEach((item) => {
                rows.insertAdjacentHTML("beforeend", renderFeatureRow(item, item.index === state.index));
            });
            contentEl.appendChild(card);
        });
    }

    function getActiveEntry() {
        const tabs = getActiveTabs();
        return tabs[state.index] || null;
    }

    function updateDesc() {
        const entry = getActiveEntry();
        const text = entry?.desc || "";
        if (text && state.visible) {
            descEl.textContent = text;
            descEl.classList.add("visible");
        } else {
            descEl.classList.remove("visible");
        }
    }

    function render() {
        dashboard.classList.toggle("visible", state.visible);
        dashboard.classList.toggle("expanded", isExpanded);
        dashboard.classList.toggle("docked", !isExpanded);
        document.body.classList.toggle("menu-open", state.visible);
        brandEl.textContent = (state.username || "onimaru").toLowerCase();
        profileName.textContent = state.username || "Player";
        if (extendBtn) {
            extendBtn.textContent = isExpanded ? "Dock Right" : "Extend";
        }
        renderSidebar();
        renderTabs();
        renderContent();
        updateDesc();
        applyChromeHover();
        requestAnimationFrame(() => {
            document.querySelector(".feature-row.active, .submenu-card.active")?.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        });
    }

    function applyPayload(data) {
        if (typeof data.visible === "boolean") state.visible = data.visible;
        if (typeof data.username === "string") state.username = data.username;
        if (typeof data.index === "number") state.index = data.index;
        if (data.categories) state.categories = data.categories;
        else if (data.action === "showUI" && data.visible === false) state.categories = null;
        if (typeof data.categoryIndex === "number") state.categoryIndex = data.categoryIndex;
        if (data.path) state.path = data.path;
        if (data.sidebar) state.sidebar = data.sidebar;
        if (data.sidebarActive !== undefined) state.sidebarActive = data.sidebarActive;
        if (data.bannerColor) setMenuColor(data.bannerColor);

        if (data.elements) {
            state.elements = data.elements;
            // Lua updateElements sends fresh tabs; keep category copy in sync so clicks/toggles stick.
            if (state.categories?.length) {
                const catIdx = Math.max(0, Math.min(state.categories.length - 1, state.categoryIndex || 0));
                state.categoryIndex = catIdx;
                const cat = state.categories[catIdx];
                if (cat) cat.tabs = data.elements;
            }
        } else if (state.categories?.length) {
            const catIdx = Math.max(0, Math.min(state.categories.length - 1, state.categoryIndex || 0));
            state.categoryIndex = catIdx;
            const catTabs = state.categories[catIdx]?.tabs;
            if (catTabs?.length) state.elements = catTabs;
        }

        if (state.sidebar.length && isRootMenuElements(state.elements) && !(state.categories && state.categories.length)) {
            if (!state.sidebarActive) {
                const first = state.sidebar.find((e) => e.type === "subMenu");
                if (first) state.sidebarActive = first.label;
            }
            if (state.sidebarActive) loadSidebarSection(state.sidebarActive);
        } else if (data.action === "showUI" && data.visible) {
            ensureSidebarContent();
        }
    }

    function showNotification(data) {
        if (!notifWrap) return;
        const el = document.createElement("div");
        el.className = "notification " + (data.type || "info");
        el.innerHTML = `<div class="notification-title">${escapeHtml(data.title || "Notice")}</div>
            <div class="notification-desc">${escapeHtml(data.desc || data.message || "")}</div>`;
        notifWrap.appendChild(el);
        requestAnimationFrame(() => el.classList.add("show"));
        setTimeout(() => {
            el.classList.remove("show");
            setTimeout(() => el.remove(), 400);
        }, data.duration || 3000);
    }

    function renderKeybinds(binds) {
        if (!kblList) return;
        kblList.innerHTML = "";
        (binds || []).forEach((b) => {
            kblList.insertAdjacentHTML(
                "beforeend",
                `<div class="kbl-row"><span>${escapeHtml(b.label || "")}</span><span>${escapeHtml(b.keyLabel || b.key || "")}</span></div>`
            );
        });
    }

    function parsePayload(raw) {
        if (raw == null) return null;
        if (typeof raw === "string") {
            try {
                return JSON.parse(raw);
            } catch {
                return null;
            }
        }
        if (typeof raw === "object") {
            if (raw.action) return raw;
            if (typeof raw.data === "string") {
                try {
                    return JSON.parse(raw.data);
                } catch {
                    return null;
                }
            }
        }
        return null;
    }

    function synthesizeMenuClick(px, py) {
        handleInjectedMouse({ action: "mouse", type: "click", x: px / viewportSize().width, y: py / viewportSize().height });
    }

    function bindInteractions() {
        if (dashboard.dataset.bound === "1") return;
        dashboard.dataset.bound = "1";

        dashboard.addEventListener("click", (e) => {
            if (!menuIsInteractive()) return;

            const now = Date.now();
            if (now - lastUiClickAt < 120) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            const toggle = e.target.closest(".toggle");
            if (toggle) {
                e.stopPropagation();
                const row = toggle.closest(".feature-row");
                if (row) toggleAtIndex(parseInt(row.dataset.idx, 10));
                return;
            }

            const scrollCtrl = e.target.closest(".scroll-ctrl");
            if (scrollCtrl) {
                e.stopPropagation();
                const row = scrollCtrl.closest(".feature-row");
                if (!row) return;
                const idx = parseInt(row.dataset.idx, 10);
                adjustScrollable(idx, scrollCtrl.dataset.dir === "left" ? -1 : 1);
                return;
            }

            const track = e.target.closest(".slider-track");
            if (track) {
                e.stopPropagation();
                const row = track.closest(".feature-row");
                if (!row) return;
                adjustSlider(parseInt(row.dataset.idx, 10), e.clientX, track);
                return;
            }

            const sliderNum = e.target.closest(".slider-num");
            if (sliderNum) {
                e.stopPropagation();
                const row = sliderNum.closest(".feature-row");
                if (!row) return;
                const trackEl = row.querySelector(".slider-track");
                if (trackEl) {
                    adjustSlider(parseInt(row.dataset.idx, 10), e.clientX, trackEl);
                }
                return;
            }

            const btnPill = e.target.closest(".btn-pill");
            if (btnPill) {
                e.stopPropagation();
                const row = btnPill.closest(".feature-row");
                if (row) activateAtIndex(parseInt(row.dataset.idx, 10));
                return;
            }

            const tab = e.target.closest(".tab-item");
            if (tab) {
                if (tab.dataset.uiAction === "back") {
                    emitToGame({ action: "back" });
                    return;
                }
                switchCategory(parseInt(tab.dataset.tabIndex, 10));
                return;
            }

            const nav = e.target.closest(".nav-item");
            if (nav && nav.dataset.sidebar) {
                openSidebarSection(nav.dataset.sidebar);
                return;
            }

            const subCard = e.target.closest(".submenu-card");
            if (subCard) {
                activateAtIndex(parseInt(subCard.dataset.idx, 10));
                return;
            }

            const row = e.target.closest(".feature-row");
            if (row) {
                handleFeatureRowClick(parseInt(row.dataset.idx, 10), e.clientX, e.clientY, row, e.target);
                return;
            }
        });

        let sliderDrag = null;

        dashboard.addEventListener("pointerdown", (e) => {
            if (!menuIsInteractive()) return;
            const track = e.target.closest(".slider-track");
            if (!track) return;
            const row = track.closest(".feature-row");
            if (!row) return;
            e.preventDefault();
            sliderDrag = { track, idx: parseInt(row.dataset.idx, 10) };
            track.setPointerCapture(e.pointerId);
            adjustSlider(sliderDrag.idx, e.clientX, track, { commit: false });
        });

        dashboard.addEventListener("pointermove", (e) => {
            if (!sliderDrag) return;
            adjustSlider(sliderDrag.idx, e.clientX, sliderDrag.track, { commit: false });
        });

        dashboard.addEventListener("pointerup", (e) => {
            if (!sliderDrag) return;
            adjustSlider(sliderDrag.idx, e.clientX, sliderDrag.track);
            try {
                sliderDrag.track.releasePointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
            sliderDrag = null;
        });

        dashboard.addEventListener("pointercancel", () => {
            sliderDrag = null;
        });

        if (isLocalDevMode()) {
            dashboard.addEventListener("dblclick", (e) => {
                if (!state.visible) return;
                const row = e.target.closest(".feature-row");
                if (row) {
                    activateAtIndex(parseInt(row.dataset.idx, 10));
                    return;
                }
                const subCard = e.target.closest(".submenu-card");
                if (subCard) {
                    activateAtIndex(parseInt(subCard.dataset.idx, 10));
                    return;
                }
                const nav = e.target.closest(".nav-item");
                if (nav?.dataset.sidebar) {
                    openSidebarSection(nav.dataset.sidebar);
                }
            });
        }
    }

    window.addEventListener("message", (event) => {
        const data = parsePayload(event.data);
        if (data) processMessage(data);
    });

    function ingestDuiMessage(raw) {
        const data = parsePayload(raw);
        if (data) processMessage(data);
    }

    window.onDuiMessage = ingestDuiMessage;
    window.receiveDuiMessage = ingestDuiMessage;
    window.DuiMessage = ingestDuiMessage;
    window.__ONIMARU_READY__ = ingestDuiMessage;
    window.__ONIMARU_DUI = {
        push(raw) {
            ingestDuiMessage(raw);
        },
    };
    if (Array.isArray(window.__ONIMARU_PENDING__) && window.__ONIMARU_PENDING__.length) {
        window.__ONIMARU_PENDING__.forEach((raw) => ingestDuiMessage(raw));
        window.__ONIMARU_PENDING__ = [];
    }

    function isModifierKey(k) {
        return k === "Control" || k === "Alt" || k === "Meta";
    }

    function isIgnoredKeybindKey(k) {
        return k === "Backspace" || k === "Tab" || k === "Enter" || k === "Escape";
    }

    function isKeybindPromptOpen() {
        if (document.getElementById("boot-keybind-fallback")) return true;
        return !!(inputWrap && inputWrap.classList.contains("visible")) || document.body.classList.contains("keyboard-prompt");
    }

    function postKeybindPick(label, code) {
        emitToGame({ action: "keybindPick", key: label, code: code });
        if (inputValue) inputValue.textContent = label;
        const boot = document.getElementById("boot-key-value");
        if (boot) boot.textContent = label;
    }

    window.addEventListener(
        "keydown",
        (e) => {
            if (!isKeybindPromptOpen()) return;
            if (e.repeat) return;
            const k = e.key;
            if (!k || isModifierKey(k) || isIgnoredKeybindKey(k)) return;
            e.preventDefault();
            e.stopPropagation();
            const label = k === "Shift" ? "Shift" : k.length === 1 ? k.toUpperCase() : k;
            postKeybindPick(label, e.keyCode || e.which || 0);
        },
        true
    );

    function isLocalDevMode() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("preview") === "1" || params.get("dev") === "1") return true;
        const host = window.location.hostname;
        return host === "localhost" || host === "127.0.0.1" || host === "";
    }

    function isGameMode() {
        return !isLocalDevMode();
    }

    function processMessage(data) {
        if (!data || !data.action) return;

        switch (data.action) {
            case "showUI":
                state.visible = !!data.visible;
                applyPayload(data);
                if (!data.visible) {
                    setTimeout(() => {
                        state.index = 0;
                        state.categories = null;
                    }, 250);
                }
                render();
                break;
            case "updateElements":
                applyPayload(data);
                render();
                break;
            case "keydown":
            case "highlight":
                if (typeof data.index === "number") {
                    state.index = data.index;
                    render();
                }
                break;
            case "setCursor":
                document.body.classList.toggle("game-cursor", !!data.visible);
                break;
            case "mouse":
                handleInjectedMouse(data);
                break;
            case "updateBanner":
                if (data.bannerColor) setMenuColor(data.bannerColor);
                break;
            case "updateKeyboard": {
                const show = !!data.visible;
                document.body.classList.toggle("keyboard-prompt", show);
                if (inputWrap) inputWrap.classList.toggle("visible", show);
                if (show && inputTitle && data.title) inputTitle.textContent = data.title;
                if (show && inputValue) {
                    inputValue.textContent = data.value || "Press any key…";
                }
                break;
            }
            case "displayBinds":
                kblWrap.classList.toggle("visible", !!data.visible);
                if (data.binds) renderKeybinds(data.binds);
                break;
            case "showNotification":
                showNotification(data);
                break;
            case "displayFreecam":
                if (!data.visible) {
                    fcWrap.classList.remove("visible");
                    fcWrap.innerHTML = "";
                } else {
                    fcWrap.classList.add("visible");
                    const opts = [
                        "Default",
                        "Teleport",
                        "Shoot Weapon",
                        "Kick from Vehicle",
                        "Hijack Vehicle",
                        "Delete Vehicle",
                    ];
                    fcWrap.innerHTML = opts
                        .map((o, i) => `<div class="fc-option ${i === 0 ? "selected" : ""}">${escapeHtml(o)}</div>`)
                        .join("");
                }
                break;
            default:
                break;
        }
    }

    function runPreviewDemo() {
        document.body.classList.add("page-preview");
        applyPayload({
            action: "showUI",
            visible: true,
            username: "Onimaru",
            path: ["Onimaru", "Self"],
            sidebarActive: "Self",
            categoryIndex: 0,
            index: 1,
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
                        { type: "checkbox", label: "Super Jump", checked: false },
                        { type: "divider", label: "Protections" },
                        { type: "checkbox", label: "Godmode", checked: false },
                        { type: "checkbox", label: "Invisible To Others", checked: false },
                        { type: "button", label: "Revive" },
                        { type: "slider", label: "Health", value: 200, min: 0, max: 200 },
                    ],
                },
                {
                    label: "Combat",
                    tabs: [
                        { type: "checkbox", label: "Infinite Ammo", checked: false },
                        { type: "checkbox", label: "No Recoil", checked: false },
                    ],
                },
            ],
            elements: [{ type: "checkbox", label: "Noclip", checked: true }],
        });
        render();
    }

    function verifyAssetsLoaded() {
        try {
            return Array.from(document.styleSheets).some((s) => s.href && s.href.includes("shadow.css"));
        } catch {
            return true;
        }
    }

    setMenuColor(state.menuColor);

    window.OnimaruUI = {
        send: processMessage,
        preview: runPreviewDemo,
        getState: () => cloneData(state),
        render,
        selectIndex,
        switchCategory,
        activateAtIndex,
        toggleAtIndex,
        clickAt: (nx, ny) => handleInjectedMouse({ action: "mouse", type: "click", x: nx, y: ny }),
    };

    window.__ONIMARU_CLICK_AT__ = function (nx, ny) {
        window.__ONIMARU_LAST_MSG__ = null;
        window.__ONIMARU_CLICK_RESOLVED__ = false;
        handleInjectedMouse({ action: "mouse", type: "click", x: nx, y: ny });
        return window.__ONIMARU_LAST_MSG__;
    };

    bindInteractions();
    if (extendBtn) {
        extendBtn.addEventListener("click", () => {
            isExpanded = !isExpanded;
            render();
        });
    }

    if (isLocalDevMode()) {
        runPreviewDemo();
    } else {
        render();
    }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
