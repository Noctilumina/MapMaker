import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { theme } from '../../theme';

export default function StatusBar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const layers = useMapStore((s) => s.layers);
  const viewport = useEditorStore((s) => s.viewport);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeTool} tool</span>
      <span style={{ margin: '0 8px', color: theme.borderSubtle }}>&middot;</span>
      <span>Layer: {activeLayer?.name || activeLayerId}</span>
      <span style={{ margin: '0 8px', color: theme.borderSubtle }}>&middot;</span>
      <span>Zoom: {Math.round(viewport.zoom * 100)}%</span>
      <span style={{ margin: '0 8px', color: theme.borderSubtle }}>&middot;</span>
      <span>Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
      <span style={{ flex: 1 }} />
    </>
  );
}
