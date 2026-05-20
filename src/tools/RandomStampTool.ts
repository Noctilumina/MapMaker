import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class RandomStampTool implements Tool {
  name = 'random-stamp';
  private bag: string[] = [];
  private roundRobinIndex = 0;

  getCursor() { return 'crosshair'; }

  private refillBag(assetIds: string[]) {
    this.bag = fisherYates([...assetIds]);
  }

  private pickAsset(): string | null {
    const { randomStampAssetIds, randomStampShuffleMode } = useEditorStore.getState();
    if (randomStampAssetIds.length === 0) return null;

    if (randomStampShuffleMode === 'pure') {
      return randomStampAssetIds[Math.floor(Math.random() * randomStampAssetIds.length)];
    }
    if (randomStampShuffleMode === 'round-robin') {
      const id = randomStampAssetIds[this.roundRobinIndex % randomStampAssetIds.length];
      this.roundRobinIndex = (this.roundRobinIndex + 1) % randomStampAssetIds.length;
      return id;
    }
    // bag mode: deal from shuffled queue, refill when empty
    this.bag = this.bag.filter(id => randomStampAssetIds.includes(id));
    if (this.bag.length === 0) this.refillBag(randomStampAssetIds);
    return this.bag.pop()!;
  }

  /** Peek at next asset without consuming it (for preview) */
  getPreviewAssetId(): string | null {
    const { randomStampAssetIds, randomStampShuffleMode } = useEditorStore.getState();
    if (randomStampAssetIds.length === 0) return null;
    if (randomStampShuffleMode === 'round-robin')
      return randomStampAssetIds[this.roundRobinIndex % randomStampAssetIds.length];
    if (randomStampShuffleMode === 'bag') {
      const validBag = this.bag.filter(id => randomStampAssetIds.includes(id));
      return validBag.length > 0 ? validBag[validBag.length - 1] : randomStampAssetIds[0];
    }
    // pure: show first in pool as representative
    return randomStampAssetIds[0];
  }

  /** Reshuffle the bag (R hotkey — picks new order without placing) */
  reshuffle() {
    const { randomStampAssetIds } = useEditorStore.getState();
    if (randomStampAssetIds.length > 0) this.refillBag(randomStampAssetIds);
  }

  private computeRotation(): number {
    const { randomStampRotationMode } = useEditorStore.getState();
    if (randomStampRotationMode === 'none') return 0;
    if (randomStampRotationMode === 'cardinal') return [0, 90, 180, 270][Math.floor(Math.random() * 4)];
    return Math.floor(Math.random() * 360);
  }

  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const { activeLayerId, snapToGrid, randomStampScaleEnabled, randomStampScaleRange } = useEditorStore.getState();
    const assetId = this.pickAsset();
    if (!assetId) return;

    const asset = useMapStore.getState().assets[assetId];
    if (!asset) return;

    const { cellSize } = useMapStore.getState().grid;
    let x: number, y: number;

    if (snapToGrid) {
      x = gridPos.col * cellSize;
      y = gridPos.row * cellSize;
    } else {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const pos = transform.point(pointer);
      x = Math.round(pos.x);
      y = Math.round(pos.y);
    }

    const rotation = this.computeRotation();

    let w = asset.gridSize[0];
    let h = asset.gridSize[1];
    if (randomStampScaleEnabled && randomStampScaleRange > 0) {
      const jitter = 1 + (Math.random() * 2 - 1) * (randomStampScaleRange / 100);
      w = w * jitter;
      h = h * jitter;
    }

    const pxW = w * cellSize;
    const pxH = h * cellSize;

    const existing = useMapStore.getState().elements;
    const overlapping = existing.filter(el => {
      if (el.type !== 'tile') return false;
      const ew = el.width * cellSize;
      const eh = el.height * cellSize;
      return x < el.x + ew && x + pxW > el.x && y < el.y + pxH && y + eh > el.y;
    });
    const maxOverlapZ = overlapping.length > 0
      ? overlapping.reduce((m, el) => Math.max(m, el.zIndex ?? 0), -Infinity)
      : undefined;

    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement({
      type: 'tile',
      layerId: activeLayerId,
      assetId,
      groupId: null,
      x,
      y,
      width: w,
      height: h,
      rotation,
      flipX: false,
      flipY: false,
      tint: null,
      opacity: 1.0,
      ...(maxOverlapZ !== undefined ? { zIndex: maxOverlapZ + 1 } : {}),
    });
  }

  onMouseMove(_gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {}
  onMouseUp(_gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {}
}
