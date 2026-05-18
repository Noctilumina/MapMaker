import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { useHistoryStore } from '../../stores/historyStore';
import { theme } from '../../theme';
import { TOOL_KEYS } from '../../hotkeys';

import type { ToolName, PendingShape } from '../../stores/editorStore';

const tools: { name: ToolName; icon: string }[] = [
  { name: 'select', icon: '\u2196' },
  { name: 'pan', icon: '\u270B' },
  { name: 'stamp', icon: '\uD83D\uDD8C' },
  { name: 'rect-stamp', icon: '\u25A3' },
  { name: 'line-stamp', icon: '\u2500' },
  { name: 'scatter', icon: '\u2234' },
  { name: 'replace', icon: '\u21C4' },
  { name: 'polygon', icon: '\u2B21' },
  { name: 'path', icon: '\u2935' },
  { name: 'eraser', icon: '\uD83E\uDDF9' },
  { name: 'fill', icon: '\uD83E\uDEA3' },
  { name: 'copy-stamp', icon: '\u2750' },
  { name: 'light', icon: '\u2600' },
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
  const mirrorSymmetry = useEditorStore((s) => s.mirrorSymmetry);
  const setMirrorSymmetry = useEditorStore((s) => s.setMirrorSymmetry);
  const scatterAssetIds = useEditorStore((s) => s.scatterAssetIds);
  const toggleScatterAsset = useEditorStore((s) => s.toggleScatterAsset);
  const replaceSourceAssetId = useEditorStore((s) => s.replaceSourceAssetId);
  const replaceTargetAssetId = useEditorStore((s) => s.replaceTargetAssetId);
  const assets = useMapStore((s) => s.assets);
  const elements = useMapStore((s) => s.elements);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);

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
          <button key={t.name} onClick={() => handleToolClick(t.name)} title={`${t.name}${TOOL_KEYS[t.name] ? ` (${TOOL_KEYS[t.name]})` : ''}`}
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

      {activeTool === 'scatter' && (
        <>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: 24, margin: '4px 0' }} />
          <div style={{ fontSize: 9, color: theme.textMuted, textAlign: 'center', padding: '0 4px' }}>
            Click assets in browser to add to set
          </div>
          {scatterAssetIds.length === 0 ? (
            <div style={{ fontSize: 9, color: theme.danger, textAlign: 'center', padding: '0 4px' }}>No assets</div>
          ) : (
            scatterAssetIds.map(id => {
              const asset = assets[id];
              if (!asset) return null;
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', padding: '0 4px', boxSizing: 'border-box' as const }}>
                  <img src={asset.src} alt={asset.name} style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 2, background: theme.surface, flexShrink: 0 }} />
                  <button onClick={() => toggleScatterAsset(id)} title={`Remove ${asset.name}`}
                    style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1, flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              );
            })
          )}
        </>
      )}

      {activeTool === 'replace' && (
        <>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: 24, margin: '4px 0' }} />
          <div style={{ fontSize: 9, color: theme.textMuted, textAlign: 'center', padding: '0 4px' }}>Click tile on canvas → source</div>
          <div style={{ padding: '2px 4px', width: '100%', boxSizing: 'border-box' as const }}>
            <div style={{ fontSize: 9, color: theme.textMuted, marginBottom: 2 }}>Source:</div>
            {replaceSourceAssetId && assets[replaceSourceAssetId] ? (
              <img src={assets[replaceSourceAssetId].src} alt="source" style={{ width: 28, height: 28, objectFit: 'contain', background: theme.surface, borderRadius: 2, border: `1px solid ${theme.warning}` }} />
            ) : (
              <div style={{ fontSize: 9, color: theme.danger }}>none</div>
            )}
          </div>
          <div style={{ padding: '2px 4px', width: '100%', boxSizing: 'border-box' as const }}>
            <div style={{ fontSize: 9, color: theme.textMuted, marginBottom: 2 }}>Target (from browser):</div>
            {replaceTargetAssetId && assets[replaceTargetAssetId] ? (
              <img src={assets[replaceTargetAssetId].src} alt="target" style={{ width: 28, height: 28, objectFit: 'contain', background: theme.surface, borderRadius: 2, border: `1px solid ${theme.success}` }} />
            ) : (
              <div style={{ fontSize: 9, color: theme.danger }}>none</div>
            )}
          </div>
          <button
            onClick={() => {
              if (!replaceSourceAssetId || !replaceTargetAssetId) return;
              useHistoryStore.getState().captureSnapshot();
              useMapStore.getState().replaceAsset(activeLayerId, replaceSourceAssetId, replaceTargetAssetId);
            }}
            disabled={!replaceSourceAssetId || !replaceTargetAssetId}
            style={{
              background: replaceSourceAssetId && replaceTargetAssetId ? theme.success : theme.surface,
              color: replaceSourceAssetId && replaceTargetAssetId ? theme.bg : theme.textMuted,
              border: 'none', borderRadius: theme.radius, padding: '4px 0', fontSize: 9,
              cursor: replaceSourceAssetId && replaceTargetAssetId ? 'pointer' : 'default',
              width: '100%', fontFamily: theme.fontHeading, textTransform: 'uppercase' as const,
            }}
          >
            Apply
          </button>
          <div style={{ fontSize: 9, color: theme.textMuted, textAlign: 'center', padding: '0 4px' }}>
            {(() => {
              if (!replaceSourceAssetId) return '';
              const count = elements.filter(el => el.type === 'tile' && 'assetId' in el && el.assetId === replaceSourceAssetId && el.layerId === activeLayerId).length;
              return `${count} tile(s) on layer`;
            })()}
          </div>
        </>
      )}

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
      <button
        onClick={() => setMirrorSymmetry(!mirrorSymmetry)}
        title={`Mirror symmetry (M) — ${mirrorSymmetry ? 'ON' : 'OFF'}`}
        style={{
          width: TOOL_SIZE, height: TOOL_SIZE, borderRadius: theme.radius, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, cursor: 'pointer',
          background: mirrorSymmetry ? theme.primaryAlphaLow : 'transparent',
          color: mirrorSymmetry ? theme.primary : theme.textMuted,
          borderLeft: mirrorSymmetry ? `3px solid ${theme.primary}` : '3px solid transparent',
          boxShadow: mirrorSymmetry ? `0 0 8px ${theme.primaryAlphaMid}` : 'none',
          transition: 'all 0.15s',
        }}
      >
        ⇔
      </button>
    </div>
  );
}
