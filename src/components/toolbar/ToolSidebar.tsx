import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { useHistoryStore } from '../../stores/historyStore';
import { theme } from '../../theme';
import { TOOL_KEYS, HOTKEYS } from '../../hotkeys';
import { KEYS } from '../../keys';

import type { ToolName, PendingShape } from '../../stores/editorStore';

// Derive human-readable labels from the hotkeys registry
const toolLabels: Record<string, string> = Object.fromEntries(
  HOTKEYS
    .filter(h => h.id.startsWith('tool-') && h.id !== 'tool-pan-temp')
    .map(h => [h.id.slice(5), h.label])
);

// All stamp-variant tools — treated as "stamp" in the sidebar
const STAMP_VARIANTS: ToolName[] = ['stamp', 'rect-stamp', 'line-stamp', 'scatter', 'replace', 'copy-stamp', 'random-stamp'];

const tools: { name: ToolName; icon: string }[] = [
  { name: 'select',  icon: '\u2196' },
  { name: 'pan',     icon: '\u270B' },
  { name: 'stamp',   icon: '\uD83D\uDD8C' },
  { name: 'polygon', icon: '\u2B21' },
  { name: 'path',    icon: '\u2935' },
  { name: 'eraser',  icon: '\uD83E\uDDF9' },
  { name: 'fill',    icon: '\uD83E\uDEA3' },
  { name: 'light',   icon: '\u2600' },
  { name: 'measure', icon: '\u21FF' },
];

const TOOL_SIZE = 32;
const TOOL_GAP = 2;
const PAD_TOP = 8;

interface Props {
  expanded: boolean;
  onToggle: () => void;
}

export default function ToolSidebar({ expanded, onToggle }: Props) {
  const activeTool    = useEditorStore((s) => s.activeTool);
  const setTool       = useEditorStore((s) => s.setTool);
  const setPendingShape = useEditorStore((s) => s.setPendingShape);
  const grid          = useMapStore((s) => s.grid);
  const setGrid       = useMapStore((s) => s.setGrid);
  const snapToGrid    = useEditorStore((s) => s.snapToGrid);
  const setSnapToGrid = useEditorStore((s) => s.setSnapToGrid);
  const mirrorSymmetry    = useEditorStore((s) => s.mirrorSymmetry);
  const setMirrorSymmetry = useEditorStore((s) => s.setMirrorSymmetry);
  const mirrorAxis    = useEditorStore((s) => s.mirrorAxis);
  const setMirrorAxis = useEditorStore((s) => s.setMirrorAxis);
  const setMirrorLineX = useEditorStore((s) => s.setMirrorLineX);
  const setMirrorLineY = useEditorStore((s) => s.setMirrorLineY);

  const handleToolClick = (name: ToolName) => {
    if (activeTool !== name) {
      useHistoryStore.getState().captureSnapshot();
    }
    setTool(name);
    setPendingShape(null);
  };

  const sidebarTool = STAMP_VARIANTS.includes(activeTool) ? 'stamp' : activeTool;
  const activeIndex = tools.findIndex(t => t.name === sidebarTool);
  const indicatorTop = activeIndex >= 0
    ? PAD_TOP + activeIndex * (TOOL_SIZE + TOOL_GAP)
    : -100;

  const rowStyle = (isActive?: boolean, activeColor?: string): React.CSSProperties => expanded
    ? {
        width: '100%', height: TOOL_SIZE, padding: '0 10px', gap: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        borderRadius: theme.radius, border: 'none', cursor: 'pointer',
        background: isActive ? (activeColor ? `${activeColor}22` : theme.primaryAlphaLow) : 'transparent',
        transition: 'color 0.15s', position: 'relative', zIndex: 1,
      }
    : {
        width: TOOL_SIZE, height: TOOL_SIZE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: theme.radius, border: 'none', cursor: 'pointer',
        background: 'transparent',
        transition: 'color 0.15s', position: 'relative', zIndex: 1,
      };

  const iconSpan = (content: React.ReactNode) => (
    <span style={{ width: 20, flexShrink: 0, textAlign: 'center', fontSize: 14, lineHeight: 1 }}>
      {content}
    </span>
  );

  const labelSpan = (text: string) => expanded ? (
    <span style={{ fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase' as const, letterSpacing: '0.05em', lineHeight: 1 }}>
      {text}
    </span>
  ) : null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: expanded ? 'stretch' : 'center',
      paddingTop: PAD_TOP, gap: TOOL_GAP,
      position: 'relative', height: '100%',
    }}>
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
        const isActive = t.name === 'stamp' ? STAMP_VARIANTS.includes(activeTool) : activeTool === t.name;
        const label = toolLabels[t.name] || t.name;
        const key = TOOL_KEYS[t.name];
        const tooltipText = expanded
          ? (key || '')
          : `${label}${key ? ` (${key})` : ''}`;
        return (
          <button
            key={t.name}
            onClick={() => handleToolClick(t.name)}
            title={tooltipText}
            style={{ ...rowStyle(), color: isActive ? theme.primary : theme.textMuted }}
          >
            {iconSpan(t.icon)}
            {labelSpan(label)}
          </button>
        );
      })}

      <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />

      <button
        onClick={() => { useHistoryStore.getState().captureSnapshot(); setGrid({ visible: !grid.visible }); }}
        title={expanded ? 'Toggle grid' : 'Grid (toggle)'}
        style={{ ...rowStyle(), color: grid.visible ? theme.text : theme.textMuted }}
      >
        {iconSpan('\u25A6')}
        {labelSpan('Grid')}
      </button>

      <button
        onClick={() => { useHistoryStore.getState().captureSnapshot(); setSnapToGrid(!snapToGrid); }}
        title={`Snap to grid (${KEYS.SNAP}) — ${snapToGrid ? 'ON' : 'OFF'}`}
        style={{
          ...rowStyle(),
          background: snapToGrid ? theme.successAlphaLow : 'transparent',
          color: snapToGrid ? theme.success : theme.textMuted,
          borderLeft: snapToGrid ? `3px solid ${theme.success}` : '3px solid transparent',
          boxShadow: snapToGrid ? `0 0 8px ${theme.successAlphaMid}` : 'none',
        }}
      >
        {iconSpan('🧲')}
        {labelSpan('Snap')}
      </button>

      <button
        onClick={() => setMirrorSymmetry(!mirrorSymmetry)}
        title={`Mirror symmetry (${KEYS.MIRROR}) — ${mirrorSymmetry ? 'ON' : 'OFF'}`}
        style={{
          ...rowStyle(),
          fontSize: 14,
          background: mirrorSymmetry ? theme.primaryAlphaLow : 'transparent',
          color: mirrorSymmetry ? theme.primary : theme.textMuted,
          borderLeft: mirrorSymmetry ? `3px solid ${theme.primary}` : '3px solid transparent',
          boxShadow: mirrorSymmetry ? `0 0 8px ${theme.primaryAlphaMid}` : 'none',
        }}
      >
        {iconSpan('⇔')}
        {labelSpan('Mirror')}
      </button>

      {mirrorSymmetry && (
        <>
          <div style={{ display: 'flex', gap: 2, padding: '0 4px', width: '100%', boxSizing: 'border-box' as const }}>
            {(['x', 'y', 'both'] as const).map((axis) => {
              const label = axis === 'x' ? 'V' : axis === 'y' ? 'H' : '⊕';
              const tip = axis === 'x' ? 'Vertical (left-right)' : axis === 'y' ? 'Horizontal (top-bottom)' : 'Both axes';
              const isActive = mirrorAxis === axis;
              return (
                <button
                  key={axis}
                  onClick={() => setMirrorAxis(axis)}
                  title={tip}
                  style={{
                    flex: 1, height: 22, fontSize: 11, border: 'none', cursor: 'pointer',
                    borderRadius: theme.radius,
                    background: isActive ? theme.primary : theme.surface,
                    color: isActive ? theme.bg : theme.textMuted,
                    fontFamily: theme.fontHeading, fontWeight: isActive ? 'bold' : 'normal',
                    transition: 'background 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 2, padding: '0 4px', width: '100%', boxSizing: 'border-box' as const }}>
            {(mirrorAxis === 'x' || mirrorAxis === 'both') && (
              <button
                onClick={() => setMirrorLineX(null)}
                title="Snap vertical mirror to center"
                style={{
                  flex: 1, height: 20, fontSize: 9, border: 'none', cursor: 'pointer',
                  borderRadius: theme.radius, background: theme.surface, color: theme.textMuted,
                  fontFamily: theme.fontHeading,
                }}
              >
                {expanded ? 'Center V' : '↔'}
              </button>
            )}
            {(mirrorAxis === 'y' || mirrorAxis === 'both') && (
              <button
                onClick={() => setMirrorLineY(null)}
                title="Snap horizontal mirror to center"
                style={{
                  flex: 1, height: 20, fontSize: 9, border: 'none', cursor: 'pointer',
                  borderRadius: theme.radius, background: theme.surface, color: theme.textMuted,
                  fontFamily: theme.fontHeading,
                }}
              >
                {expanded ? 'Center H' : '↕'}
              </button>
            )}
          </div>
          <div style={{ padding: '2px 6px' }}>
            <span style={{ fontSize: 8, color: theme.textMuted, fontFamily: theme.fontHeading, letterSpacing: '0.03em', lineHeight: 1 }}>
              drag line on canvas
            </span>
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={onToggle}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        style={{
          ...rowStyle(),
          color: theme.textMuted,
          marginBottom: PAD_TOP,
          fontSize: 12,
        }}
      >
        {iconSpan(expanded ? '«' : '»')}
        {labelSpan('Collapse')}
      </button>
    </div>
  );
}
