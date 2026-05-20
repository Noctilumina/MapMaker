# MapMaker — Project Instructions

## Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`

| Bump | When |
|------|------|
| **Major** | Reworking the base app (rendering pipeline overhaul, full architecture change, etc.) |
| **Minor** | Adding a big tool or substantial feature system (new tool in the toolbar, full lighting system, etc.) |
| **Patch** | Smaller fixes and capabilities (new controls in a panel, UX improvements, bug fixes, performance) |

Always update both `package.json` and the `v{version}` label in `src/components/toolbar/StatusBar.tsx`.

### Version history reference

- `1.0.0` — base app (select, pan, stamp, polygon, path, eraser)
- `1.1.0` — lighting system (point, bar, polygon lights; occlusion; shadow rendering)
- `1.2.0` — expanded toolset: light placement (L), rect-stamp (F), line-stamp (N), scatter (X), replace (-)
- `1.2.1` — z-index / hierarchy separation
- `1.2.2` — polygon opening controls (edge index, position, width) + auto-wall button
- `1.2.3` — multi-select batch move + copy-paste preserving group structure
- `1.2.4` — click-through stacked element cycling
- `1.2.5` — default map loading fix, version display, build fix
- `1.3.2` — mirror line overlay: draggable axis line on canvas, snaps to center, V/H/Both modes
- `1.3.3` — prefabs: save/load stamp templates; Prefabs tab in AssetBrowser, persist to localStorage
- `1.3.4` — prefabs: "Save as Prefab" button in PropertiesPanel multi-select action row
- `1.3.5` — measure tool (U): click-drag distance overlay in cells + real-world units
- `1.3.6` — line-stamp axis lock: Free/H/V buttons + Shift auto-lock to dominant axis
- `1.4.0` — multi-map tabs: open multiple maps simultaneously, quick switching, open file in new tab
- `1.4.1` — random stamp tool (S): shuffle-bag/pure/round-robin selection, rotation jitter, scale jitter, R reshuffle
- `1.4.2` — random stamp: alt+click map tiles to add to pool, mini asset browser + search in sidebar panel
