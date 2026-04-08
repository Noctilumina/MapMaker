import Konva from 'konva';

interface ExportOptions {
  dpi: number;
  gridWidthCells: number;
  gridHeightCells: number;
  cellSizePx: number;
  includeGrid: boolean;
  includeGmNotes: boolean;
  backgroundColor: string;
}

export function exportToPng(stage: Konva.Stage, options: ExportOptions): void {
  const { dpi, gridWidthCells, gridHeightCells, cellSizePx, includeGrid, includeGmNotes } = options;

  const pixelsPerCell = dpi;
  const scale = pixelsPerCell / cellSizePx;

  const gmLayer = stage.findOne('.gm-notes') as Konva.Layer | undefined;
  const gmWasVisible = gmLayer?.visible();
  if (gmLayer && !includeGmNotes) gmLayer.visible(false);

  const gridLayer = stage.findOne('.grid-layer') as Konva.Layer | undefined;
  const gridWasVisible = gridLayer?.visible();
  if (gridLayer && !includeGrid) gridLayer.visible(false);

  const width = gridWidthCells * cellSizePx;
  const height = gridHeightCells * cellSizePx;

  try {
    // Get the canvas from the stage and render to a new canvas at the desired scale
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Scale the context
    ctx.scale(scale, scale);

    // Draw the stage content
    const stageCanvas = stage.toCanvas({ pixelRatio: 1 }) as HTMLCanvasElement;
    ctx.drawImage(stageCanvas, 0, 0, width, height, 0, 0, width, height);

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Failed to create blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `map-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } finally {
    // Restore visibility
    if (gmLayer && gmWasVisible !== undefined) gmLayer.visible(gmWasVisible);
    if (gridLayer && gridWasVisible !== undefined) gridLayer.visible(gridWasVisible);
  }
}
