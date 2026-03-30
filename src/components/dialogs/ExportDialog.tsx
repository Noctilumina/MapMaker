import { useState } from 'react';

interface Props {
  onExport: (options: { dpi: number; includeGrid: boolean; includeGmNotes: boolean }) => void;
  onClose: () => void;
}

export default function ExportDialog({ onExport, onClose }: Props) {
  const [dpi, setDpi] = useState(300);
  const [includeGrid, setIncludeGrid] = useState(true);
  const [includeGmNotes, setIncludeGmNotes] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#1e1e2e', borderRadius: 8, padding: 24, minWidth: 300, border: '1px solid #45475a' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#cdd6f4', marginBottom: 16, fontSize: 16 }}>Export to PNG</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ color: '#a6adc8', fontSize: 13 }}>
            DPI:
            <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} style={{ marginLeft: 8, background: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, padding: '4px 8px' }}>
              <option value={150}>150 (draft)</option>
              <option value={300}>300 (print)</option>
            </select>
          </label>
          <label style={{ color: '#a6adc8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={includeGrid} onChange={(e) => setIncludeGrid(e.target.checked)} />
            Include grid lines
          </label>
          <label style={{ color: '#a6adc8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={includeGmNotes} onChange={(e) => setIncludeGmNotes(e.target.checked)} />
            Include GM Notes layer
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={() => onExport({ dpi, includeGrid, includeGmNotes })} style={{ background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>Export</button>
        </div>
      </div>
    </div>
  );
}
