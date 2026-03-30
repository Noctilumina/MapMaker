import manifestData from '../assets/presets/manifest.json';
import type { AssetDef } from '../types';

interface ManifestEntry {
  id: string;
  name: string;
  category: string;
  color: string;
  gridSize: [number, number];
}

function generateTileDataUri(color: string, width: number, height: number, cellSize: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  return canvas.toDataURL();
}

export function loadPresetAssets(cellSize: number): Record<string, AssetDef> {
  const assets: Record<string, AssetDef> = {};
  const entries = manifestData.assets as ManifestEntry[];
  for (const entry of entries) {
    assets[entry.id] = {
      src: generateTileDataUri(entry.color, entry.gridSize[0], entry.gridSize[1], cellSize),
      category: entry.category,
      gridSize: entry.gridSize,
      name: entry.name,
      source: 'preset' as const,
    };
  }
  return assets;
}

export function getManifestEntries(): ManifestEntry[] {
  return manifestData.assets as ManifestEntry[];
}
