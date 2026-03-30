import { useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';

const layerColors: Record<string, string> = {
  floor: '#89b4fa', walls: '#f9e2af', objects: '#a6e3a1', 'gm-notes': '#6c7086',
};

export default function LayerBar() {
  const layers = useMapStore((s) => s.layers);
  const updateLayer = useMapStore((s) => s.updateLayer);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
  const [popoverId, setPopoverId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', gap: 2, padding: '4px 8px', borderBottom: '1px solid #313244', background: '#1e1e2e', flexWrap: 'wrap' }}>
      {layers.map((layer) => (
        <div key={layer.id} style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px',
            background: activeLayerId === layer.id ? '#45475a' : 'transparent',
            borderRadius: 3, cursor: 'pointer', fontSize: 11,
            borderBottom: `2px solid ${layerColors[layer.id] || '#6c7086'}`,
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); useHistoryStore.getState().captureSnapshot(); updateLayer(layer.id, { visible: !layer.visible }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, opacity: layer.visible ? 1 : 0.3, padding: 0 }}
            >👁</button>
            <span
              onClick={() => { useHistoryStore.getState().captureSnapshot(); setActiveLayer(layer.id); }}
              onContextMenu={(e) => { e.preventDefault(); setPopoverId(popoverId === layer.id ? null : layer.id); }}
              style={{ color: activeLayerId === layer.id ? '#cdd6f4' : '#a6adc8' }}
            >{layer.name}</span>
          </div>
          {popoverId === layer.id && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 100,
              background: '#1e1e2e', border: '1px solid #45475a', borderRadius: 4,
              padding: 8, minWidth: 120, marginTop: 2,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a6adc8', fontSize: 11, marginBottom: 6 }}>
                <input type="checkbox" checked={layer.locked} onChange={() => { useHistoryStore.getState().captureSnapshot(); updateLayer(layer.id, { locked: !layer.locked }); }} />
                Locked
              </label>
              <label style={{ color: '#a6adc8', fontSize: 11 }}>
                Opacity
                <input type="range" min={0} max={100} value={Math.round(layer.opacity * 100)}
                  onChange={(e) => { useHistoryStore.getState().captureSnapshot(); updateLayer(layer.id, { opacity: Number(e.target.value) / 100 }); }}
                  style={{ width: '100%', marginTop: 4 }} />
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
