import type { MenuEntry, UiMessage } from "./types";
import { mockMenuSections, mockMenuMeta } from "./mockData.generated";

export { mockMenuMeta };

/** Full in-game menu tree extracted from Onimaru.lua (run `npm run extract-mock` to refresh). */
export function buildMockSidebar(): MenuEntry[] {
  return mockMenuSections;
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
