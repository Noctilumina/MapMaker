import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { useHistoryStore } from '../../stores/historyStore';

import type { ToolName, PendingShape } from '../../stores/editorStore';

const tools: { name: ToolName; icon: string; shortcut: string }[] = [
  { name: 'select', icon: '\u2196', shortcut: 'V' },
  { name: 'pan', icon: '\u270B', shortcut: 'H' },
  { name: 'stamp', icon: '\uD83D\uDD8C', shortcut: 'B' },
  { name: 'polygon', icon: '\u2B21', shortcut: 'P' },
  { name: 'path', icon: '\u2935', shortcut: 'R' },
  { name: 'eraser', icon: '\uD83E\uDDF9', shortcut: 'E' },
];

const shapes: { name: PendingShape; icon: string; label: string }[] = [
  { name: 'circle', icon: '\u25CB', label: 'Circle' },
  { name: 'rect', icon: '\u25A1', label: 'Rectangle' },
  { name: 'hexagon', icon: '\u2B22', label: 'Hexagon' },
];

export default function ToolSidebar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const pendingShape = useEditorStore((s) => s.pendingShape);
  const setPendingShape = useEditorStore((s) => s.setPendingShape);
  const grid = useMapStore((s) => s.grid);
  const setGrid = useMapStore((s) => s.setGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const setSnapToGrid = useEditorStore((s) => s.setSnapToGrid);

  const handleShapeClick = (shape: PendingShape) => {
    useHistoryStore.getState().captureSnapshot();
    setTool('polygon');
    setPendingShape(shape);
  };

  const handleToolClick = (name: ToolName) => {
    if (activeTool !== name) {
      useHistoryStore.getState().captureSnapshot();
    }
    setTool(name);
    setPendingShape(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 4 }}>
      {tools.map((t) => (
        <button key={t.name} onClick={() => handleToolClick(t.name)} title={`${t.name} (${t.shortcut})`}
          style={{ width: 32, height: 32, background: activeTool === t.name ? '#cba6f7' : '#313244', borderRadius: 6, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer' }}>
          {t.icon}
        </button>
      ))}

      {/* Shape presets — visible when polygon tool is active */}
      {activeTool === 'polygon' && (
        <>
          <div style={{ borderTop: '1px solid #45475a', width: 24, margin: '2px 0' }} />
          {shapes.map((s) => (
            <button key={s.name} onClick={() => handleShapeClick(s.name)} title={s.label}
              style={{
                width: 32, height: 32,
                background: pendingShape === s.name ? '#a6e3a1' : '#313244',
                color: pendingShape === s.name ? '#1e1e2e' : '#a6adc8',
                borderRadius: 6, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, cursor: 'pointer',
              }}>
              {s.icon}
            </button>
          ))}
        </>
      )}

      <div style={{ borderTop: '1px solid #45475a', width: 24, margin: '4px 0' }} />
      <button onClick={() => { useHistoryStore.getState().captureSnapshot(); setGrid({ visible: !grid.visible }); }} title="Toggle grid"
        style={{ width: 32, height: 32, background: grid.visible ? '#313244' : '#45475a', borderRadius: 6, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#a6adc8', cursor: 'pointer' }}>{'\u25A6'}</button>
      <button
        onClick={() => { useHistoryStore.getState().captureSnapshot(); setSnapToGrid(!snapToGrid); }}
        title={`Snap to grid (G) — ${snapToGrid ? 'ON' : 'OFF'}`}
        style={{
          width: 32, height: 32,
          background: snapToGrid ? '#a6e3a1' : '#313244',
          color: snapToGrid ? '#1e1e2e' : '#a6adc8',
          borderRadius: 6, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, cursor: 'pointer',
        }}
      >
        🧲
      </button>
    </div>
  );
}
