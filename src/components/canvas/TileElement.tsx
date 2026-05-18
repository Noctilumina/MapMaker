import { Image as KonvaImage, Group } from 'react-konva';
import { useEffect, useState } from 'react';
import type { TileElement as TileElementType } from '../../types';
import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';

interface Props {
  element: TileElementType;
}

export default function TileElement({ element }: Props) {
  const asset = useMapStore((s) => s.assets[element.assetId]);
  const grid = useMapStore((s) => s.grid);
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const isSelected = selectedIds.includes(element.id);

  useEffect(() => {
    if (!asset) return;
    const img = new window.Image();
    img.src = asset.src;
    img.onload = () => setImage(img);
  }, [asset?.src]);

  if (!asset || !image) return null;

  const pixelWidth = element.width * grid.cellSize;
  const pixelHeight = element.height * grid.cellSize;

  const cl = element.clipLeft ?? 0;
  const cr = element.clipRight ?? 0;
  const ct = element.clipTop ?? 0;
  const cb = element.clipBottom ?? 0;
  const hasClip = cl > 0 || cr > 0 || ct > 0 || cb > 0;

  // Clip rect in local coords (origin = element center)
  const clipX = -pixelWidth / 2 + cl * pixelWidth;
  const clipY = -pixelHeight / 2 + ct * pixelHeight;
  const clipW = Math.max(0, pixelWidth * (1 - cl - cr));
  const clipH = Math.max(0, pixelHeight * (1 - ct - cb));

  const imageProps = {
    image,
    offsetX: pixelWidth / 2,
    offsetY: pixelHeight / 2,
    width: pixelWidth,
    height: pixelHeight,
    scaleX: element.flipX ? -1 : 1,
    scaleY: element.flipY ? -1 : 1,
  };

  return (
    // Outer group: position + rotation only
    <Group
      x={element.x + pixelWidth / 2}
      y={element.y + pixelHeight / 2}
      rotation={element.rotation}
    >
      {/* Ghost: full unclipped image shown dimmed when selected + clipped */}
      {hasClip && isSelected && (
        <KonvaImage
          {...imageProps}
          opacity={0.18}
          listening={false}
        />
      )}
      {/* Clipped image group */}
      <Group clipFunc={(ctx) => { ctx.rect(clipX, clipY, clipW, clipH); }}>
        <KonvaImage
          id={element.id}
          {...imageProps}
          opacity={element.opacity}
          stroke={isSelected ? '#89b4fa' : undefined}
          strokeWidth={isSelected ? 2 : 0}
        />
      </Group>
    </Group>
  );
}
