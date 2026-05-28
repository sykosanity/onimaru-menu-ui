import type { MenuCategory, MenuEntry, UiMessage } from "./types";

function cat(label: string, tabs: MenuEntry[]): MenuCategory {
  return { label, tabs };
}

function section(label: string, categories: MenuCategory[]): MenuEntry {
  return { type: "subMenu", label, categories };
}

export function buildMockSidebar(): MenuEntry[] {
  return [
    section("Self", [
      cat("Player", [
        { type: "divider", label: "Movement" },
        { type: "checkbox", label: "Noclip", checked: true, desc: "Move freely for local preview testing." },
        { type: "checkbox", label: "Fast Run", checked: false, desc: "Mock sprint multiplier toggle." },
        { type: "slider", label: "Health", value: 200, min: 0, max: 200, step: 5, desc: "Mock health slider." },
        { type: "button", label: "Revive", desc: "Mock revive action." },
      ]),
      cat("Combat", [
        { type: "checkbox", label: "Godmode", checked: false, desc: "Mock invulnerability toggle." },
        { type: "checkbox", label: "No Ragdoll", checked: true, desc: "Mock ragdoll disable toggle." },
        { type: "slider-checkbox", label: "Damage Boost", checked: false, value: 1, min: 1, max: 5, step: 0.5, desc: "Mock damage multiplier." },
      ]),
    ]),
    section("Server", [
      cat("Session", [
        { type: "button", label: "Reconnect", desc: "Mock reconnect action." },
        { type: "button", label: "Refresh Players", desc: "Mock player list refresh." },
        { type: "scrollable", label: "Server Profile", value: 1, values: ["Public", "Whitelist", "Dev"], desc: "Mock profile chooser." },
      ]),
      cat("Moderation", [
        { type: "checkbox", label: "Log Events", checked: true, desc: "Mock event logger toggle." },
        { type: "slider", label: "Tick Rate", value: 30, min: 5, max: 120, step: 1, desc: "Mock update interval." },
      ]),
    ]),
    section("Weapon", [
      cat("Loadout", [
        { type: "scrollable", label: "Primary", value: 1, values: ["Carbine", "SMG", "Shotgun", "Sniper"], desc: "Mock weapon picker." },
        { type: "button", label: "Give Weapon", desc: "Mock grant weapon action." },
        { type: "button", label: "Remove Weapon", desc: "Mock remove weapon action." },
      ]),
      cat("Stats", [
        { type: "checkbox", label: "Infinite Ammo", checked: false, desc: "Mock ammo toggle." },
        { type: "slider", label: "Recoil Scale", value: 1, min: 0, max: 2, step: 0.1, desc: "Mock recoil scale slider." },
        { type: "slider-checkbox", label: "Spread Scale", checked: false, value: 1, min: 0, max: 2, step: 0.1, desc: "Mock spread scale slider." },
      ]),
    ]),
    section("Vehicle", [
      cat("Spawn", [
        { type: "scrollable", label: "Model", value: 1, values: ["Sultan", "Banshee", "Buffalo", "Adder"], desc: "Mock vehicle model selector." },
        { type: "button", label: "Spawn Vehicle", desc: "Mock spawn vehicle action." },
        { type: "button", label: "Delete Vehicle", desc: "Mock delete vehicle action." },
      ]),
      cat("Handling", [
        { type: "slider", label: "Engine Multiplier", value: 1, min: 0.5, max: 5, step: 0.1, desc: "Mock torque multiplier." },
        { type: "slider", label: "Brake Force", value: 1, min: 0.5, max: 3, step: 0.1, desc: "Mock braking strength." },
        { type: "checkbox", label: "Seatbelt", checked: true, desc: "Mock seatbelt state." },
      ]),
    ]),
    section("Teleports", [
      cat("Presets", [
        { type: "scrollable", label: "Location", value: 1, values: ["Legion", "Airport", "Sandy", "Paleto"], desc: "Mock location selector." },
        { type: "button", label: "Teleport", desc: "Mock teleport action." },
      ]),
      cat("Safety", [
        { type: "checkbox", label: "Ground Snap", checked: true, desc: "Mock safe landing toggle." },
        { type: "checkbox", label: "Freeze On Arrive", checked: false, desc: "Mock freeze toggle." },
      ]),
    ]),
    section("Settings", [
      cat("Interface", [
        { type: "slider", label: "Menu Scale", value: 1, min: 0.75, max: 1.5, step: 0.05, desc: "Mock UI scale slider." },
        { type: "scrollable", label: "Theme", value: 1, values: ["Purple", "Blue", "Red", "Green"], desc: "Mock theme preset." },
        { type: "checkbox", label: "Show Hints", checked: true, desc: "Mock helper text toggle." },
      ]),
      cat("Bindings", [
        { type: "button", label: "Open Keybind Editor", desc: "Mock keybind editor action." },
        { type: "button", label: "Reset Settings", desc: "Mock reset action." },
      ]),
    ]),
  ];
}

export function buildMockShowUiPayload(): UiMessage {
  const sidebar = buildMockSidebar();
  const first = sidebar[0];
  const categories = first.categories || [];
  return {
    action: "showUI",
    visible: true,
    username: "Onimaru",
    path: ["Onimaru", first.label || "Self"],
    sidebarActive: first.label || "Self",
    sidebar,
    categories,
    categoryIndex: 0,
    index: 0,
    elements: categories[0]?.tabs || [],
  };
}
