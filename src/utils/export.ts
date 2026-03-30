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
  const { dpi, gridWidthCells, gridHeightCells, cellSizePx, includeGrid, includeGmNotes, backgroundColor } = options;

  const pixelsPerCell = dpi;
  const scale = pixelsPerCell / cellSizePx;

  const gmLayer = stage.findOne('.gm-notes') as Konva.Layer | undefined;
  const gmWasVisible = gmLayer?.visible();
  if (gmLayer && !includeGmNotes) gmLayer.visible(false);

  const gridLayer = stage.findOne('.grid-layer') as Konva.Layer | undefined;
  const gridWasVisible = gridLayer?.visible();
  if (gridLayer && !includeGrid) gridLayer.visible(false);

  const dataUrl = stage.toDataURL({
    x: 0,
    y: 0,
    width: gridWidthCells * cellSizePx,
    height: gridHeightCells * cellSizePx,
    pixelRatio: scale,
    mimeType: 'image/png',
  });

  if (gmLayer && gmWasVisible !== undefined) gmLayer.visible(gmWasVisible);
  if (gridLayer && gridWasVisible !== undefined) gridLayer.visible(gridWasVisible);

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `map-${Date.now()}.png`;
  a.click();
}
