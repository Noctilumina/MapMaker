import { useEffect, useState, useCallback, useRef } from 'react';
import './App.css';
import { useTheme } from './context/ThemeContext';
import MapCanvas, { getStageInstance } from './components/canvas/MapCanvas';
import AssetBrowser from './components/panels/AssetBrowser';
import PropertiesPanel from './components/panels/PropertiesPanel';
import HierarchyPanel from './components/panels/HierarchyPanel';
import LayerBar from './components/panels/LayerBar';
import Toolbar from './components/toolbar/Toolbar';
import ToolSidebar from './components/toolbar/ToolSidebar';
import StatusBar from './components/toolbar/StatusBar';
import ExportDialog from './components/dialogs/ExportDialog';
import PrintDialog from './components/dialogs/PrintDialog';
import NewProjectDialog from './components/dialogs/NewProjectDialog';
import HotkeysDialog from './components/dialogs/HotkeysDialog';
import { useMapStore } from './stores/mapStore';
import { useEditorStore } from './stores/editorStore';
import { loadPresetAssets } from './utils/assetLoader';
import { exportToPng } from './utils/export';
import { computeOcclusionHull } from './utils/convexHull';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';
import DiagonalStripes from './components/DiagonalStripes';
import { listProjectIds, loadProject as loadProjectFromDb } from './utils/storage';
import { migrateProject } from './utils/migration';

export default function App() {
  const { mode } = useTheme();
  const mapName = useMapStore((s) => s.name);
  const showHotkeys = useEditorStore((s) => s.showHotkeys);
  const setShowHotkeys = useEditorStore((s) => s.setShowHotkeys);
  const [showExport, setShowExport] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [assetPanelWidth, setAssetPanelWidth] = useState(260);
  const [rightPanelWidth, setRightPanelWidth] = useState(240);
  const dragRef = useRef<{ target: 'asset' | 'right'; startX: number; startWidth: number } | null>(null);

  // Compute stripe color based on theme mode (canvas 2D context can't use CSS variables)
  const stripeColor = mode === 'dark' ? 'rgba(255, 64, 129, 0.18)' : 'rgba(233, 30, 99, 0.15)';

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    if (dragRef.current.target === 'asset') {
      setAssetPanelWidth(Math.max(160, Math.min(500, dragRef.current.startWidth + delta)));
    } else {
      setRightPanelWidth(Math.max(160, Math.min(500, dragRef.current.startWidth - delta)));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.title = mapName ? `${mapName} — MapMaker` : 'MapMaker';
  }, [mapName]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    (async () => {
      const store = useMapStore.getState();

      // Try to restore last saved project from IDB (skip if empty/blank)
      try {
        const ids = await listProjectIds();
        if (ids.length > 0) {
          const saved = await loadProjectFromDb(ids[ids.length - 1]);
          if (saved && (saved.elements?.length ?? 0) > 0) {
            store.loadProject(saved);
            const presets = loadPresetAssets(saved.grid.cellSize);
            Object.entries(presets).forEach(([id, asset]) => store.registerAsset(id, asset));
            return;
          }
        }
      } catch {
        // IDB unavailable or corrupt — fall through to default map
      }

      // No saved project (or blank) — load default map
      try {
        const base = import.meta.env.BASE_URL;
        const res = await fetch(`${base}default-map.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const project = migrateProject(json);
        store.loadProject(project);
        const presets = loadPresetAssets(project.grid.cellSize);
        Object.entries(presets).forEach(([id, asset]) => store.registerAsset(id, asset));
      } catch (err) {
        console.error('Failed to load default map:', err);
      }
    })();
  }, []);

  // Compute convex hulls for all object assets
  useEffect(() => {
    const store = useMapStore.getState();
    const assetsToProcess = Object.entries(store.assets).filter(([_id, asset]) =>
      asset.category !== 'floors' && !asset.occlusionHull
    );

    assetsToProcess.forEach(([id, asset]) => {
      computeOcclusionHull(asset.src)
        .then(hull => {
          if (hull.length >= 6) {
            store.setAssetHull(id, hull);
          }
        });
    });
  }, []);

  useKeyboardShortcuts();
  useAutoSave();

  return (
    <div className="app">
      <header className="toolbar">
        <Toolbar onExportPng={() => setShowExport(true)} onNewProject={() => setShowNewProject(true)} onPrint={() => setShowPrint(true)} onShowHotkeys={() => setShowHotkeys(true)} />
      </header>
      <div className="workspace">
        <aside className="tool-sidebar">
          <ToolSidebar />
          <DiagonalStripes count={4} thickness={12} gap={24} color={stripeColor} angle={-45} />
        </aside>
        <aside className="asset-panel" style={{ width: assetPanelWidth }}>
          <AssetBrowser />
          <div className="resize-handle resize-handle-right"
            onMouseDown={(e) => { dragRef.current = { target: 'asset', startX: e.clientX, startWidth: assetPanelWidth }; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} />
        </aside>
        <main className="canvas-area">
          <MapCanvas />
        </main>
        <aside className="right-panel" style={{ width: rightPanelWidth, display: 'flex', flexDirection: 'column' }}>
          <div className="resize-handle resize-handle-left"
            onMouseDown={(e) => { dragRef.current = { target: 'right', startX: e.clientX, startWidth: rightPanelWidth }; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} />
          <div style={{ flex: 1, borderBottom: 'var(--border-light)', overflow: 'auto' }}>
            <PropertiesPanel />
          </div>
          <LayerBar />
          <div style={{ flex: 1, overflow: 'auto' }}>
            <HierarchyPanel />
          </div>
        </aside>
      </div>
      <footer className="status-bar">
        <StatusBar />
      </footer>
      {showExport && (
        <ExportDialog
          onExport={(opts) => {
            const stage = getStageInstance();
            const grid = useMapStore.getState().grid;
            if (stage) {
              exportToPng(stage, {
                dpi: opts.dpi,
                gridWidthCells: grid.width,
                gridHeightCells: grid.height,
                cellSizePx: grid.cellSize,
                includeGrid: opts.includeGrid,
                includeGmNotes: opts.includeGmNotes,
                backgroundColor: useMapStore.getState().grid.backgroundColor,
              });
            }
            setShowExport(false);
          }}
          onClose={() => setShowExport(false)}
        />
      )}
      {showPrint && (
        <PrintDialog getStage={getStageInstance} onClose={() => setShowPrint(false)} />
      )}
      {showHotkeys && (
        <HotkeysDialog onClose={() => setShowHotkeys(false)} />
      )}
      {showNewProject && (
        <NewProjectDialog
          onConfirm={(opts) => {
            useMapStore.getState().reset();
            useMapStore.getState().setGrid({ width: opts.width, height: opts.height, scale: opts.scale });
            const grid = useMapStore.getState().grid;
            const presets = loadPresetAssets(grid.cellSize);
            Object.entries(presets).forEach(([id, asset]) => {
              useMapStore.getState().registerAsset(id, asset);
            });
            setShowNewProject(false);
          }}
          onClose={() => setShowNewProject(false)}
        />
      )}
    </div>
  );
}
