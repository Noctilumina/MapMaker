import { useEffect } from 'react';
import { useProjectManagerStore } from '../../stores/projectManagerStore';
import { useMapStore } from '../../stores/mapStore';
import { useHistoryStore } from '../../stores/historyStore';
import { loadPresetAssets } from '../../utils/assetLoader';
import { theme } from '../../theme';
import type { MapProject } from '../../types/index';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_LAYERS, DEFAULT_GRID } from '../../types/index';

function snapshotMap(): MapProject {
  const { id, name, version, grid, layers, elements, assets, groups } = useMapStore.getState();
  return JSON.parse(JSON.stringify({ id, name, version, grid, layers, elements, assets, groups }));
}

function loadSnapshot(snap: MapProject) {
  useMapStore.getState().loadProject(snap);
  useHistoryStore.getState().reset();
}

export default function MapTabs() {
  const { tabs, activeIndex, setActiveIndex, updateTab, addTab, removeTab } = useProjectManagerStore();
  const mapName = useMapStore((s) => s.name);

  // Sync live map name into the active tab display without a full snapshot
  useEffect(() => {
    if (tabs.length === 0) return;
    useProjectManagerStore.getState().updateTab(
      activeIndex,
      { ...tabs[activeIndex], name: mapName },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapName]);

  // On mount: seed tab[0] from current mapStore state (which may have loaded default-map.json)
  useEffect(() => {
    if (tabs.length === 0) {
      useProjectManagerStore.getState().addTab(snapshotMap());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitch = (i: number) => {
    if (i === activeIndex) return;
    // snapshot current tab before leaving
    updateTab(activeIndex, snapshotMap());
    // load target tab
    loadSnapshot(tabs[i]);
    setActiveIndex(i);
  };

  const handleNewTab = () => {
    // snapshot current tab before leaving
    updateTab(activeIndex, snapshotMap());
    // create blank project
    const blank: MapProject = {
      id: uuidv4(),
      name: 'Untitled Map',
      version: 2,
      grid: { ...DEFAULT_GRID },
      layers: DEFAULT_LAYERS.map(l => ({ ...l })),
      elements: [],
      assets: {},
      groups: [],
    };
    // register preset assets into the blank project's assets dict
    const presets = loadPresetAssets(DEFAULT_GRID.cellSize);
    Object.entries(presets).forEach(([id, asset]) => { blank.assets[id] = asset; });
    loadSnapshot(blank);
    // loadProject replaces assets dict — presets are already in blank.assets, no extra registerAsset needed
    const newIndex = tabs.length; // capture before addTab
    addTab(blank);
    setActiveIndex(newIndex);
  };

  const handleClose = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;

    if (i === activeIndex) {
      // prefer tab to the left, fallback to the right
      const targetIndex = i > 0 ? i - 1 : 1;
      loadSnapshot(tabs[targetIndex]);
      removeTab(i);
      setActiveIndex(i > 0 ? i - 1 : 0);
    } else {
      removeTab(i);
      setActiveIndex(activeIndex > i ? activeIndex - 1 : activeIndex);
    }
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 10px 0 12px',
    height: '100%',
    fontSize: 11,
    fontFamily: theme.fontHeading,
    cursor: 'pointer',
    userSelect: 'none',
    background: isActive ? theme.surface : 'transparent',
    color: isActive ? theme.text : theme.textMuted,
    borderRight: theme.borderLight,
    borderBottom: isActive ? `2px solid ${theme.primary}` : '2px solid transparent',
    whiteSpace: 'nowrap' as const,
    maxWidth: 160,
    overflow: 'hidden',
  });

  const closeStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: theme.textMuted,
    cursor: 'pointer',
    padding: '0 2px',
    fontSize: 12,
    lineHeight: 1,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  };

  const newTabStyle: React.CSSProperties = {
    height: '100%',
    padding: '0 12px',
    background: 'transparent',
    border: 'none',
    borderRight: theme.borderLight,
    color: theme.textMuted,
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={{
      height: 30,
      background: theme.bg,
      borderBottom: theme.borderHeavy,
      display: 'flex',
      alignItems: 'stretch',
      overflowX: 'auto',
      overflowY: 'hidden',
      flexShrink: 0,
    }}>
      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          style={tabStyle(i === activeIndex)}
          onClick={() => handleSwitch(i)}
          title={tab.name}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {tab.name || 'Untitled'}
          </span>
          {tabs.length > 1 && (
            <button
              style={closeStyle}
              onClick={(e) => handleClose(e, i)}
              title="Close tab"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button style={newTabStyle} onClick={handleNewTab} title="New tab">+</button>
    </div>
  );
}
