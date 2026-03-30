import { useHistoryStore } from '../../stores/historyStore';
import { useMapStore } from '../../stores/mapStore';
import { exportProjectToFile, importProjectFromFile } from '../../utils/storage';

interface Props {
  onExportPng: () => void;
  onNewProject: () => void;
}

export default function Toolbar({ onExportPng, onNewProject }: Props) {
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const handleExportJson = () => {
    const { id, name, grid, layers, elements, assets } = useMapStore.getState();
    exportProjectToFile({ id, name, grid, layers, elements, assets });
  };

  const handleImportJson = async () => {
    const project = await importProjectFromFile();
    useMapStore.getState().loadProject(project);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
      <span style={{ color: '#cba6f7', fontWeight: 'bold', fontSize: 14 }}>MapMaker</span>
      <div style={{ display: 'flex', gap: 2 }}>
        <button onClick={onNewProject} style={{ background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>New</button>
        <button onClick={handleImportJson} style={{ background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Open</button>
        <button onClick={handleExportJson} style={{ background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Save As</button>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={undo} disabled={!canUndo} style={{ background: '#45475a', color: canUndo ? '#cdd6f4' : '#6c7086', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: canUndo ? 'pointer' : 'default' }}>Undo</button>
        <button onClick={redo} disabled={!canRedo} style={{ background: '#45475a', color: canRedo ? '#cdd6f4' : '#6c7086', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: canRedo ? 'pointer' : 'default' }}>Redo</button>
      </div>
      <button onClick={onExportPng} style={{ background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>Export PNG</button>
    </div>
  );
}
