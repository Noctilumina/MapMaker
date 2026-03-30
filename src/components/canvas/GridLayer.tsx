import { Layer, Line } from 'react-konva';
import { useMapStore } from '../../stores/mapStore';

export default function GridLayer() {
  const grid = useMapStore((s) => s.grid);
  if (!grid.visible) return null;

  const { cellSize, width, height } = grid;
  const totalWidth = width * cellSize;
  const totalHeight = height * cellSize;
  const lines = [];

  for (let i = 0; i <= width; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i * cellSize, 0, i * cellSize, totalHeight]}
        stroke="#45475a"
        strokeWidth={0.5}
        listening={false}
      />
    );
  }

  for (let i = 0; i <= height; i++) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * cellSize, totalWidth, i * cellSize]}
        stroke="#45475a"
        strokeWidth={0.5}
        listening={false}
      />
    );
  }

  return <Layer listening={false}>{lines}</Layer>;
}
