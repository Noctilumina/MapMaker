import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';
import { theme } from '../../theme';
import { LAYER_COLORS } from '../../utils/layerColors';

export default function LayerPanel() {
  const layers = useMapStore((s) => s.layers);
  const updateLayer = useMapStore((s) => s.updateLayer);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);

  return (
    <div style={{ padding: 12 }}>
      <div className="panel-header panel-header--info" style={{ color: theme.info, marginBottom: 0 }}>Layers</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[...layers].reverse().map((layer) => (
          <div key={layer.id} onClick={() => setActiveLayer(layer.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: activeLayerId === layer.id ? theme.borderSubtle : theme.surface, borderRadius: theme.radius, borderLeft: `3px solid ${LAYER_COLORS[layer.id] || theme.textMuted}`, cursor: 'pointer' }}>
            <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: layer.visible ? 1 : 0.3 }} title={layer.visible ? 'Hide layer' : 'Show layer'}>&#x1F441;</button>
            <span style={{ flex: 1, fontSize: 12, color: activeLayerId === layer.id ? theme.text : theme.textMuted, fontWeight: activeLayerId === layer.id ? 'bold' : 'normal' }}>{layer.name}</span>
            {activeLayerId === layer.id && <span style={{ color: theme.info, fontSize: 10, fontFamily: theme.fontHeading, textTransform: 'uppercase' }}>active</span>}
            <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, opacity: layer.locked ? 1 : 0.3 }} title={layer.locked ? 'Unlock layer' : 'Lock layer'}>&#x1F512;</button>
          </div>
        ))}
      </div>
    </div>
  );
}
