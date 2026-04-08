import { useState } from 'react';
import { theme } from '../../theme';

interface Props {
  file: File;
  previewSrc: string;
  onImport: (options: { name: string; category: string; gridSize: [number, number] }) => void;
  onClose: () => void;
}

const labelStyle: React.CSSProperties = { color: theme.textMuted, fontSize: 13, fontFamily: theme.fontBody };
const inputStyle: React.CSSProperties = { display: 'block', marginTop: 4, width: '100%', background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '6px 8px' };
const btnBase: React.CSSProperties = { border: theme.borderMedium, borderRadius: theme.radius, padding: '6px 16px', cursor: 'pointer', fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: theme.shadowSm };

export default function ImportDialog({ file, previewSrc, onImport, onClose }: Props) {
  const [name, setName] = useState(file.name.replace(/\.[^.]+$/, ''));
  const [category, setCategory] = useState('imported');
  const [gridW, setGridW] = useState(1);
  const [gridH, setGridH] = useState(1);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: theme.bg, borderRadius: theme.radius, padding: 24, minWidth: 300, border: theme.borderHeavy, boxShadow: theme.shadowLg }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: theme.text, marginBottom: 16, fontSize: 16, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Import Asset</h3>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <img src={previewSrc} alt="Preview" style={{ maxWidth: 128, maxHeight: 128, borderRadius: theme.radius, border: theme.borderMedium }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={labelStyle}>
            Name:
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Category:
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ ...inputStyle, display: 'inline', marginLeft: 8, width: 'auto', padding: '4px 8px' }}>
              <option value="imported">Imported</option>
              <option value="floors">Floors</option>
              <option value="walls">Walls</option>
              <option value="furniture">Furniture</option>
              <option value="props">Props</option>
              <option value="doors">Doors</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              Grid W:
              <input type="number" value={gridW} onChange={(e) => setGridW(Number(e.target.value))} min={1} max={10} style={inputStyle} />
            </label>
            <label style={{ ...labelStyle, flex: 1 }}>
              Grid H:
              <input type="number" value={gridH} onChange={(e) => setGridH(Number(e.target.value))} min={1} max={10} style={inputStyle} />
            </label>
          </div>
          {file.size > 5 * 1024 * 1024 && (
            <div style={{ color: theme.danger, fontSize: 11 }}>Warning: Large file ({(file.size / 1024 / 1024).toFixed(1)}MB)</div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="brutal-btn" onClick={onClose} style={{ ...btnBase, background: theme.surface, color: theme.text }}>Cancel</button>
          <button className="brutal-btn" onClick={() => onImport({ name, category, gridSize: [gridW, gridH] })}
            style={{ ...btnBase, background: theme.primary, color: theme.bg, fontWeight: 'bold' }}>Add</button>
        </div>
      </div>
    </div>
  );
}
