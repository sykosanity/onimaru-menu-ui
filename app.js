(function () {
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
        state.categoryIndex = 0;

        if (entry.categories?.length) {
            state.categories = entry.categories;
            state.elements = entry.categories[0].tabs || [];
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
        if (!loadSidebarSection(label)) return;
        const menuIdx = findSidebarMenuIndex(label);
        emitToGame({ action: "enter", index: menuIdx >= 0 ? menuIdx : 0 });
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
        if (isLocalDevMode()) processMessage({ action: "keydown", index: state.index });
        else render();
    }

    function rowActivatesOnClick(entry) {
        if (!entry) return false;
        const t = entry.type;
        return (
            t === "checkbox" ||
            t === "button" ||
            t === "slider-checkbox" ||
            t === "scrollable-checkbox" ||
            t === "scrollable"
        );
    }

    function switchCategory(index) {
        if (!state.categories || !state.categories.length) return;
        state.categoryIndex = index;
        state.elements = state.categories[index].tabs || [];
        state.index = 0;
        afterLocalChange({ action: "category", index });
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
        });
    }

    function toggleAtIndex(index) {
        mutateActiveTabs((tabs) => {
            const tab = tabs[index];
            if (!tab) return;
            if (tab.type === "checkbox" || tab.type === "slider-checkbox" || tab.type === "scrollable-checkbox") {
                tab.checked = !tab.checked;
            }
        });
        state.index = index;
        afterLocalChange({ action: "activate", index });
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
                const menuIdx = findSidebarMenuIndex(entry.label);
                afterLocalChange({ action: "enter", index: menuIdx >= 0 ? menuIdx : index });
            } else {
                emitToGame({ action: "enter", index });
            }
            return;
        }

        if (entry.type === "checkbox" || entry.type === "slider-checkbox" || entry.type === "scrollable-checkbox") {
            toggleAtIndex(index);
            return;
        }

        if (entry.type === "button") {
            afterLocalChange({ action: "activate", index });
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

        afterLocalChange({ action: "activate", index });
    }

    function emitToGame(payload) {
        const msg = { source: "onimaru-ui", ...payload };
        const raw = JSON.stringify(msg);
        let sent = false;

        try {
            if (typeof window.machoPost === "function") {
                window.machoPost(raw);
                sent = true;
            }
        } catch {
            /* ignore */
        }

        try {
            if (typeof window.invokeNative === "function") {
                window.invokeNative("onimaruUi", raw);
                sent = true;
            }
        } catch {
            /* ignore */
        }

        try {
            window.parent.postMessage(raw, "*");
            sent = true;
        } catch {
            /* ignore */
        }

        return sent;
    }

    function afterLocalChange(gamePayload) {
        emitToGame(gamePayload);
        if (isLocalDevMode()) pushUpdate();
        else render();
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
                extra = `<span class="slider-num">${formatSliderValue(entry)}</span>`;
            }
            return `${extra}<button type="button" class="toggle ${on ? "on" : ""}" aria-pressed="${on}"></button>`;
        }
        if (type === "slider") {
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
        tabNav.innerHTML = "";
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
        document.body.classList.toggle("menu-open", state.visible);
        brandEl.textContent = (state.username || "onimaru").toLowerCase();
        profileName.textContent = state.username || "Player";
        renderSidebar();
        renderTabs();
        renderContent();
        updateDesc();
        requestAnimationFrame(() => {
            document.querySelector(".feature-row.active, .submenu-card.active")?.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        });
    }

    function applyPayload(data) {
        if (typeof data.username === "string") state.username = data.username;
        if (data.elements) state.elements = data.elements;
        if (typeof data.index === "number") state.index = data.index;
        if (data.categories) state.categories = data.categories;
        else if (data.action === "showUI" && !data.categories) state.categories = null;
        if (typeof data.categoryIndex === "number") state.categoryIndex = data.categoryIndex;
        if (data.path) state.path = data.path;
        if (data.sidebar) state.sidebar = data.sidebar;
        if (data.sidebarActive !== undefined) state.sidebarActive = data.sidebarActive;
        if (data.bannerColor) setMenuColor(data.bannerColor);
        ensureSidebarContent();
    }

    function showNotification(data) {
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

    function bindInteractions() {
        if (dashboard.dataset.bound === "1") return;
        dashboard.dataset.bound = "1";

        dashboard.addEventListener("click", (e) => {
            if (!state.visible) return;

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

            const btnPill = e.target.closest(".btn-pill");
            if (btnPill) {
                e.stopPropagation();
                const row = btnPill.closest(".feature-row");
                if (row) activateAtIndex(parseInt(row.dataset.idx, 10));
                return;
            }

            const tab = e.target.closest(".tab-item");
            if (tab) {
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
                const idx = parseInt(row.dataset.idx, 10);
                const entry = getActiveTabs()[idx];
                if (rowActivatesOnClick(entry)) {
                    activateAtIndex(idx);
                } else {
                    selectIndex(idx);
                }
                return;
            }
        });

        let sliderDrag = null;

        dashboard.addEventListener("pointerdown", (e) => {
            if (!state.visible) return;
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

    window.addEventListener("message", (event) => {
        const data = parsePayload(event.data);
        if (data) processMessage(data);
    });

    function isLocalDevMode() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("preview") === "1" || params.get("dev") === "1") return true;
        const host = window.location.hostname;
        return host === "localhost" || host === "127.0.0.1" || host === "";
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
                if (typeof data.index === "number") {
                    state.index = data.index;
                    render();
                }
                break;
            case "updateBanner":
                if (data.bannerColor) setMenuColor(data.bannerColor);
                break;
            case "updateKeyboard":
                inputWrap.classList.toggle("visible", !!data.visible);
                if (data.title) inputTitle.textContent = data.title;
                if (data.value !== undefined) inputValue.textContent = data.value;
                break;
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
    };

    bindInteractions();

    if (isLocalDevMode()) {
        runPreviewDemo();
    } else {
        render();
    }
})();
