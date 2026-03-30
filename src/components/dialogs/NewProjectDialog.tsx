import { useState } from 'react';

interface Props {
  onConfirm: (options: { name: string; width: number; height: number; scale: string }) => void;
  onClose: () => void;
}

export default function NewProjectDialog({ onConfirm, onClose }: Props) {
  const [name, setName] = useState('Untitled Map');
  const [width, setWidth] = useState(30);
  const [height, setHeight] = useState(20);
  const [scale, setScale] = useState('2m');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#1e1e2e', borderRadius: 8, padding: 24, minWidth: 300, border: '1px solid #45475a' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#cdd6f4', marginBottom: 16, fontSize: 16 }}>New Map</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ color: '#a6adc8', fontSize: 13 }}>
            Name:
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ display: 'block', marginTop: 4, width: '100%', background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '6px 8px' }} />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ color: '#a6adc8', fontSize: 13, flex: 1 }}>
              Width (cells):
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={5} max={100} style={{ display: 'block', marginTop: 4, width: '100%', background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '6px 8px' }} />
            </label>
            <label style={{ color: '#a6adc8', fontSize: 13, flex: 1 }}>
              Height (cells):
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={5} max={100} style={{ display: 'block', marginTop: 4, width: '100%', background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '6px 8px' }} />
            </label>
          </div>
          <label style={{ color: '#a6adc8', fontSize: 13 }}>
            Grid scale:
            <select value={scale} onChange={(e) => setScale(e.target.value)} style={{ marginLeft: 8, background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '4px 8px' }}>
              <option value="2m">2m (Cyberpunk Red)</option>
              <option value="5ft">5ft (D&amp;D / Pathfinder)</option>
              <option value="1m">1m</option>
              <option value="1.5m">1.5m</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={() => onConfirm({ name, width, height, scale })} style={{ background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>Create</button>
        </div>
      </div>
    </div>
  );
}
