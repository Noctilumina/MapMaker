import type { MapProject, MapElement, GridConfig, AssetDef, Group } from '../types';

interface V1Project {
  id: string;
  name: string;
  version?: number;
  grid: Record<string, unknown>;
  layers: unknown[];
  elements: Record<string, unknown>[];
  assets: Record<string, Record<string, unknown>>;
  groups?: Group[];
}

export function migrateProject(project: V1Project): MapProject {
  if (project.version === 2) {
    return project as unknown as MapProject;
  }

  const cellSize = (project.grid.cellSize as number) || 64;

  const elements: MapElement[] = project.elements.map((el) => ({
    id: el.id as string,
    type: el.type as 'tile',
    layerId: el.layerId as string,
    assetId: el.assetId as string,
    groupId: (el.groupId as string | null) ?? null,
    x: (el.x as number) * cellSize,
    y: (el.y as number) * cellSize,
    width: el.width as number,
    height: el.height as number,
    rotation: el.rotation as number,
    flipX: el.flipX as boolean,
    flipY: el.flipY as boolean,
    tint: (el.tint as string | null) ?? null,
    opacity: (el.opacity as number) ?? 1.0,
  }));

  const grid: GridConfig = {
    cellSize,
    width: (project.grid.width as number) || 30,
    height: (project.grid.height as number) || 20,
    scale: (project.grid.scale as string) || '2m',
    visible: (project.grid.visible as boolean) ?? true,
    backgroundColor: (project.grid.backgroundColor as string) || '#11111b',
    backgroundImage: (project.grid.backgroundImage as string | null) ?? null,
    backgroundTile: (project.grid.backgroundTile as boolean) ?? false,
    backgroundTileSize: (project.grid.backgroundTileSize as number) ?? 1,
    backgroundOffsetX: (project.grid.backgroundOffsetX as number) ?? 0,
    backgroundOffsetY: (project.grid.backgroundOffsetY as number) ?? 0,
    backgroundRotation: (project.grid.backgroundRotation as number) ?? 0,
    backgroundRandomize: (project.grid.backgroundRandomize as boolean) ?? false,
    backgroundRandomSeed: (project.grid.backgroundRandomSeed as number) ?? 42,
    timeOfDay: (project.grid.timeOfDay as number) ?? 20,
    lightingEnabled: (project.grid.lightingEnabled as boolean) ?? true,
  };

  const assets: Record<string, AssetDef> = {};
  for (const [id, asset] of Object.entries(project.assets)) {
    assets[id] = {
      src: asset.src as string,
      category: asset.category as string,
      gridSize: asset.gridSize as [number, number],
      name: (asset.name as string) || id,
      source: (asset.source as 'preset' | 'imported') || 'preset',
    };
  }

  return {
    id: project.id,
    name: project.name,
    version: 2,
    grid,
    layers: project.layers as MapProject['layers'],
    elements,
    assets,
    groups: project.groups || [],
  };
}
