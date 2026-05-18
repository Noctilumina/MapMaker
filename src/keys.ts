/**
 * Canonical key binding strings used in both the hotkey registry (hotkeys.ts)
 * and the keyboard handler (useKeyboardShortcuts.ts).
 * Change a binding here and it updates the UI display automatically.
 */
export const KEYS = {
  // Tools
  SELECT:       'V',
  PAN:          'H',
  STAMP:        'B',
  RECT_STAMP:   'F',
  LINE_STAMP:   'N',
  SCATTER:      'X',
  REPLACE:      '-',
  POLYGON:      'P',
  PATH:         'R',
  ERASER:       'E',
  LIGHT:        'L',
  FILL:         'K',
  COPY_STAMP:   'T',
  PAN_TEMP:     'Space',
  EYEDROPPER:   'Alt+Click',

  // Edit
  UNDO:             'Ctrl+Z',
  REDO:             'Ctrl+Y',
  COPY:             'Ctrl+C',
  PASTE:            'Ctrl+V',
  DUPLICATE:        'Ctrl+D',
  DELETE:           'Del / Bksp',
  GROUP:            'Ctrl+G',
  UNGROUP:          'Ctrl+Shift+G',
  CAPTURE_TEMPLATE: 'Ctrl+B',
  SAVE:             'Ctrl+S',

  // Selection
  SELECT_BY_ASSET:  'Ctrl+Shift+A',
  NUDGE:            '↑↓←→',
  NUDGE_PIXEL:      'Shift+↑↓←→',
  Z_FORWARD:        ']',
  Z_BACKWARD:       '[',
  Z_FRONT:          'Shift+]',
  Z_BACK:           'Shift+[',

  // View
  SNAP:             'G',
  MIRROR:           'M',
  HOTKEYS:          '?',
} as const;

export type KeyValue = typeof KEYS[keyof typeof KEYS];

/**
 * Actual KeyboardEvent.key values for KEYS entries that are display-only strings
 * (multi-key bindings can't be represented as a single matchable string).
 */
export const KEY_EVENTS = {
  /** KEYS.DELETE display = 'Del / Bksp' */
  DELETE:  ['Delete', 'Backspace'] as const,
  /** KEYS.NUDGE / KEYS.NUDGE_PIXEL display = '↑↓←→' */
  ARROWS:  ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const,
  /** Shift+] produces '}' on US layout — matchesKey can't resolve shifted symbols */
  Z_FRONT: ['}'] as const,
  /** Shift+[ produces '{' on US layout */
  Z_BACK:  ['{'] as const,
} as const;

/**
 * Returns true when the KeyboardEvent matches the given binding string.
 *
 * Composite bindings (e.g. 'Ctrl+Z', 'Ctrl+Shift+G'):
 *   Modifiers are checked exactly; the final part is compared case-insensitively.
 *
 * 'Space': matches e.key === ' '.
 *
 * Single letter ('V', 'B', …): case-insensitive e.key match, no modifier enforcement
 *   (the caller's code structure ensures ctrl-held events are handled first).
 *
 * Symbol / other ('-', ']', '?', …): exact e.key match.
 *
 * Multi-key display strings (KEYS.DELETE, KEYS.NUDGE, …) return false — use KEY_EVENTS instead.
 */
export function matchesKey(e: KeyboardEvent, binding: string): boolean {
  // Composite: 'Ctrl+Z', 'Ctrl+Shift+G', 'Shift+↑↓←→' (display-only, will return false below)
  if (binding.includes('+')) {
    const parts = binding.split('+');
    const rawKey = parts[parts.length - 1];
    const needsCtrl  = parts.includes('Ctrl');
    const needsShift = parts.includes('Shift');
    const needsAlt   = parts.includes('Alt');

    if ((e.ctrlKey || e.metaKey) !== needsCtrl)  return false;
    if (e.shiftKey               !== needsShift)  return false;
    if (e.altKey                 !== needsAlt)    return false;

    if (rawKey === 'Space') return e.key === ' ';
    // Multi-arrow display token — not a real key
    if (rawKey === '↑↓←→') return false;
    return e.key.toLowerCase() === rawKey.toLowerCase();
  }

  if (binding === 'Space')   return e.key === ' ';
  if (binding === '↑↓←→')   return false; // display-only multi-key
  if (binding === 'Del / Bksp') return false; // use KEY_EVENTS.DELETE

  // Single letter — case-insensitive
  if (/^[a-zA-Z]$/.test(binding)) return e.key.toLowerCase() === binding.toLowerCase();

  // Symbol / punctuation — exact match
  return e.key === binding;
}
