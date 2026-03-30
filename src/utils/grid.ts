export function cellToPixel(col: number, row: number, cellSize: number) {
  return { x: col * cellSize, y: row * cellSize };
}

export function pixelToCell(x: number, y: number, cellSize: number) {
  return { col: Math.floor(x / cellSize), row: Math.floor(y / cellSize) };
}

export function snapToGrid(x: number, y: number, cellSize: number) {
  const { col, row } = pixelToCell(x, y, cellSize);
  return cellToPixel(col, row, cellSize);
}
