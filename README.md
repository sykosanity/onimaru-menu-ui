# Onimaru Menu UI

React + TypeScript (Vite). Deploy **only the `dist/` folder** to GitHub Pages — not `app.js` / the old root HTML.

## Local dev

```bash
cd onimaru-menu-ui
npm install
npm run dev
```

Open **http://localhost:5173/onimaru-menu-ui/** — the menu loads with mock data. Edit `src/` and `shadow.css`; Vite hot-reloads.

## Deploy to GitHub Pages (required for in-game DUI)

The live site must serve the **Vite build**, not the legacy `app.js` UI.

### Option A — GitHub Actions (recommended)

1. Push this repo to GitHub (`sykosanity/onimaru-menu-ui` or your fork).
2. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**.
3. Push to `main` — workflow `.github/workflows/deploy-pages.yml` runs `npm run build` and publishes `dist/`.

### Option B — Manual

```bash
npm run build
```

Upload **everything inside `dist/`** to the branch GitHub Pages uses (often `main` root or `gh-pages` branch):

- `index.html` (references `/onimaru-menu-ui/assets/index-*.js` — **not** `app.js`)
- `assets/` folder
- `.nojekyll` (empty file at site root)

Do **not** deploy root `app.js`, `dev.js`, or the old static `index.html` from before the React migration.

### Option C — gh-pages CLI

```bash
npm run deploy:pages
```

Pushes `dist/` to the `gh-pages` branch. Set Pages source to that branch if you use this.

Live URL: **https://sykosanity.github.io/onimaru-menu-ui/**

After deploy, hard-refresh the URL in a browser. You should see the React dashboard, not “Onimaru UI failed to load” from the old static shell.

## Connect Onimaru.lua

```lua
local ONIMARU_DUI_URL = "https://sykosanity.github.io/onimaru-menu-ui/"
```

`Onimaru.lua` already uses this URL. If the game still shows the old Shadow UI, GitHub Pages is still serving the legacy files — redeploy using the steps above.

## DUI messages

- **In:** `showUI`, `updateElements`, `keydown`, `updateBanner`, `updateKeyboard`, `displayBinds`, `showNotification`, `displayFreecam`
- **Out:** `openSidebar`, `back`, `select`, `activate`, `category`, `scroll`, `slider`, `uiContract`
