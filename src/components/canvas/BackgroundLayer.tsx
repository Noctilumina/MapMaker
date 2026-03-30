import { Layer, Rect, Image as KonvaImage, Group } from 'react-konva';
import { useEffect, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';

// Simple seeded PRNG (mulberry32)
function seededRandom(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function BackgroundLayer() {
  const grid = useMapStore((s) => s.grid);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  const totalWidth = grid.width * grid.cellSize;
  const totalHeight = grid.height * grid.cellSize;

  useEffect(() => {
    if (!grid.backgroundImage) {
      setBgImage(null);
      return;
    }
    const img = new window.Image();
    img.src = grid.backgroundImage.startsWith('http') || grid.backgroundImage.startsWith('data:')
      ? grid.backgroundImage
      : import.meta.env.BASE_URL + grid.backgroundImage.replace(/^\//, '');
    img.onload = () => setBgImage(img);
  }, [grid.backgroundImage]);

  const tileSize = (grid.backgroundTileSize || 1) * grid.cellSize;
  const offsetX = grid.backgroundOffsetX || 0;
  const offsetY = grid.backgroundOffsetY || 0;
  const baseRotation = grid.backgroundRotation || 0;
  const randomize = grid.backgroundRandomize ?? false;
  const seed = grid.backgroundRandomSeed ?? 42;

  const tileImages = [];
  if (bgImage && grid.backgroundTile) {
    const startCol = Math.floor(-offsetX / tileSize) - 1;
    const startRow = Math.floor(-offsetY / tileSize) - 1;
    const endCol = Math.ceil((totalWidth - offsetX) / tileSize) + 1;
    const endRow = Math.ceil((totalHeight - offsetY) / tileSize) + 1;

    const rand = randomize ? seededRandom(seed) : null;
    const rotations = [0, 90, 180, 270];

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const x = c * tileSize + offsetX;
        const y = r * tileSize + offsetY;

        let tileRotation = baseRotation;
        let scaleX = 1;
        let scaleY = 1;

        let jitterX = 0;
        let jitterY = 0;

        if (rand) {
          // Random rotation: pick 0, 90, 180, or 270
          tileRotation = baseRotation + rotations[Math.floor(rand() * 4)];
          // Random flip: 50% chance horizontal, 50% chance vertical
          if (rand() > 0.5) scaleX = -1;
          if (rand() > 0.5) scaleY = -1;
          // Random offset jitter: ±10% of tile size
          // Scale up by 20% to compensate so tile still covers its cell
          const jitterFraction = 0.1;
          const jitterRange = tileSize * jitterFraction;
          jitterX = (rand() - 0.5) * 2 * jitterRange;
          jitterY = (rand() - 0.5) * 2 * jitterRange;
        }

        const renderSize = rand ? tileSize * (1 + 0.2) : tileSize;

        tileImages.push(
          <KonvaImage
            key={`bg-${r}-${c}`}
            image={bgImage}
            x={x + tileSize / 2 + jitterX}
            y={y + tileSize / 2 + jitterY}
            offsetX={renderSize / 2}
            offsetY={renderSize / 2}
            width={renderSize}
            height={renderSize}
            rotation={tileRotation}
            scaleX={scaleX}
            scaleY={scaleY}
            listening={false}
          />
        );
      }
    }
  }

  return (
    <Layer listening={false}>
      <Rect
        x={0} y={0}
        width={totalWidth}
        height={totalHeight}
        fill={grid.backgroundColor}
        listening={false}
      />
      {bgImage && !grid.backgroundTile && (
        <KonvaImage
          image={bgImage}
          x={0} y={0}
          width={totalWidth}
          height={totalHeight}
          listening={false}
        />
      )}
      {tileImages.length > 0 && (
        <Group
          clipX={0} clipY={0}
          clipWidth={totalWidth}
          clipHeight={totalHeight}
        >
          {tileImages}
        </Group>
      )}
    </Layer>
  );
}
