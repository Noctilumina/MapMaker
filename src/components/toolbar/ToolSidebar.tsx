import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { useHistoryStore } from '../../stores/historyStore';
import { theme } from '../../theme';

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

const TOOL_SIZE = 32;
const TOOL_GAP = 2;
const PAD_TOP = 8;

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

  const activeIndex = tools.findIndex(t => t.name === activeTool);
  const indicatorTop = activeIndex >= 0
    ? PAD_TOP + activeIndex * (TOOL_SIZE + TOOL_GAP)
    : -100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: PAD_TOP, gap: TOOL_GAP, position: 'relative' }}>
      {/* Sliding active indicator */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: indicatorTop,
        width: '100%',
        height: TOOL_SIZE,
        background: theme.primaryAlphaLow,
        borderLeft: `3px solid ${theme.primary}`,
        boxShadow: `0 0 10px ${theme.primaryAlphaMid}`,
        borderRadius: theme.radius,
        transition: 'top 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s',
        opacity: activeIndex >= 0 ? 1 : 0,
        pointerEvents: 'none',
      }} />

      {tools.map((t) => {
        const isActive = activeTool === t.name;
        return (
          <button key={t.name} onClick={() => handleToolClick(t.name)} title={`${t.name} (${t.shortcut})`}
            style={{
              width: TOOL_SIZE, height: TOOL_SIZE,
              borderRadius: theme.radius,
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, cursor: 'pointer',
              background: 'transparent',
              color: isActive ? theme.primary : theme.textMuted,
              transition: 'color 0.15s',
              position: 'relative',
              zIndex: 1,
            }}>
            {t.icon}
          </button>
        );
      })}

      {activeTool === 'polygon' && (
        <>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: 24, margin: '4px 0' }} />
          {shapes.map((s) => {
            const isActive = pendingShape === s.name;
            return (
              <button key={s.name} onClick={() => handleShapeClick(s.name)} title={s.label}
                style={{
                  width: TOOL_SIZE, height: TOOL_SIZE,
                  borderRadius: theme.radius,
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, cursor: 'pointer',
                  background: isActive ? theme.successAlphaLow : 'transparent',
                  color: isActive ? theme.success : theme.textMuted,
                  borderLeft: isActive ? `3px solid ${theme.success}` : '3px solid transparent',
                  boxShadow: isActive ? `0 0 8px ${theme.successAlphaMid}` : 'none',
                  transition: 'all 0.15s',
                }}>
                {s.icon}
              </button>
            );
          })}
        </>
      )}

      <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: 24, margin: '4px 0' }} />
      <button onClick={() => { useHistoryStore.getState().captureSnapshot(); setGrid({ visible: !grid.visible }); }} title="Toggle grid"
        style={{
          width: TOOL_SIZE, height: TOOL_SIZE, borderRadius: theme.radius, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, cursor: 'pointer',
          background: 'transparent', color: grid.visible ? theme.text : theme.textMuted,
          transition: 'color 0.15s',
        }}>{'\u25A6'}</button>
      <button
        onClick={() => { useHistoryStore.getState().captureSnapshot(); setSnapToGrid(!snapToGrid); }}
        title={`Snap to grid (G) — ${snapToGrid ? 'ON' : 'OFF'}`}
        style={{
          width: TOOL_SIZE, height: TOOL_SIZE, borderRadius: theme.radius, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, cursor: 'pointer',
          background: snapToGrid ? theme.successAlphaLow : 'transparent',
          color: snapToGrid ? theme.success : theme.textMuted,
          borderLeft: snapToGrid ? `3px solid ${theme.success}` : '3px solid transparent',
          boxShadow: snapToGrid ? `0 0 8px ${theme.successAlphaMid}` : 'none',
          transition: 'all 0.15s',
        }}
      >
        <span>🧲</span>
      </button>
    </div>
  );
}
