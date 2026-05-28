# Onimaru Menu UI

Develop locally with **live reload**, deploy to **GitHub Pages** for Macho.

## Local dev (live update, no `?preview=1`)

```bash
cd onimaru-ui
npm install
npm run dev
```

Opens **http://localhost:5173** — menu shows automatically. Edit `shadow.css` / `app.js` / `index.html` and the browser **refreshes on save**.

### Dev controls (browser only)

| Key | Action |
|-----|--------|
| ↑ ↓ | Move selection |
| Q / E | Switch category tabs |
| ← → | Sliders / scrollables |
| Enter | Toggle checkbox |
| H | Show / hide menu |
| R | Reset demo data |

Console API:

```js
OnimaruDev.send({ action: "showUI", visible: true, elements: [...] })
OnimaruDev.notify("Title", "Message")
```

`dev.js` is **not** uploaded to GitHub (optional). It only loads on `localhost` / `127.0.0.1`.

## Deploy to GitHub Pages

Upload to repo root:

- `index.html`
- `shadow.css`
- `app.js`
- `.nojekyll`

**Do not** upload `dev.js`, `node_modules`, or `package.json` unless you want them public.

Live site example: `https://h0rusdev.github.io/onimaru-menu-ui/`

## Connect Onimaru.lua

```lua
local SHADOW_DUI_URL = "https://h0rusdev.github.io/onimaru-menu-ui/"
```

## Production vs dev

| | Local `npm run dev` | GitHub Pages | In-game |
|--|---------------------|--------------|---------|
| Menu visible | Always (demo) | Hidden until **H** | **H** to open |
| `dev.js` | Yes | No | No |
| Live reload | Yes | Push to update | — |

## DUI messages

- `showUI`, `updateElements`, `keydown`, `updateBanner`
- `updateKeyboard`, `displayBinds`, `showNotification`, `displayFreecam`
