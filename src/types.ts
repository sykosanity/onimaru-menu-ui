export type EntryType =
  | "button"
  | "checkbox"
  | "scrollable"
  | "scrollable-checkbox"
  | "slider"
  | "slider-checkbox"
  | "subMenu"
  | "divider";

export interface MenuEntry {
  type: EntryType;
  label?: string;
  desc?: string;
  checked?: boolean;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  values?: string[];
  categories?: MenuCategory[];
  subTabs?: MenuEntry[];
  locked?: boolean;
  hazardous?: boolean;
}

export interface MenuCategory {
  label?: string;
  tabs?: MenuEntry[];
}

export interface BindItem {
  label?: string;
  keyLabel?: string;
  key?: string;
}

export interface UiState {
  visible: boolean;
  elements: MenuEntry[];
  index: number;
  categories: MenuCategory[] | null;
  categoryIndex: number;
  path: string[];
  sidebar: MenuEntry[];
  sidebarActive: string | null;
  username: string;
  menuColor: string;
  inputVisible: boolean;
  inputMode: "typeable" | "keybind";
  inputTitle: string;
  inputValue: string;
  keybindsVisible: boolean;
  keybinds: BindItem[];
  freecamVisible: boolean;
}

export interface UiMessage {
  action: string;
  [key: string]: unknown;
}

export interface UiOutMessage {
  source: "onimaru-ui";
  action: string;
  [key: string]: unknown;
}
