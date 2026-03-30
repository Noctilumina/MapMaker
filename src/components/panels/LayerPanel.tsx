import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';

export default function LayerPanel() {
  const layers = useMapStore((s) => s.layers);
  const updateLayer = useMapStore((s) => s.updateLayer);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
  const layerColors: Record<string, string> = { floor: '#89b4fa', walls: '#f9e2af', objects: '#a6e3a1', 'gm-notes': '#6c7086' };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ color: '#f9e2af', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Layers</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[...layers].reverse().map((layer) => (
          <div key={layer.id} onClick={() => setActiveLayer(layer.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: activeLayerId === layer.id ? '#45475a' : '#313244', borderRadius: 4, borderLeft: `3px solid ${layerColors[layer.id] || '#6c7086'}`, cursor: 'pointer' }}>
            <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: layer.visible ? 1 : 0.3 }} title={layer.visible ? 'Hide layer' : 'Show layer'}>&#x1F441;</button>
            <span style={{ flex: 1, fontSize: 12, color: activeLayerId === layer.id ? '#cdd6f4' : '#a6adc8', fontWeight: activeLayerId === layer.id ? 'bold' : 'normal' }}>{layer.name}</span>
            {activeLayerId === layer.id && <span style={{ color: '#89b4fa', fontSize: 10 }}>active</span>}
            <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, opacity: layer.locked ? 1 : 0.3 }} title={layer.locked ? 'Unlock layer' : 'Lock layer'}>&#x1F512;</button>
          </div>
        ))}
      </div>
    </div>
  );
}
