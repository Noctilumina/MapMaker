import { Circle, Line } from 'react-konva';
import type { LightSource } from '../../types';
import { useEditorStore } from '../../stores/editorStore';

interface Props {
  element: LightSource;
}

export default function LightElement({ element }: Props) {
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
  const isSelected = selectedIds.includes(element.id);
  const shape = element.lightShape || 'point';

  return (
    <>
      {/* Radius indicator when selected */}
      {isSelected && (
        <Circle
          x={element.x} y={element.y}
          radius={element.radius}
          stroke="#f9e2af" strokeWidth={1} dash={[6, 4]}
          opacity={0.4} listening={false}
        />
      )}

      {/* POINT light marker */}
      {shape === 'point' && (
        <>
          <Circle
            id={element.id}
            x={element.x} y={element.y} radius={10}
            fill={element.color}
            stroke={isSelected ? '#89b4fa' : '#1e1e2e'}
            strokeWidth={isSelected ? 2 : 1}
            opacity={0.8} listening={true}
          />
          {[0, 60, 120, 180, 240, 300].map(angle => {
            const rad = angle * Math.PI / 180;
            return (
              <Line key={`ray-${element.id}-${angle}`}
                points={[
                  element.x + Math.cos(rad) * 12, element.y + Math.sin(rad) * 12,
                  element.x + Math.cos(rad) * 16, element.y + Math.sin(rad) * 16,
                ]}
                stroke={element.color} strokeWidth={2} lineCap="round"
                opacity={0.6} listening={false}
              />
            );
          })}
        </>
      )}

      {/* BAR light marker */}
      {shape === 'bar' && (
        <>
          <Line
            id={element.id}
            points={[element.x, element.y, element.x2 ?? element.x + 64, element.y2 ?? element.y]}
            stroke={element.color}
            strokeWidth={isSelected ? 8 : 6}
            lineCap="round"
            opacity={0.8}
            listening={true}
          />
          {isSelected && (
            <>
              <Circle x={element.x} y={element.y} radius={6}
                fill="#f9e2af" stroke="#1e1e2e" strokeWidth={2} listening={false} />
              <Circle x={element.x2 ?? element.x + 64} y={element.y2 ?? element.y} radius={6}
                fill="#f9e2af" stroke="#1e1e2e" strokeWidth={2} listening={false} />
            </>
          )}
        </>
      )}

      {/* POLYGON light marker */}
      {shape === 'polygon' && element.shapePoints && element.shapePoints.length >= 6 && (
        <>
          <Line
            id={element.id}
            points={element.shapePoints}
            closed
            fill={element.color}
            stroke={isSelected ? '#89b4fa' : element.color}
            strokeWidth={isSelected ? 2 : 1}
            opacity={0.5}
            listening={true}
          />
        </>
      )}
    </>
  );
}
