import { useRef, useEffect } from 'react';

interface Props {
  count: number;
  thickness: number;
  gap: number;
  color: string;
  angle?: number;
  style?: React.CSSProperties;
}

export default function DiagonalStripes({ count, thickness, gap, color, angle = 45, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'square';

    const rad = (angle * Math.PI) / 180;
    const step = thickness + gap;
    const diag = Math.sqrt(w * w + h * h);

    for (let i = 0; i < count; i++) {
      const offset = h - step + (thickness / 2) - i * step;
      const dx = Math.cos(rad) * diag;
      const dy = Math.sin(rad) * diag;
      ctx.beginPath();
      ctx.moveTo(-dx, offset + dy);
      ctx.lineTo(dx, offset - dy);
      ctx.stroke();
    }
  }, [count, thickness, gap, color, angle]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
    />
  );
}
