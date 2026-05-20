import { useState, useMemo } from 'react';
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

const tools: { name: ToolName; icon: string }[] = [
  { name: 'select',     icon: '\u2196' },
  { name: 'pan',        icon: '\u270B' },
  { name: 'stamp',      icon: '\uD83D\uDD8C' },
  { name: 'rect-stamp', icon: '\u25A3' },
  { name: 'line-stamp', icon: '\u2500' },
  { name: 'scatter',    icon: '\u2234' },
  { name: 'replace',    icon: '\u21C4' },
  { name: 'polygon',    icon: '\u2B21' },
  { name: 'path',       icon: '\u2935' },
  { name: 'eraser',     icon: '\uD83E\uDDF9' },
  { name: 'fill',       icon: '\uD83E\uDEA3' },
  { name: 'copy-stamp', icon: '\u2750' },
  { name: 'light',      icon: '\u2600' },
  { name: 'measure',       icon: '\u21FF' },
  { name: 'random-stamp',  icon: '\uD83C\uDFB2' },
];

const shapes: { name: PendingShape; icon: string; label: string }[] = [
  { name: 'circle',  icon: '\u25CB', label: 'Circle' },
  { name: 'rect',    icon: '\u25A1', label: 'Rectangle' },
  { name: 'hexagon', icon: '\u2B22', label: 'Hexagon' },
];

const TOOL_SIZE = 32;
const TOOL_GAP = 2;
const PAD_TOP = 8;

interface Props {
  expanded: boolean;
  onToggle: () => void;
}

export default function ToolSidebar({ expanded, onToggle }: Props) {
  const [rsSearch, setRsSearch] = useState('');
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
  const mirrorAxis = useEditorStore((s) => s.mirrorAxis);
  const setMirrorAxis = useEditorStore((s) => s.setMirrorAxis);
  const setMirrorLineX = useEditorStore((s) => s.setMirrorLineX);
  const setMirrorLineY = useEditorStore((s) => s.setMirrorLineY);
  const lineStampAxisLock = useEditorStore((s) => s.lineStampAxisLock);
  const setLineStampAxisLock = useEditorStore((s) => s.setLineStampAxisLock);
  const scatterAssetIds = useEditorStore((s) => s.scatterAssetIds);
  const toggleScatterAsset = useEditorStore((s) => s.toggleScatterAsset);
  const replaceSourceAssetId = useEditorStore((s) => s.replaceSourceAssetId);
  const replaceTargetAssetId = useEditorStore((s) => s.replaceTargetAssetId);
  const randomStampAssetIds = useEditorStore((s) => s.randomStampAssetIds);
  const toggleRandomStampAsset = useEditorStore((s) => s.toggleRandomStampAsset);
  const randomStampShuffleMode = useEditorStore((s) => s.randomStampShuffleMode);
  const setRandomStampShuffleMode = useEditorStore((s) => s.setRandomStampShuffleMode);
  const randomStampRotationMode = useEditorStore((s) => s.randomStampRotationMode);
  const setRandomStampRotationMode = useEditorStore((s) => s.setRandomStampRotationMode);
  const randomStampScaleEnabled = useEditorStore((s) => s.randomStampScaleEnabled);
  const setRandomStampScaleEnabled = useEditorStore((s) => s.setRandomStampScaleEnabled);
  const randomStampScaleRange = useEditorStore((s) => s.randomStampScaleRange);
  const setRandomStampScaleRange = useEditorStore((s) => s.setRandomStampScaleRange);
  const assets = useMapStore((s) => s.assets);
  const elements = useMapStore((s) => s.elements);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);

  const rsFilteredAssets = useMemo(() => {
    const lower = rsSearch.toLowerCase();
    return Object.entries(assets).filter(([, a]) =>
      !lower || a.name.toLowerCase().includes(lower)
    );
  }, [assets, rsSearch]);

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

  // Shared button layout — changes based on expanded state
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
        const isActive = activeTool === t.name;
        const label = toolLabels[t.name] || t.name;
        const key = TOOL_KEYS[t.name];
        // collapsed: show full description + hotkey; expanded: label visible so just show hotkey
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

      {activeTool === 'line-stamp' && (
        <>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />
          <div style={{ fontSize: 9, color: theme.textMuted, textAlign: 'center', padding: '0 4px' }}>
            {expanded ? 'Axis lock (Shift = auto)' : 'Axis'}
          </div>
          <div style={{ display: 'flex', gap: 2, padding: '0 4px', width: '100%', boxSizing: 'border-box' as const }}>
            {(['free', 'h', 'v'] as const).map((lock) => {
              const label = lock === 'free' ? '⤢' : lock === 'h' ? '↔' : '↕';
              const tip = lock === 'free' ? 'Free (any direction)' : lock === 'h' ? 'Horizontal only' : 'Vertical only';
              const isActive = lineStampAxisLock === lock;
              return (
                <button
                  key={lock}
                  onClick={() => setLineStampAxisLock(lock)}
                  title={tip}
                  style={{
                    flex: 1, height: 22, fontSize: 13, border: 'none', cursor: 'pointer',
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
        </>
      )}

      {activeTool === 'scatter' && (
        <>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />
          <div style={{ fontSize: 9, color: theme.textMuted, textAlign: 'center', padding: '0 4px' }}>
            {expanded ? 'Click assets in browser to add' : 'Click assets in browser to add to set'}
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
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />
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
            title="Apply replacement to all matching tiles on layer"
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

      {activeTool === 'random-stamp' && (
        <>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />
          <div style={{ fontSize: 9, color: theme.textMuted, padding: '0 6px', lineHeight: 1.4 }}>
            {expanded
              ? 'Click canvas to place a random asset from your pool. Click assets in browser to add/remove.'
              : 'Click to place random asset'}
          </div>
          <div style={{ fontSize: 9, color: theme.textMuted, padding: '2px 6px' }}>
            <span style={{ color: theme.primary, fontFamily: theme.fontHeading }}>S</span> — activate &nbsp;
            <span style={{ color: theme.primary, fontFamily: theme.fontHeading }}>R</span> — reshuffle
          </div>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />
          {/* Asset pool */}
          <div style={{ fontSize: 9, color: theme.textMuted, padding: '0 6px' }}>Pool:</div>
          {randomStampAssetIds.length === 0 ? (
            <div style={{ fontSize: 9, color: theme.danger, textAlign: 'center', padding: '0 4px' }}>No assets — click browser</div>
          ) : (
            randomStampAssetIds.map(id => {
              const asset = assets[id];
              if (!asset) return null;
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', padding: '0 4px', boxSizing: 'border-box' as const }}>
                  <img src={asset.src} alt={asset.name} style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 2, background: theme.surface, flexShrink: 0 }} />
                  {expanded && <span style={{ fontSize: 9, color: theme.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{asset.name}</span>}
                  <button onClick={() => toggleRandomStampAsset(id)} title={`Remove ${asset.name}`}
                    style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1, flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              );
            })
          )}
          {/* Mini asset browser */}
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />
          <div style={{ fontSize: 9, color: theme.textMuted, padding: '0 6px' }}>Browse assets:</div>
          <div style={{ padding: '0 4px', width: '100%', boxSizing: 'border-box' as const }}>
            <input
              type="text"
              placeholder="Search…"
              value={rsSearch}
              onChange={e => setRsSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box' as const,
                background: theme.surface, border: `1px solid ${theme.borderSubtle}`,
                borderRadius: theme.radius, color: theme.text, fontSize: 9,
                padding: '3px 6px', fontFamily: theme.fontHeading,
              }}
            />
          </div>
          <div style={{
            maxHeight: 160, overflowY: 'auto', width: '100%', padding: '2px 4px',
            boxSizing: 'border-box' as const,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))', gap: 2,
          }}>
            {rsFilteredAssets.map(([id, asset]) => {
              const inPool = randomStampAssetIds.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleRandomStampAsset(id)}
                  title={asset.name}
                  style={{
                    width: '100%', aspectRatio: '1', padding: 0, border: 'none', cursor: 'pointer',
                    borderRadius: 3, background: 'transparent',
                    outline: inPool ? `2px solid ${theme.primary}` : 'none',
                    outlineOffset: 1,
                    position: 'relative',
                  }}
                >
                  <img src={asset.src} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: 2, background: theme.surface }} />
                </button>
              );
            })}
            {rsFilteredAssets.length === 0 && (
              <div style={{ fontSize: 9, color: theme.textMuted, gridColumn: '1/-1', textAlign: 'center', padding: 4 }}>No matches</div>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />
          {/* Shuffle mode */}
          <div style={{ fontSize: 9, color: theme.textMuted, padding: '0 6px' }}>{expanded ? 'Selection mode:' : 'Mode'}</div>
          <div style={{ display: 'flex', gap: 2, padding: '0 4px', width: '100%', boxSizing: 'border-box' as const }}>
            {(['bag', 'pure', 'round-robin'] as const).map(mode => {
              const label = mode === 'bag' ? 'Bag' : mode === 'pure' ? 'Rnd' : 'RR';
              const tip = mode === 'bag' ? 'Shuffle bag: cycle through all before repeating' : mode === 'pure' ? 'Pure random: any asset each time' : 'Round-robin: sequential order';
              return (
                <button key={mode} onClick={() => setRandomStampShuffleMode(mode)} title={tip}
                  style={{
                    flex: 1, height: 22, fontSize: 9, border: 'none', cursor: 'pointer',
                    borderRadius: theme.radius,
                    background: randomStampShuffleMode === mode ? theme.primary : theme.surface,
                    color: randomStampShuffleMode === mode ? theme.bg : theme.textMuted,
                    fontFamily: theme.fontHeading, fontWeight: randomStampShuffleMode === mode ? 'bold' : 'normal',
                    transition: 'background 0.15s',
                  }}
                >{label}</button>
              );
            })}
          </div>
          {/* Rotation mode */}
          <div style={{ fontSize: 9, color: theme.textMuted, padding: '2px 6px 0' }}>{expanded ? 'Rotation:' : 'Rot'}</div>
          <div style={{ display: 'flex', gap: 2, padding: '0 4px', width: '100%', boxSizing: 'border-box' as const }}>
            {(['full', 'cardinal', 'none'] as const).map(mode => {
              const label = mode === 'full' ? '360°' : mode === 'cardinal' ? '90°' : 'Off';
              const tip = mode === 'full' ? 'Full random rotation (0-359°)' : mode === 'cardinal' ? 'Cardinal only (0°/90°/180°/270°)' : 'No rotation';
              return (
                <button key={mode} onClick={() => setRandomStampRotationMode(mode)} title={tip}
                  style={{
                    flex: 1, height: 22, fontSize: 9, border: 'none', cursor: 'pointer',
                    borderRadius: theme.radius,
                    background: randomStampRotationMode === mode ? theme.primary : theme.surface,
                    color: randomStampRotationMode === mode ? theme.bg : theme.textMuted,
                    fontFamily: theme.fontHeading, fontWeight: randomStampRotationMode === mode ? 'bold' : 'normal',
                    transition: 'background 0.15s',
                  }}
                >{label}</button>
              );
            })}
          </div>
          {/* Scale jitter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px 0', width: '100%', boxSizing: 'border-box' as const }}>
            <input type="checkbox" checked={randomStampScaleEnabled} onChange={e => setRandomStampScaleEnabled(e.target.checked)}
              style={{ cursor: 'pointer', flexShrink: 0 }} id="rs-scale-toggle" />
            <label htmlFor="rs-scale-toggle" style={{ fontSize: 9, color: theme.textMuted, cursor: 'pointer' }}>
              {expanded ? 'Scale jitter' : 'Jitter'}
            </label>
          </div>
          {randomStampScaleEnabled && (
            <div style={{ padding: '2px 6px', width: '100%', boxSizing: 'border-box' as const }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="range" min={0} max={50} value={randomStampScaleRange}
                  onChange={e => setRandomStampScaleRange(Number(e.target.value))}
                  style={{ flex: 1, cursor: 'pointer' }} />
                <input type="number" min={0} max={50} value={randomStampScaleRange}
                  onChange={e => setRandomStampScaleRange(Math.max(0, Math.min(50, Number(e.target.value))))}
                  style={{ width: 32, fontSize: 9, background: theme.surface, border: `1px solid ${theme.borderSubtle}`, borderRadius: theme.radius, color: theme.text, textAlign: 'center', padding: '1px 2px' }} />
                <span style={{ fontSize: 9, color: theme.textMuted }}>%</span>
              </div>
            </div>
          )}
        </>
      )}

      {activeTool === 'polygon' && (
        <>
          <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, width: expanded ? '100%' : 24, margin: '4px 0' }} />
          {shapes.map((s) => {
            const isShapeActive = pendingShape === s.name;
            return (
              <button
                key={s.name}
                onClick={() => handleShapeClick(s.name)}
                title={s.label}
                style={{
                  ...rowStyle(),
                  fontSize: 16,
                  background: isShapeActive ? theme.successAlphaLow : 'transparent',
                  color: isShapeActive ? theme.success : theme.textMuted,
                  borderLeft: isShapeActive ? `3px solid ${theme.success}` : '3px solid transparent',
                  boxShadow: isShapeActive ? `0 0 8px ${theme.successAlphaMid}` : 'none',
                  transition: 'all 0.15s',
                }}>
                {iconSpan(s.icon)}
                {labelSpan(s.label)}
              </button>
            );
          })}
        </>
      )}

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
          {/* Axis selector: H / V / Both */}
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
          {/* Snap to center */}
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
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Expand / collapse toggle */}
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
