import { useHistoryStore } from '../../stores/historyStore';
import { useMapStore } from '../../stores/mapStore';
import { exportProjectToFile, importProjectFromFile } from '../../utils/storage';
import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import ChipButton from '../ChipButton';

interface Props {
  onExportPng: () => void;
  onNewProject: () => void;
}

export default function Toolbar({ onExportPng, onNewProject }: Props) {
  const { mode, toggle } = useTheme();
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const handleExportJson = () => {
    const { id, name, version, grid, layers, elements, assets, groups } = useMapStore.getState();
    exportProjectToFile({ id, name, version, grid, layers, elements, assets, groups });
  };

  const handleImportJson = async () => {
    const project = await importProjectFromFile();
    useMapStore.getState().loadProject(project);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
      <span style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.1em', position: 'relative', paddingLeft: 14 }}>
        <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: 8, height: 8, background: theme.primary }} />
        MapMaker
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <ChipButton variant="secondary" onClick={onNewProject} style={{ padding: '4px 10px', fontSize: 11 }}>New</ChipButton>
        <ChipButton variant="secondary" onClick={handleImportJson} style={{ padding: '4px 10px', fontSize: 11 }}>Open</ChipButton>
        <ChipButton variant="secondary" onClick={handleExportJson} style={{ padding: '4px 10px', fontSize: 11 }}>Save As</ChipButton>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <ChipButton variant="secondary" onClick={undo} disabled={!canUndo} style={{ padding: '4px 10px', fontSize: 11, border: 'none' }}>Undo</ChipButton>
        <ChipButton variant="secondary" onClick={redo} disabled={!canRedo} style={{ padding: '4px 10px', fontSize: 11, border: 'none' }}>Redo</ChipButton>
      </div>
      <ChipButton variant="success" selected onClick={onExportPng} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 'bold', boxShadow: theme.shadowSm }}>Export PNG</ChipButton>
      <button
        onClick={toggle}
        title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        style={{
          background: 'transparent',
          border: theme.borderLight,
          borderRadius: theme.radius,
          color: theme.textMuted,
          cursor: 'pointer',
          width: 28,
          height: 24,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s',
        }}
      >
        {mode === 'dark' ? '☀' : '🌙'}
      </button>
    </div>
  );
}
