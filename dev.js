/**
 * Local dev only — keyboard simulator + HUD.
 * Loaded automatically on localhost (see index.html).
 */
(function () {
    const UI = window.OnimaruUI;
    if (!UI) return;

    document.body.classList.add("page-preview");

    const badge = document.createElement("div");
    badge.id = "dev-badge";
    badge.innerHTML =
        '<b>DEV</b> live reload · ↑↓ move · Q/E tabs · ←→ adjust · Enter · H hide · R reload demo';
    document.body.appendChild(badge);

    function getTabs() {
        const s = UI.getState();
        if (s.categories && s.categories.length) {
            const cat = s.categories[s.categoryIndex];
            return (cat && cat.tabs) || [];
        }
        return s.elements || [];
    }

    function skipDividerIndex(list, idx, dir) {
        let i = idx;
        for (let n = 0; n < list.length + 1; n++) {
            i = dir > 0 ? i + 1 : i - 1;
            if (i < 0) i = list.length - 1;
            if (i >= list.length) i = 0;
            if (list[i] && list[i].type !== "divider") return i;
        }
        return idx;
    }

    function scrollOne(dir) {
        const s = UI.getState();
        const list = getTabs();
        if (!list.length) return;
        let idx = skipDividerIndex(list, s.index, dir === "up" ? -1 : 1);
        UI.send({ action: "keydown", index: idx });
    }

    function scrollTwo(dir) {
        const s = UI.getState();
        const list = getTabs();
        const entry = list[s.index];
        if (!entry) return;

        const elements = list.map((e) => ({ ...e }));
        const tab = elements[s.index];

        if (tab.type === "scrollable" || tab.type === "scrollable-checkbox") {
            const n = tab.values?.length || 0;
            if (!n) return;
            tab.value = tab.value || 1;
            tab.value = dir === "left" ? tab.value - 1 : tab.value + 1;
            if (tab.value < 1) tab.value = n;
            if (tab.value > n) tab.value = 1;
        } else if (tab.type === "slider" || tab.type === "slider-checkbox") {
            const step = tab.step || 1;
            const min = tab.min ?? 0;
            const max = tab.max ?? 100;
            tab.value = tab.value ?? min;
            tab.value = dir === "left" ? Math.max(min, tab.value - step) : Math.min(max, tab.value + step);
        } else return;

        UI.send({
            action: "updateElements",
            elements,
            categories: s.categories,
            categoryIndex: s.categoryIndex,
            index: s.index,
            sidebar: s.sidebar,
            sidebarActive: s.sidebarActive,
            path: s.path,
            username: s.username,
        });
    }

    function prevCategory() {
        const s = UI.getState();
        if (!s.categories || !s.categories.length) return;
        let ci = s.categoryIndex - 1;
        if (ci < 0) ci = s.categories.length - 1;
        const cat = s.categories[ci];
        UI.send({
            action: "updateElements",
            elements: cat.tabs || [],
            categories: s.categories,
            categoryIndex: ci,
            index: 0,
            sidebar: s.sidebar,
            sidebarActive: s.sidebarActive,
            path: s.path,
        });
    }

    function nextCategory() {
        const s = UI.getState();
        if (!s.categories || !s.categories.length) return;
        let ci = s.categoryIndex + 1;
        if (ci >= s.categories.length) ci = 0;
        const cat = s.categories[ci];
        UI.send({
            action: "updateElements",
            elements: cat.tabs || [],
            categories: s.categories,
            categoryIndex: ci,
            index: 0,
            sidebar: s.sidebar,
            sidebarActive: s.sidebarActive,
            path: s.path,
        });
    }

    function toggleVisible() {
        const s = UI.getState();
        UI.send({
            action: "showUI",
            visible: !s.visible,
            elements: s.elements,
            categories: s.categories,
            categoryIndex: s.categoryIndex,
            index: s.index,
            sidebar: s.sidebar,
            sidebarActive: s.sidebarActive,
            path: s.path,
            username: s.username,
        });
    }

    window.addEventListener("keydown", (e) => {
        if (e.target.matches("input, textarea")) return;

        switch (e.key) {
            case "ArrowUp":
                e.preventDefault();
                scrollOne("up");
                break;
            case "ArrowDown":
                e.preventDefault();
                scrollOne("down");
                break;
            case "ArrowLeft":
                e.preventDefault();
                scrollTwo("left");
                break;
            case "ArrowRight":
                e.preventDefault();
                scrollTwo("right");
                break;
            case "q":
            case "Q":
                e.preventDefault();
                prevCategory();
                break;
            case "e":
            case "E":
                e.preventDefault();
                nextCategory();
                break;
            case "h":
            case "H":
                e.preventDefault();
                toggleVisible();
                break;
            case "r":
            case "R":
                e.preventDefault();
                UI.preview();
                break;
            case "Enter": {
                e.preventDefault();
                const s = UI.getState();
                const list = getTabs();
                const entry = list[s.index];
                if (!entry) return;
                if (entry.type === "checkbox" || entry.type === "slider-checkbox" || entry.type === "scrollable-checkbox") {
                    const elements = list.map((x, i) =>
                        i === s.index ? { ...x, checked: !x.checked } : { ...x }
                    );
                    UI.send({
                        action: "updateElements",
                        elements,
                        categories: s.categories,
                        categoryIndex: s.categoryIndex,
                        index: s.index,
                        sidebar: s.sidebar,
                        sidebarActive: s.sidebarActive,
                        path: s.path,
                        username: s.username,
                    });
                }
                break;
            }
            default:
                break;
        }
    });

    window.OnimaruDev = {
        send: (obj) => UI.send(obj),
        preview: () => UI.preview(),
        notify: (title, desc) => UI.send({ action: "showNotification", type: "info", title, desc }),
    };

    console.log("[Onimaru DEV] OnimaruDev.send({ action: 'showUI', visible: true, ... })");
})();
