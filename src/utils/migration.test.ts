import { describe, it, expect } from 'vitest';
import { migrateProject } from './migration';
import type { TileElement } from '../types';

describe('migrateProject', () => {
  it('migrates v1 project to v2 — converts grid coords to pixels', () => {
    const v1 = {
      id: 'test',
      name: 'Test Map',
      grid: { cellSize: 64, width: 30, height: 20, scale: '2m', visible: true },
      layers: [{ id: 'floor', name: 'Floor', visible: true, locked: false, opacity: 1.0 }],
      elements: [
        { id: 'el1', type: 'tile' as const, layerId: 'floor', assetId: 'a', x: 3, y: 5, width: 1, height: 1, rotation: 0, flipX: false, flipY: false, tint: null },
      ],
      assets: {},
    };

    const v2 = migrateProject(v1);
    expect(v2.version).toBe(2);
    expect((v2.elements[0] as TileElement).x).toBe(192);
    expect((v2.elements[0] as TileElement).y).toBe(320);
    expect(v2.elements[0].groupId).toBeNull();
    expect((v2.elements[0] as TileElement).opacity).toBe(1.0);
    expect(v2.groups).toEqual([]);
    expect(v2.grid.backgroundColor).toBe('#11111b');
    expect(v2.grid.backgroundImage).toBeNull();
    expect(v2.grid.backgroundTile).toBe(false);
  });

  it('returns v2 project unchanged', () => {
    const v2 = {
      id: 'test',
      name: 'Test',
      version: 2,
      grid: { cellSize: 64, width: 30, height: 20, scale: '2m', visible: true, backgroundColor: '#000', backgroundImage: null, backgroundTile: false },
      layers: [],
      elements: [
        { id: 'el1', type: 'tile' as const, layerId: 'floor', assetId: 'a', groupId: null, x: 192, y: 320, width: 1, height: 1, rotation: 0, flipX: false, flipY: false, tint: null, opacity: 1.0 },
      ],
      assets: {},
      groups: [],
    };

    const result = migrateProject(v2);
    expect((result.elements[0] as TileElement).x).toBe(192);
    expect(result.version).toBe(2);
  });

  it('adds name and source to assets missing them', () => {
    const v1 = {
      id: 'test',
      name: 'Test',
      grid: { cellSize: 64, width: 30, height: 20, scale: '2m', visible: true },
      layers: [],
      elements: [],
      assets: { 'floor-concrete': { src: 'data:...', category: 'floors', gridSize: [1, 1] as [number, number] } },
    };

    const v2 = migrateProject(v1);
    expect(v2.assets['floor-concrete'].name).toBe('floor-concrete');
    expect(v2.assets['floor-concrete'].source).toBe('preset');
  });
});
