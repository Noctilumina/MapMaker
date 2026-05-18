import type { Tool } from './types';
import type { GridPos } from '../types/index';
import type { TileElement } from '../types/index';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class FillTool implements Tool {
  name = 'fill';

  getCursor() { return 'cell'; }

  onMouseDown(gridPos: GridPos) {
    const { stampAssetId, activeLayerId } = useEditorStore.getState();
    if (!stampAssetId) return;

    const { elements, grid, assets } = useMapStore.getState();
    const stampAsset = assets[stampAssetId];
    if (!stampAsset) return;

    const { cellSize, width: gridW, height: gridH } = grid;

    const tileAt = (col: number, row: number): TileElement | undefined =>
      elements.find(el =>
        el.type === 'tile' &&
        el.layerId === activeLayerId &&
        el.x === col * cellSize &&
        el.y === row * cellSize &&
        el.width === 1 &&
        el.height === 1
      ) as TileElement | undefined;

    const startTile = tileAt(gridPos.col, gridPos.row);
    const sourceAssetId = startTile?.assetId ?? null;

    // Don't fill if source === target
    if (sourceAssetId === stampAssetId) return;

    useHistoryStore.getState().captureSnapshot();

    // BFS
    const visited = new Set<string>();
    const queue: Array<[number, number]> = [[gridPos.col, gridPos.row]];
    const toRemove: string[] = [];
    const toAdd: Array<[number, number]> = [];

    while (queue.length > 0) {
      const [col, row] = queue.shift()!;
      const key = `${col},${row}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (col < 0 || row < 0 || col >= gridW || row >= gridH) continue;

      const tile = tileAt(col, row);
      const cellAssetId = tile?.assetId ?? null;

      if (cellAssetId !== sourceAssetId) continue;

      if (tile) toRemove.push(tile.id);
      toAdd.push([col, row]);

      queue.push([col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]);
    }

    // Apply: remove old tiles, add new ones
    toRemove.forEach(id => useMapStore.getState().removeElement(id));
    useMapStore.getState().addElements(toAdd.map(([col, row]) => ({
      type: 'tile' as const,
      layerId: activeLayerId,
      assetId: stampAssetId,
      groupId: null,
      x: col * cellSize,
      y: row * cellSize,
      width: 1,
      height: 1,
      rotation: 0,
      flipX: false,
      flipY: false,
      tint: null,
      opacity: 1.0,
    })));
  }

  onMouseMove() {}
  onMouseUp() {}
}
