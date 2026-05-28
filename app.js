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

    function isRootSubmenuView() {
        if (state.categories && state.categories.length) return false;
        const els = state.elements || [];
        return els.length > 0 && els.every((e) => e.type === "subMenu");
    }

    function renderControl(entry) {
        const type = entry.type || "button";
        if (type === "checkbox" || type === "scrollable-checkbox" || type === "slider-checkbox") {
            const on = !!entry.checked;
            let extra = "";
            if (type === "scrollable-checkbox") {
                extra = `<span class="scroll-value">${escapeHtml(scrollableLabel(entry))}</span>`;
            } else if (type === "slider-checkbox") {
                extra = `<span class="slider-num">${formatSliderValue(entry)}</span>`;
            }
            return `${extra}<div class="toggle ${on ? "on" : ""}" aria-hidden="true"></div>`;
        }
        if (type === "slider") {
            const min = entry.min ?? 0;
            const max = entry.max ?? 100;
            const val = entry.value ?? min;
            const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
            return `<div class="slider-wrap">
                <div class="slider-track">
                    <div class="slider-fill" style="width:${pct}%"></div>
                    <div class="slider-thumb" style="left:${pct}%"></div>
                </div>
                <span class="slider-num">${formatSliderValue(entry)}</span>
            </div>`;
        }
        if (type === "scrollable") {
            return `<span class="scroll-value">${escapeHtml(scrollableLabel(entry))}</span>`;
        }
        if (type === "subMenu") {
            return `<span class="sub-arrow">›</span>`;
        }
        if (type === "button") {
            return `<span class="btn-pill">Run</span>`;
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
                : hoveredLabel === label && isRootSubmenuView();
            const el = document.createElement("div");
            el.className = "nav-item" + (active ? " active" : "");
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
                const card = document.createElement("div");
                card.className = "submenu-card" + (i === state.index ? " active" : "");
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
        getState: () => ({ ...state }),
        render,
    };

    if (isLocalDevMode()) {
        runPreviewDemo();
    } else {
        render();
    }
})();
