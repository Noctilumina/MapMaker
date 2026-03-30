import { describe, it, expect } from 'vitest';
import { cellToPixel, pixelToCell, snapToGrid } from './grid';

describe('grid utils', () => {
  const cellSize = 64;

  it('converts cell to pixel coordinates', () => {
    expect(cellToPixel(3, 5, cellSize)).toEqual({ x: 192, y: 320 });
  });

  it('converts pixel to cell coordinates', () => {
    expect(pixelToCell(200, 330, cellSize)).toEqual({ col: 3, row: 5 });
  });

  it('snaps pixel position to nearest grid cell top-left', () => {
    expect(snapToGrid(200, 330, cellSize)).toEqual({ x: 192, y: 320 });
  });

  it('handles zero coordinates', () => {
    expect(cellToPixel(0, 0, cellSize)).toEqual({ x: 0, y: 0 });
    expect(pixelToCell(0, 0, cellSize)).toEqual({ col: 0, row: 0 });
  });

  it('handles negative pixel values by flooring', () => {
    expect(pixelToCell(-10, -10, cellSize)).toEqual({ col: -1, row: -1 });
  });
});
