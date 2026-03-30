import { useState } from 'react';

interface Props {
  file: File;
  previewSrc: string;
  onImport: (options: { name: string; category: string; gridSize: [number, number] }) => void;
  onClose: () => void;
}

export default function ImportDialog({ file, previewSrc, onImport, onClose }: Props) {
  const [name, setName] = useState(file.name.replace(/\.[^.]+$/, ''));
  const [category, setCategory] = useState('imported');
  const [gridW, setGridW] = useState(1);
  const [gridH, setGridH] = useState(1);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#1e1e2e', borderRadius: 8, padding: 24, minWidth: 300, border: '1px solid #45475a' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#cdd6f4', marginBottom: 16, fontSize: 16 }}>Import Asset</h3>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <img src={previewSrc} alt="Preview" style={{ maxWidth: 128, maxHeight: 128, borderRadius: 4, border: '1px solid #45475a' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ color: '#a6adc8', fontSize: 13 }}>
            Name:
            <input value={name} onChange={(e) => setName(e.target.value)}
              style={{ display: 'block', marginTop: 4, width: '100%', background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '6px 8px' }} />
          </label>
          <label style={{ color: '#a6adc8', fontSize: 13 }}>
            Category:
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ marginLeft: 8, background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '4px 8px' }}>
              <option value="imported">Imported</option>
              <option value="floors">Floors</option>
              <option value="walls">Walls</option>
              <option value="furniture">Furniture</option>
              <option value="props">Props</option>
              <option value="doors">Doors</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ color: '#a6adc8', fontSize: 13, flex: 1 }}>
              Grid W:
              <input type="number" value={gridW} onChange={(e) => setGridW(Number(e.target.value))} min={1} max={10}
                style={{ display: 'block', marginTop: 4, width: '100%', background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '6px 8px' }} />
            </label>
            <label style={{ color: '#a6adc8', fontSize: 13, flex: 1 }}>
              Grid H:
              <input type="number" value={gridH} onChange={(e) => setGridH(Number(e.target.value))} min={1} max={10}
                style={{ display: 'block', marginTop: 4, width: '100%', background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '6px 8px' }} />
            </label>
          </div>
          {file.size > 5 * 1024 * 1024 && (
            <div style={{ color: '#f38ba8', fontSize: 11 }}>Warning: Large file ({(file.size / 1024 / 1024).toFixed(1)}MB)</div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={() => onImport({ name, category, gridSize: [gridW, gridH] })}
            style={{ background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>Add</button>
        </div>
      </div>
    </div>
  );
}
