import { Rect } from 'react-konva';

interface Props {
  rect: { x: number; y: number; width: number; height: number } | null;
}

export default function SelectionBox({ rect }: Props) {
  if (!rect) return null;
  return <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="rgba(137, 180, 250, 0.1)" stroke="#89b4fa" strokeWidth={1} dash={[4, 4]} listening={false} />;
}
