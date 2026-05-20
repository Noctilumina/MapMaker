import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { useHistoryStore } from '../../stores/historyStore';
import { getRandomStampTool } from '../../hooks/useCanvasInteraction';
import type { PendingShape, ToolName } from '../../stores/editorStore';

const STAMP_SUBTYPES: { name: ToolName; label: string; key: string }[] = [
  { name: 'stamp',        label: 'Basic',    key: 'B' },
  { name: 'rect-stamp',   label: 'Rect',     key: 'F' },
  { name: 'line-stamp',   label: 'Line',     key: 'N' },
  { name: 'scatter',      label: 'Scatter',  key: 'X' },
  { name: 'random-stamp', label: 'Random',   key: 'S' },
  { name: 'replace',      label: 'Replace',  key: '-' },
  { name: 'copy-stamp',   label: 'Template', key: 'T' },
];
const STAMP_TOOL_NAMES: ToolName[] = STAMP_SUBTYPES.map(s => s.name);

const Sep = () => (
  <div style={{ width: 1, height: 18, background: 'var(--color-border-subtle)', margin: '0 8px', flexShrink: 0 }} />
);

const Lbl = ({ text }: { text: string }) => (
  <span style={{
    fontSize: 9, fontFamily: "'Space Mono', monospace",
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    color: 'var(--color-muted)', whiteSpace: 'nowrap' as const, flexShrink: 0,
  }}>{text}</span>
);

const MBtn = ({ active, onClick, children, title }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) => (
  <button onClick={onClick} title={title} style={{
    height: 22, padding: '0 8px', fontSize: 9,
    fontFamily: "'Space Mono', monospace", textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    border: 'none', borderRadius: 2, cursor: 'pointer', flexShrink: 0,
    background: active ? 'var(--color-primary-alpha-low)' : 'var(--color-surface-hover)',
    color: active ? 'var(--color-primary)' : 'var(--color-muted)',
    borderLeft: active ? '2px solid var(--color-primary)' : '2px solid transparent',
    whiteSpace: 'nowrap' as const,
  }}>{children}</button>
);

const TOOL_LABELS: Record<string, string> = {
  select: 'Select', pan: 'Pan', stamp: 'Stamp', eraser: 'Eraser',
  fill: 'Fill', 'copy-stamp': 'Stamp', light: 'Light', measure: 'Measure',
  path: 'Path', 'rect-stamp': 'Stamp', 'line-stamp': 'Stamp',
  scatter: 'Stamp', replace: 'Stamp', polygon: 'Polygon', 'random-stamp': 'Stamp',
};

const SHAPES: { name: PendingShape; icon: string; label: string }[] = [
  { name: 'circle',  icon: '○', label: 'Circle' },
  { name: 'rect',    icon: '□', label: 'Rectangle' },
  { name: 'hexagon', icon: '⬡', label: 'Hexagon' },
];

export default function ToolOptionsBar() {
  const activeTool        = useEditorStore(s => s.activeTool);
  const stampRotation     = useEditorStore(s => s.stampRotation);
  const setStampRotation  = useEditorStore(s => s.setStampRotation);
  const pendingShape      = useEditorStore(s => s.pendingShape);
  const setPendingShape   = useEditorStore(s => s.setPendingShape);
  const setTool           = useEditorStore(s => s.setTool);
  const lineStampAxisLock    = useEditorStore(s => s.lineStampAxisLock);
  const setLineStampAxisLock = useEditorStore(s => s.setLineStampAxisLock);
  const scatterAssetIds   = useEditorStore(s => s.scatterAssetIds);
  const toggleScatterAsset = useEditorStore(s => s.toggleScatterAsset);
  const replaceSourceAssetId = useEditorStore(s => s.replaceSourceAssetId);
  const replaceTargetAssetId = useEditorStore(s => s.replaceTargetAssetId);
  const randomStampAssetIds      = useEditorStore(s => s.randomStampAssetIds);
  const toggleRandomStampAsset   = useEditorStore(s => s.toggleRandomStampAsset);
  const randomStampShuffleMode   = useEditorStore(s => s.randomStampShuffleMode);
  const setRandomStampShuffleMode = useEditorStore(s => s.setRandomStampShuffleMode);
  const randomStampRotationMode  = useEditorStore(s => s.randomStampRotationMode);
  const setRandomStampRotationMode = useEditorStore(s => s.setRandomStampRotationMode);
  const randomStampScaleEnabled  = useEditorStore(s => s.randomStampScaleEnabled);
  const setRandomStampScaleEnabled = useEditorStore(s => s.setRandomStampScaleEnabled);
  const randomStampScaleRange    = useEditorStore(s => s.randomStampScaleRange);
  const setRandomStampScaleRange  = useEditorStore(s => s.setRandomStampScaleRange);
  const assets       = useMapStore(s => s.assets);
  const elements     = useMapStore(s => s.elements);
  const activeLayerId = useEditorStore(s => s.activeLayerId);

  return (
    <div style={{
      height: 36,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border-subtle)',
      display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 6,
      flexShrink: 0, overflowX: 'auto', overflowY: 'hidden',
    }}>
      {/* Active tool name */}
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10,
        textTransform: 'uppercase' as const, letterSpacing: '0.08em',
        color: 'var(--color-primary)', whiteSpace: 'nowrap' as const, flexShrink: 0,
      }}>
        {TOOL_LABELS[activeTool] ?? activeTool}
      </span>

      {/* ── Stamp sub-type picker (shown for all stamp variants) ── */}
      {STAMP_TOOL_NAMES.includes(activeTool) && <>
        <Sep />
        <Lbl text="Type" />
        {STAMP_SUBTYPES.map(s => (
          <MBtn key={s.name} active={activeTool === s.name}
            onClick={() => { useHistoryStore.getState().captureSnapshot(); setTool(s.name); if (s.name !== 'polygon') setPendingShape(null); }}
            title={`${s.label} stamp (${s.key})`}>
            {s.label}
          </MBtn>
        ))}
      </>}

      {/* ── Stamp ── */}
      {activeTool === 'stamp' && <>
        <Sep />
        <Lbl text="Rotation" />
        {([0, 90, 180, 270] as const).map(r => (
          <MBtn key={r} active={stampRotation === r} onClick={() => setStampRotation(r)} title={`Rotate ${r}°`}>
            {r}°
          </MBtn>
        ))}
        <Lbl text="R = rotate" />
      </>}

      {/* ── Line Stamp ── */}
      {activeTool === 'line-stamp' && <>
        <Sep />
        <Lbl text="Axis" />
        <MBtn active={lineStampAxisLock === 'free'} onClick={() => setLineStampAxisLock('free')} title="Free (any direction)">⤢ Free</MBtn>
        <MBtn active={lineStampAxisLock === 'h'}    onClick={() => setLineStampAxisLock('h')}    title="Horizontal only">↔ H</MBtn>
        <MBtn active={lineStampAxisLock === 'v'}    onClick={() => setLineStampAxisLock('v')}    title="Vertical only">↕ V</MBtn>
        <Lbl text="Shift = auto" />
      </>}

      {/* ── Scatter ── */}
      {activeTool === 'scatter' && <>
        <Sep />
        <Lbl text="Pool" />
        {scatterAssetIds.length === 0
          ? <span style={{ fontSize: 9, color: 'var(--color-danger)' }}>Empty — click assets in browser to add</span>
          : scatterAssetIds.map(id => {
              const asset = assets[id];
              if (!asset) return null;
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  <img src={asset.src} alt={asset.name} title={asset.name}
                    style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 2, background: 'var(--color-surface-hover)' }} />
                  <button onClick={() => toggleScatterAsset(id)} title={`Remove ${asset.name}`}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              );
            })}
      </>}

      {/* ── Replace ── */}
      {activeTool === 'replace' && <>
        <Sep />
        <Lbl text="Source" />
        {replaceSourceAssetId && assets[replaceSourceAssetId]
          ? <img src={assets[replaceSourceAssetId].src} alt="source" title={assets[replaceSourceAssetId].name}
              style={{ width: 22, height: 22, objectFit: 'contain', background: 'var(--color-surface-hover)', borderRadius: 2, border: '1px solid var(--color-warning)', flexShrink: 0 }} />
          : <span style={{ fontSize: 9, color: 'var(--color-muted)' }}>none — click tile on canvas</span>}
        <Sep />
        <Lbl text="Target" />
        {replaceTargetAssetId && assets[replaceTargetAssetId]
          ? <img src={assets[replaceTargetAssetId].src} alt="target" title={assets[replaceTargetAssetId].name}
              style={{ width: 22, height: 22, objectFit: 'contain', background: 'var(--color-surface-hover)', borderRadius: 2, border: '1px solid var(--color-success)', flexShrink: 0 }} />
          : <span style={{ fontSize: 9, color: 'var(--color-muted)' }}>none — click asset in browser</span>}
        {replaceSourceAssetId && replaceTargetAssetId && <>
          <Sep />
          <button
            onClick={() => {
              useHistoryStore.getState().captureSnapshot();
              useMapStore.getState().replaceAsset(activeLayerId, replaceSourceAssetId!, replaceTargetAssetId!);
            }}
            style={{
              height: 22, padding: '0 10px', fontSize: 9,
              fontFamily: "'Space Mono', monospace", textTransform: 'uppercase' as const, letterSpacing: '0.06em',
              background: 'var(--color-success)', color: 'var(--color-bg)',
              border: 'none', borderRadius: 2, cursor: 'pointer', flexShrink: 0,
            }}>
            Apply
          </button>
          <span style={{ fontSize: 9, color: 'var(--color-muted)', whiteSpace: 'nowrap' as const }}>
            {elements.filter(el => el.type === 'tile' && 'assetId' in el && el.assetId === replaceSourceAssetId && el.layerId === activeLayerId).length} tile(s)
          </span>
        </>}
      </>}

      {/* ── Polygon ── */}
      {activeTool === 'polygon' && <>
        <Sep />
        <Lbl text="Shape" />
        {SHAPES.map(s => (
          <MBtn key={s.name} active={pendingShape === s.name}
            onClick={() => { useHistoryStore.getState().captureSnapshot(); setTool('polygon'); setPendingShape(s.name); }}
            title={s.label}>
            {s.icon} {s.label}
          </MBtn>
        ))}
      </>}

      {/* ── Random Stamp ── */}
      {activeTool === 'random-stamp' && <>
        <Sep />
        <Lbl text="Pool" />
        {randomStampAssetIds.length === 0
          ? <span style={{ fontSize: 9, color: 'var(--color-danger)', whiteSpace: 'nowrap' as const }}>Empty — click browser or alt+click tiles</span>
          : randomStampAssetIds.map(id => {
              const asset = assets[id];
              if (!asset) return null;
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  <img src={asset.src} alt={asset.name} title={asset.name}
                    style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 2, background: 'var(--color-surface-hover)' }} />
                  <button onClick={() => toggleRandomStampAsset(id)} title={`Remove ${asset.name}`}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              );
            })}
        <Sep />
        <Lbl text="Mode" />
        <MBtn active={randomStampShuffleMode === 'bag'}          onClick={() => setRandomStampShuffleMode('bag')}          title="Shuffle bag: cycle all before repeating">Bag</MBtn>
        <MBtn active={randomStampShuffleMode === 'pure'}         onClick={() => setRandomStampShuffleMode('pure')}         title="Pure random: any asset each time">Random</MBtn>
        <MBtn active={randomStampShuffleMode === 'round-robin'}  onClick={() => setRandomStampShuffleMode('round-robin')}  title="Round-robin: sequential order">RR</MBtn>
        <Sep />
        <Lbl text="Rotation" />
        <MBtn active={randomStampRotationMode === 'full'}     onClick={() => setRandomStampRotationMode('full')}     title="Full random rotation (0–359°)">360°</MBtn>
        <MBtn active={randomStampRotationMode === 'cardinal'} onClick={() => setRandomStampRotationMode('cardinal')} title="Cardinal only (0/90/180/270°)">90°</MBtn>
        <MBtn active={randomStampRotationMode === 'none'}     onClick={() => setRandomStampRotationMode('none')}     title="No rotation">Off</MBtn>
        <Sep />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <input type="checkbox" id="rs-jitter-bar" checked={randomStampScaleEnabled}
            onChange={e => setRandomStampScaleEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
          <label htmlFor="rs-jitter-bar" style={{
            fontSize: 9, fontFamily: "'Space Mono', monospace",
            textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            color: 'var(--color-muted)', cursor: 'pointer', whiteSpace: 'nowrap' as const,
          }}>Jitter</label>
        </div>
        {randomStampScaleEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <input type="range" min={0} max={50} value={randomStampScaleRange}
              onChange={e => setRandomStampScaleRange(Number(e.target.value))}
              style={{ width: 70, cursor: 'pointer' }} />
            <span style={{ fontSize: 9, color: 'var(--color-muted)', whiteSpace: 'nowrap' as const }}>{randomStampScaleRange}%</span>
          </div>
        )}
        <Sep />
        <button onClick={() => getRandomStampTool().reshuffle()}
          style={{
            height: 22, padding: '0 8px', fontSize: 9,
            fontFamily: "'Space Mono', monospace", textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            background: 'var(--color-surface-hover)', color: 'var(--color-primary)',
            border: '1px solid var(--color-primary)', borderRadius: 2, cursor: 'pointer', flexShrink: 0,
          }}>
          R Reshuffle
        </button>
      </>}
    </div>
  );
}
