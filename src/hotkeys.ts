import { KEYS } from './keys';

export interface HotkeyDef {
  id: string;
  key: string;
  label: string;
  category: string;
}

export const HOTKEYS: HotkeyDef[] = [
  // Tools
  { id: 'tool-select',      key: KEYS.SELECT,       label: 'Select',                        category: 'Tools' },
  { id: 'tool-pan',         key: KEYS.PAN,          label: 'Pan',                           category: 'Tools' },
  { id: 'tool-stamp',       key: KEYS.STAMP,        label: 'Stamp',                         category: 'Tools' },
  { id: 'tool-rect-stamp',  key: KEYS.RECT_STAMP,   label: 'Rect stamp',                    category: 'Tools' },
  { id: 'tool-line-stamp',  key: KEYS.LINE_STAMP,   label: 'Line stamp',                    category: 'Tools' },
  { id: 'tool-scatter',     key: KEYS.SCATTER,      label: 'Scatter',                       category: 'Tools' },
  { id: 'tool-replace',     key: KEYS.REPLACE,      label: 'Replace',                       category: 'Tools' },
  { id: 'tool-polygon',     key: KEYS.POLYGON,      label: 'Polygon',                       category: 'Tools' },
  { id: 'tool-path',        key: KEYS.PATH,         label: 'Path  (R rotates stamp)',       category: 'Tools' },
  { id: 'tool-eraser',      key: KEYS.ERASER,       label: 'Eraser',                        category: 'Tools' },
  { id: 'tool-light',       key: KEYS.LIGHT,        label: 'Light',                         category: 'Tools' },
  { id: 'tool-fill',        key: KEYS.FILL,         label: 'Flood fill',                    category: 'Tools' },
  { id: 'tool-copy-stamp',  key: KEYS.COPY_STAMP,   label: 'Template stamp',                category: 'Tools' },
  { id: 'tool-pan-temp',    key: KEYS.PAN_TEMP,     label: 'Pan (temporary)',               category: 'Tools' },
  { id: 'eyedropper',       key: KEYS.EYEDROPPER,   label: 'Pick asset (eyedropper)',       category: 'Tools' },

  // Edit
  { id: 'undo',             key: KEYS.UNDO,             label: 'Undo',                          category: 'Edit' },
  { id: 'redo',             key: KEYS.REDO,             label: 'Redo',                          category: 'Edit' },
  { id: 'copy',             key: KEYS.COPY,             label: 'Copy',                          category: 'Edit' },
  { id: 'paste',            key: KEYS.PASTE,            label: 'Paste',                         category: 'Edit' },
  { id: 'duplicate',        key: KEYS.DUPLICATE,        label: 'Duplicate',                     category: 'Edit' },
  { id: 'delete',           key: KEYS.DELETE,           label: 'Delete selected',               category: 'Edit' },
  { id: 'group',            key: KEYS.GROUP,            label: 'Group',                         category: 'Edit' },
  { id: 'ungroup',          key: KEYS.UNGROUP,          label: 'Ungroup',                       category: 'Edit' },
  { id: 'copy-stamp',       key: KEYS.CAPTURE_TEMPLATE, label: 'Stamp from selection',          category: 'Edit' },

  // Selection
  { id: 'select-by-asset',  key: KEYS.SELECT_BY_ASSET,  label: 'Select all of same asset on layer', category: 'Selection' },
  { id: 'nudge',            key: KEYS.NUDGE,            label: 'Nudge selected (1 cell)',       category: 'Selection' },
  { id: 'nudge-pixel',      key: KEYS.NUDGE_PIXEL,      label: 'Nudge selected (1 px)',         category: 'Selection' },
  { id: 'z-forward',        key: KEYS.Z_FORWARD,        label: 'Bring forward',                 category: 'Selection' },
  { id: 'z-backward',       key: KEYS.Z_BACKWARD,       label: 'Send backward',                 category: 'Selection' },
  { id: 'z-front',          key: KEYS.Z_FRONT,          label: 'Bring to front',                category: 'Selection' },
  { id: 'z-back',           key: KEYS.Z_BACK,           label: 'Send to back',                  category: 'Selection' },

  // View
  { id: 'snap',             key: KEYS.SNAP,             label: 'Toggle snap to grid',           category: 'View' },
  { id: 'mirror',           key: KEYS.MIRROR,           label: 'Toggle mirror symmetry',        category: 'View' },
  { id: 'hotkeys',          key: KEYS.HOTKEYS,          label: 'Show hotkeys reference',        category: 'View' },
];

// Derive tool → key map for ToolSidebar (strips 'tool-' prefix)
export const TOOL_KEYS: Record<string, string> = Object.fromEntries(
  HOTKEYS
    .filter(h => h.id.startsWith('tool-') && h.id !== 'tool-pan-temp')
    .map(h => [h.id.slice(5), h.key])
);
