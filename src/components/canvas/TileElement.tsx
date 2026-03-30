import { Image as KonvaImage } from 'react-konva';
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
  const pixelX = element.x;
  const pixelY = element.y;

  return (
    <KonvaImage
      id={element.id}
      image={image}
      x={pixelX + pixelWidth / 2}
      y={pixelY + pixelHeight / 2}
      offsetX={pixelWidth / 2}
      offsetY={pixelHeight / 2}
      width={pixelWidth}
      height={pixelHeight}
      rotation={element.rotation}
      scaleX={element.flipX ? -1 : 1}
      scaleY={element.flipY ? -1 : 1}
      opacity={element.opacity}
      stroke={isSelected ? '#89b4fa' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  );
}
