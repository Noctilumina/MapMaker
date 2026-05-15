import { useState, useEffect } from 'react';
import { theme } from '../../theme';
import { useMapStore } from '../../stores/mapStore';
import type Konva from 'konva';

const PAPER_SIZES: Record<string, { w: number; h: number; label: string }> = {
  a4:      { w: 8.27,  h: 11.69, label: 'A4 (210×297mm)' },
  a3:      { w: 11.69, h: 16.54, label: 'A3 (297×420mm)' },
  letter:  { w: 8.5,   h: 11,    label: 'Letter (8.5×11")' },
  legal:   { w: 8.5,   h: 14,    label: 'Legal (8.5×14")' },
  tabloid: { w: 11,    h: 17,    label: 'Tabloid (11×17")' },
};

interface Props {
  getStage: () => Konva.Stage | null;
  onClose: () => void;
}

function captureStage(stage: Konva.Stage, mapW: number, mapH: number, pixelRatio: number, mimeType = 'image/png') {
  const savedX = stage.x(), savedY = stage.y();
  const savedScaleX = stage.scaleX(), savedScaleY = stage.scaleY();
  stage.position({ x: 0, y: 0 });
  stage.scale({ x: 1, y: 1 });
  const url = stage.toDataURL({ x: 0, y: 0, width: mapW, height: mapH, pixelRatio, mimeType });
  stage.position({ x: savedX, y: savedY });
  stage.scale({ x: savedScaleX, y: savedScaleY });
  return url;
}

export default function PrintDialog({ getStage, onClose }: Props) {
  const grid = useMapStore((s) => s.grid);
  const mapW = grid.width * grid.cellSize;
  const mapH = grid.height * grid.cellSize;

  const [paperKey, setPaperKey] = useState('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [marginIn, setMarginIn] = useState(0.25);
  const [showLabels, setShowLabels] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [dpi, setDpi] = useState(150);
  const [cellsPerPage, setCellsPerPage] = useState(10);

  const paper = PAPER_SIZES[paperKey];
  const pw = orientation === 'portrait' ? paper.w : paper.h;
  const ph = orientation === 'portrait' ? paper.h : paper.w;
  const printableW = pw - marginIn * 2; // inches
  const printableH = ph - marginIn * 2;

  // cellsPerPage = cells across one page width; height derived from aspect ratio
  const cellsPerPageW = cellsPerPage;
  const cellsPerPageH = cellsPerPage * printableH / printableW;
  const cols = Math.ceil(grid.width / cellsPerPageW);
  const rows = Math.ceil(grid.height / cellsPerPageH);

  // Thumbnail for preview
  useEffect(() => {
    const stage = getStage();
    if (!stage) return;
    const pr = Math.min(0.12, 200 / Math.max(mapW, mapH));
    setThumbUrl(captureStage(stage, mapW, mapH, pr, 'image/jpeg'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preview dimensions (fit within 300×220)
  const previewMaxW = 300, previewMaxH = 220;
  const previewScale = Math.min(previewMaxW / mapW, previewMaxH / mapH);
  const previewW = Math.round(mapW * previewScale);
  const previewH = Math.round(mapH * previewScale);
  const pagePreviewW = cellsPerPageW * grid.cellSize * previewScale;
  const pagePreviewH = cellsPerPageH * grid.cellSize * previewScale;

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      const stage = getStage();
      if (!stage) { setPrinting(false); return; }

      const pixelRatio = dpi * printableW / (grid.cellSize * cellsPerPage);
      const mapDataUrl = captureStage(stage, mapW, mapH, pixelRatio);

      const pages: string[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const label = `${String.fromCharCode(65 + r)}${c + 1}`;
          const bgLeft = -(c * printableW);
          const bgTop  = -(r * printableH);
          pages.push(`
<div class="page">
  <div class="crop" style="background-position:${bgLeft}in ${bgTop}in"></div>
  ${showLabels ? `<div class="label">${label}</div>` : ''}
</div>`);
        }
      }

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Map Print</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:${pw}in ${ph}in;margin:0}
body{background:white}
.page{
  width:${pw}in;height:${ph}in;
  position:relative;overflow:hidden;
  page-break-after:always;
}
.crop{
  position:absolute;
  left:${marginIn}in;top:${marginIn}in;
  width:${printableW}in;height:${printableH}in;
  overflow:hidden;
  background-image:url('${mapDataUrl}');
  background-size:${(grid.width * printableW / cellsPerPage).toFixed(4)}in ${(grid.height * printableW / cellsPerPage).toFixed(4)}in;
  background-repeat:no-repeat;
}
.label{
  position:absolute;
  bottom:${marginIn * 0.4}in;right:${marginIn * 0.5}in;
  font-family:sans-serif;font-size:8pt;color:#aaa;
}
</style>
</head>
<body>${pages.join('')}</body>
</html>`;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        // Give images a moment to load before print dialog
        setTimeout(() => win.print(), 600);
      }
      setPrinting(false);
      onClose();
    }, 80);
  };

  const inputStyle: React.CSSProperties = { background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '4px 8px', fontSize: 12 };
  const btnBase: React.CSSProperties = { border: theme.borderMedium, borderRadius: theme.radius, padding: '6px 16px', cursor: 'pointer', fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' };

  if (printing) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: theme.bg, borderRadius: theme.radius, padding: '32px 48px', border: theme.borderHeavy, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🖨️</div>
          <div style={{ color: theme.text, fontSize: 14, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generating {rows * cols} page{rows * cols !== 1 ? 's' : ''}…</div>
          <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 6 }}>This may take a moment for large maps</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: theme.bg, borderRadius: theme.radius, padding: 24, minWidth: 560, border: theme.borderHeavy, boxShadow: theme.shadowLg, display: 'flex', gap: 24 }} onClick={(e) => e.stopPropagation()}>

        {/* Left: controls */}
        <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ color: theme.text, fontSize: 15, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Print Map</h3>

          <label style={{ color: theme.textMuted, fontSize: 12 }}>
            Paper
            <select value={paperKey} onChange={(e) => setPaperKey(e.target.value)} style={{ ...inputStyle, display: 'block', width: '100%', marginTop: 4 }}>
              {Object.entries(PAPER_SIZES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>

          <label style={{ color: theme.textMuted, fontSize: 12 }}>
            Orientation
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {(['portrait', 'landscape'] as const).map(o => (
                <button key={o} onClick={() => setOrientation(o)}
                  style={{ ...btnBase, flex: 1, padding: '4px 0', background: orientation === o ? theme.primary : theme.surface, color: orientation === o ? theme.bg : theme.textMuted, textTransform: 'capitalize', fontSize: 11 }}>
                  {o}
                </button>
              ))}
            </div>
          </label>

          <label style={{ color: theme.textMuted, fontSize: 12 }}>
            Margin (inches)
            <input type="number" min={0} max={1} step={0.05} value={marginIn}
              onChange={(e) => setMarginIn(Number(e.target.value))}
              style={{ ...inputStyle, display: 'block', width: '100%', marginTop: 4 }} />
          </label>

          <label style={{ color: theme.textMuted, fontSize: 12 }}>
            Cells per page (width)
            <input type="number" min={1} max={200} step={1} value={cellsPerPage}
              onChange={(e) => setCellsPerPage(Math.max(1, Math.round(Number(e.target.value))))}
              style={{ ...inputStyle, display: 'block', width: '100%', marginTop: 4 }} />
          </label>

          <label style={{ color: theme.textMuted, fontSize: 12 }}>
            Print DPI
            <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} style={{ ...inputStyle, display: 'block', width: '100%', marginTop: 4 }}>
              <option value={72}>72 (screen)</option>
              <option value={150}>150 (standard)</option>
              <option value={300}>300 (high)</option>
            </select>
          </label>

          <label style={{ color: theme.textMuted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
            Page labels (A1, B2…)
          </label>

          <div style={{ marginTop: 4, padding: '8px 10px', background: theme.surface, borderRadius: theme.radius, fontSize: 11, color: theme.textMuted }}>
            <span style={{ color: theme.text, fontWeight: 'bold' }}>{rows * cols}</span> page{rows * cols !== 1 ? 's' : ''} ({cols} × {rows})<br />
            {cellsPerPage} cells/page · {(printableW / cellsPerPage).toFixed(2)} in/cell · {dpi} DPI
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
            <button className="brutal-btn" onClick={onClose} style={{ ...btnBase, flex: 1, background: theme.surface, color: theme.text }}>Cancel</button>
            <button className="brutal-btn" onClick={handlePrint} style={{ ...btnBase, flex: 1, background: theme.primary, color: theme.bg, fontWeight: 'bold' }}>Print</button>
          </div>
        </div>

        {/* Right: preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ color: theme.textMuted, fontSize: 11, alignSelf: 'flex-start' }}>Preview</div>
          <div style={{ position: 'relative', width: previewW, height: previewH, border: `1px solid ${theme.borderLight}`, flexShrink: 0, background: theme.surface }}>
            {thumbUrl && (
              <img src={thumbUrl} alt="map thumbnail"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
            )}
            {/* Page grid overlay */}
            <svg style={{ position: 'absolute', inset: 0 }} width={previewW} height={previewH}>
              {Array.from({ length: cols }, (_, c) =>
                Array.from({ length: rows }, (_, r) => {
                  const x = c * pagePreviewW;
                  const y = r * pagePreviewH;
                  const w = Math.min(pagePreviewW, previewW - x);
                  const h = Math.min(pagePreviewH, previewH - y);
                  const label = `${String.fromCharCode(65 + r)}${c + 1}`;
                  return (
                    <g key={`${c}-${r}`}>
                      <rect x={x} y={y} width={w} height={h}
                        fill="none" stroke="rgba(137,180,250,0.7)" strokeWidth={1} strokeDasharray="3 2" />
                      {showLabels && (
                        <text x={x + w - 4} y={y + h - 4} textAnchor="end"
                          fontSize={Math.max(7, Math.min(11, pagePreviewW * 0.12))}
                          fill="rgba(137,180,250,0.9)" fontFamily="monospace">
                          {label}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>
          <div style={{ color: theme.textMuted, fontSize: 10 }}>
            Map: {grid.width}×{grid.height} cells · Paper: {pw.toFixed(2)}×{ph.toFixed(2)}"
          </div>
          {/* Page layout grid */}
          {(() => {
            const maxGridW = 220;
            const cellW = Math.min(40, Math.floor(maxGridW / cols));
            const cellH = Math.round(cellW * ph / pw);
            const gridW = cols * cellW;
            const gridH = rows * cellH;
            const fontSize = Math.max(6, Math.min(10, cellW * 0.28));
            return (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{ color: theme.textMuted, fontSize: 10, marginBottom: 4 }}>
                  Page layout — {cols}×{rows} ({rows * cols} page{rows * cols !== 1 ? 's' : ''})
                </div>
                <svg width={gridW} height={gridH} style={{ display: 'block' }}>
                  {Array.from({ length: cols }, (_, c) =>
                    Array.from({ length: rows }, (_, r) => {
                      const x = c * cellW;
                      const y = r * cellH;
                      const label = `${String.fromCharCode(65 + r)}${c + 1}`;
                      return (
                        <g key={`${c}-${r}`}>
                          <rect x={x + 1} y={y + 1} width={cellW - 2} height={cellH - 2}
                            fill={theme.surface} stroke={theme.primary} strokeWidth={1} rx={1} />
                          <text x={x + cellW / 2} y={y + cellH / 2 + fontSize * 0.35}
                            textAnchor="middle" fontSize={fontSize}
                            fill={theme.textMuted} fontFamily="monospace">
                            {label}
                          </text>
                        </g>
                      );
                    })
                  )}
                </svg>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
