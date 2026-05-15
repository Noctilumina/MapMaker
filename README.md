# MapMaker

A browser-based map editor for tabletop RPGs and other grid-based maps. Built with React, Konva, and Zustand.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

## Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd MapMaker

# Install dependencies
npm install
```

## Running Locally

```bash
npm run dev
```

Opens at `http://localhost:5173` by default. Hot module replacement is active — changes to source files reflect immediately in the browser.

## Other Commands

| Command | Description |
|---|---|
| `npm run build` | Type-check and build for production (output in `dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── canvas/       # Konva canvas rendering (map, background, tiles, lighting)
│   ├── dialogs/      # Modal dialogs
│   ├── panels/       # Side panels (layers, properties, assets)
│   └── toolbar/      # Tool sidebar and top toolbar
├── hooks/            # Custom React hooks (keyboard shortcuts, canvas interaction, autosave)
├── stores/           # Zustand state (map data, editor UI, undo/redo history)
├── tools/            # Tool implementations (select, stamp, eraser, pan, polygon, path)
├── types/            # TypeScript interfaces and defaults
└── utils/            # Storage (IndexedDB), export (PNG), migration, grid math
```

## Features

- Place, move, rotate, and scale tile assets on a grid
- Draw polygon and path elements with texture fill
- Layer system with visibility and lock controls
- Group elements together
- Background image support (built-in textures or upload your own)
- Dynamic lighting and light occlusion
- Undo/redo
- Auto-save to IndexedDB
- Export/import projects as `.mapmaker.json`
- Export map as PNG

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `V` | Select tool |
| `B` | Stamp (place) tool |
| `E` | Eraser tool |
| `H` | Pan tool |
| `P` | Polygon tool |
| `R` | Path tool (or rotate stamp when stamp tool active) |
| `Space` (hold) | Temporarily switch to pan |
| `G` | Toggle snap to grid |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+C` | Copy selected elements |
| `Ctrl+V` | Paste copied elements (offset by 1 cell) |
| `Ctrl+D` | Duplicate selected elements |
| `Ctrl+G` | Group selected elements |
| `Ctrl+Shift+G` | Ungroup |
| `[` / `]` | Send backward / bring forward |
| `Shift+[` / `Shift+]` | Send to back / bring to front |
| `Delete` / `Backspace` | Delete selected elements |

## Data Persistence

Projects are saved automatically to the browser's IndexedDB. To back up or share a project, use **File > Export** to download a `.mapmaker.json` file. Use **File > Import** to load it back.

Exported PNG images include the full rendered map at canvas resolution.
