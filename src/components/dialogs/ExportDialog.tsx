import { useState } from 'react';
import { theme } from '../../theme';

interface Props {
  onExport: (options: { dpi: number; includeGrid: boolean; includeGmNotes: boolean }) => void;
  onClose: () => void;
}

const labelStyle: React.CSSProperties = { color: theme.textMuted, fontSize: 13, fontFamily: theme.fontBody };
const inputStyle: React.CSSProperties = { background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '4px 8px' };
const btnBase: React.CSSProperties = { border: theme.borderMedium, borderRadius: theme.radius, padding: '6px 16px', cursor: 'pointer', fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: theme.shadowSm };

export default function ExportDialog({ onExport, onClose }: Props) {
  const [dpi, setDpi] = useState(300);
  const [includeGrid, setIncludeGrid] = useState(true);
  const [includeGmNotes, setIncludeGmNotes] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: theme.bg, borderRadius: theme.radius, padding: 24, minWidth: 300, border: theme.borderHeavy, boxShadow: theme.shadowLg }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: theme.text, marginBottom: 16, fontSize: 16, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Export to PNG</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={labelStyle}>
            DPI:
            <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} style={{ ...inputStyle, marginLeft: 8 }}>
              <option value={150}>150 (draft)</option>
              <option value={300}>300 (print)</option>
            </select>
          </label>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={includeGrid} onChange={(e) => setIncludeGrid(e.target.checked)} />
            Include grid lines
          </label>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={includeGmNotes} onChange={(e) => setIncludeGmNotes(e.target.checked)} />
            Include GM Notes layer
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="brutal-btn" onClick={onClose} style={{ ...btnBase, background: theme.surface, color: theme.text }}>Cancel</button>
          <button className="brutal-btn" onClick={() => onExport({ dpi, includeGrid, includeGmNotes })} style={{ ...btnBase, background: theme.primary, color: theme.bg, fontWeight: 'bold' }}>Export</button>
        </div>
      </div>
    </div>
  );
}
