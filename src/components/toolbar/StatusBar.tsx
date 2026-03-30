import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';

export default function StatusBar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const layers = useMapStore((s) => s.layers);
  const viewport = useEditorStore((s) => s.viewport);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <>
      <span>{activeTool} tool</span>
      <span style={{ margin: '0 8px' }}>&middot;</span>
      <span>Layer: {activeLayer?.name || activeLayerId}</span>
      <span style={{ margin: '0 8px' }}>&middot;</span>
      <span>Zoom: {Math.round(viewport.zoom * 100)}%</span>
      <span style={{ margin: '0 8px' }}>·</span>
      <span>Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
      <span style={{ flex: 1 }} />
    </>
  );
}
