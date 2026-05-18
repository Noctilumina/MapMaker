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
