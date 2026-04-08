import { useState } from 'react';
import { theme } from '../../theme';

interface Props {
  onConfirm: (options: { name: string; width: number; height: number; scale: string }) => void;
  onClose: () => void;
}

const labelStyle: React.CSSProperties = { color: theme.textMuted, fontSize: 13, fontFamily: theme.fontBody };
const inputStyle: React.CSSProperties = { display: 'block', marginTop: 4, width: '100%', background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '6px 8px' };
const btnBase: React.CSSProperties = { border: theme.borderMedium, borderRadius: theme.radius, padding: '6px 16px', cursor: 'pointer', fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: theme.shadowSm };

export default function NewProjectDialog({ onConfirm, onClose }: Props) {
  const [name, setName] = useState('Untitled Map');
  const [width, setWidth] = useState(30);
  const [height, setHeight] = useState(20);
  const [scale, setScale] = useState('2m');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: theme.bg, borderRadius: theme.radius, padding: 24, minWidth: 300, border: theme.borderHeavy, boxShadow: theme.shadowLg }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: theme.text, marginBottom: 16, fontSize: 16, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Map</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={labelStyle}>
            Name:
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              Width (cells):
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={5} max={100} style={inputStyle} />
            </label>
            <label style={{ ...labelStyle, flex: 1 }}>
              Height (cells):
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={5} max={100} style={inputStyle} />
            </label>
          </div>
          <label style={labelStyle}>
            Grid scale:
            <select value={scale} onChange={(e) => setScale(e.target.value)} style={{ ...inputStyle, display: 'inline', marginLeft: 8, width: 'auto', padding: '4px 8px' }}>
              <option value="2m">2m (Cyberpunk Red)</option>
              <option value="5ft">5ft (D&amp;D / Pathfinder)</option>
              <option value="1m">1m</option>
              <option value="1.5m">1.5m</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="brutal-btn" onClick={onClose} style={{ ...btnBase, background: theme.surface, color: theme.text }}>Cancel</button>
          <button className="brutal-btn" onClick={() => onConfirm({ name, width, height, scale })} style={{ ...btnBase, background: theme.primary, color: theme.bg, fontWeight: 'bold' }}>Create</button>
        </div>
      </div>
    </div>
  );
}
