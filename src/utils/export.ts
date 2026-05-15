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

  const scale = dpi / cellSizePx;
  const mapWidth = gridWidthCells * cellSizePx;
  const mapHeight = gridHeightCells * cellSizePx;

  const gmLayer = stage.findOne('.gm-notes') as Konva.Layer | undefined;
  const gmWasVisible = gmLayer?.visible();
  if (gmLayer && !includeGmNotes) gmLayer.visible(false);

  const gridLayer = stage.findOne('.grid-layer') as Konva.Layer | undefined;
  const gridWasVisible = gridLayer?.visible();
  if (gridLayer && !includeGrid) gridLayer.visible(false);

  // Save stage transform — the map occupies (0,0)..(mapWidth,mapHeight) in scene space.
  // Reset to identity so scene coords == stage screen coords for the capture.
  const savedX = stage.x();
  const savedY = stage.y();
  const savedScaleX = stage.scaleX();
  const savedScaleY = stage.scaleY();

  try {
    stage.position({ x: 0, y: 0 });
    stage.scale({ x: 1, y: 1 });

    const dataUrl = stage.toDataURL({
      x: 0,
      y: 0,
      width: mapWidth,
      height: mapHeight,
      pixelRatio: scale,
      mimeType: 'image/png',
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `map-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    stage.position({ x: savedX, y: savedY });
    stage.scale({ x: savedScaleX, y: savedScaleY });

    if (gmLayer && gmWasVisible !== undefined) gmLayer.visible(gmWasVisible);
    if (gridLayer && gridWasVisible !== undefined) gridLayer.visible(gridWasVisible);
  }
}
