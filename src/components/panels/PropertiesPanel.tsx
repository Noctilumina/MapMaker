import { useState, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { useHistoryStore } from '../../stores/historyStore';
import { theme } from '../../theme';

interface TextureEntry {
  id: string;
  name: string;
  category: string;
  path: string;
}

const TEXTURE_CATEGORIES = ['all', 'grass', 'ground', 'rock', 'stone-wall', 'wood', 'paving', 'roof', 'misc', 'numbered'];

export default function PropertiesPanel() {
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
  const elements = useMapStore((s) => s.elements);
  const updateElement = useMapStore((s) => s.updateElement);
  const removeElement = useMapStore((s) => s.removeElement);
  const grid = useMapStore((s) => s.grid);
  const setGrid = useMapStore((s) => s.setGrid);
  const mapName = useMapStore((s) => s.name);
  const setName = useMapStore((s) => s.setName);
  const layers = useMapStore((s) => s.layers);
  const assets = useMapStore((s) => s.assets);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgCategory, setBgCategory] = useState('all');
  const [textures, setTextures] = useState<TextureEntry[]>([]);
  const [bgSearch, setBgSearch] = useState('');

  const inputStyle: React.CSSProperties = { background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '2px 4px', fontSize: 11, width: '100%', boxSizing: 'border-box' as const };


  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}textures/manifest.json`)
      .then(r => r.json())
      .then(data => setTextures(data.textures || []))
      .catch(() => {});
  }, []);

  // --- Map Properties (no selection) ---
  if (selectedIds.length === 0) {
    const handleSetBackgroundImage = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setGrid({ backgroundImage: reader.result as string });
        reader.readAsDataURL(file);
      };
      input.click();
    };

    return (
      <div style={{ padding: 12, fontSize: 12, color: theme.textMuted }}>
        <div className="panel-header panel-header--warning" style={{ color: theme.warning }}>Map Properties</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ color: theme.textMuted, fontSize: 12 }}>
            Name
            <input
              value={mapName}
              onChange={(e) => setName(e.target.value)}
              style={{ display: 'block', marginTop: 4, width: '100%', background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '4px 8px', fontSize: 12, boxSizing: 'border-box' }}
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', alignItems: 'center' }}>
            <span>Width</span>
            <input type="number" min={1} max={200} value={grid.width}
              onChange={(e) => setGrid({ width: Math.max(1, Number(e.target.value)) })}
              style={{ ...inputStyle, padding: '2px 6px' }} />
            <span>Height</span>
            <input type="number" min={1} max={200} value={grid.height}
              onChange={(e) => setGrid({ height: Math.max(1, Number(e.target.value)) })}
              style={{ ...inputStyle, padding: '2px 6px' }} />
            <span>Scale</span>
            <select value={grid.scale}
              onChange={(e) => setGrid({ scale: e.target.value })}
              style={{ background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '2px 6px', fontSize: 11 }}>
              <option value="2m">2m (Cyberpunk Red)</option>
              <option value="5ft">5ft (D&D / Pathfinder)</option>
              <option value="1m">1m</option>
              <option value="1.5m">1.5m</option>
              <option value="10ft">10ft</option>
            </select>
          </div>
          <label style={{ color: theme.textMuted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            Background
            <input
              type="color"
              value={grid.backgroundColor}
              onChange={(e) => setGrid({ backgroundColor: e.target.value })}
              style={{ width: 32, height: 24, padding: 0, border: theme.borderLight, borderRadius: theme.radius, background: 'none', cursor: 'pointer' }}
            />
            <span style={{ color: theme.text, fontFamily: 'monospace', fontSize: 11 }}>{grid.backgroundColor}</span>
          </label>
          <div>
            <div style={{ color: theme.textMuted, marginBottom: 4 }}>Background Image</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowBgPicker(!showBgPicker)}
                style={{ background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {showBgPicker ? 'Hide Presets' : 'Choose'}
              </button>
              <button
                onClick={handleSetBackgroundImage}
                style={{ background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Upload
              </button>
              {grid.backgroundImage && (
                <button
                  onClick={() => setGrid({ backgroundImage: null })}
                  style={{ background: theme.danger, color: theme.bg, border: 'none', borderRadius: theme.radius, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Remove
                </button>
              )}
            </div>
            {grid.backgroundImage && (
              <img
                src={grid.backgroundImage}
                alt="Background preview"
                style={{ marginTop: 6, maxWidth: '100%', maxHeight: 64, borderRadius: theme.radius, border: theme.borderLight }}
              />
            )}
            {showBgPicker && (
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Search textures..."
                  value={bgSearch}
                  onChange={(e) => setBgSearch(e.target.value)}
                  style={{ width: '100%', background: theme.surface, border: theme.borderLight, borderRadius: theme.radius, padding: '4px 8px', color: theme.text, fontSize: 11, marginBottom: 6, boxSizing: 'border-box', outline: 'none' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
                  {TEXTURE_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setBgCategory(cat)}
                      style={{
                        background: bgCategory === cat ? theme.primary : theme.surface,
                        color: bgCategory === cat ? theme.bg : theme.textMuted,
                        border: 'none', borderRadius: theme.radius, padding: '1px 6px', fontSize: 10, cursor: 'pointer', textTransform: 'capitalize',
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, maxHeight: 400, overflow: 'auto' }}>
                  {textures
                    .filter(t => bgCategory === 'all' || t.category === bgCategory)
                    .filter(t => !bgSearch || t.name.toLowerCase().includes(bgSearch.toLowerCase()))
                    .map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          const base = import.meta.env.BASE_URL;
                          setGrid({ backgroundImage: base + t.path.replace(/^\//, ''), backgroundTile: true });
                          setShowBgPicker(false);
                        }}
                        title={t.name}
                        style={{
                          aspectRatio: '1', border: grid.backgroundImage?.endsWith(t.path.replace(/^\//, '')) ? '2px solid ' + theme.primary : '2px solid transparent',
                          borderRadius: theme.radius, cursor: 'pointer', padding: 0, overflow: 'hidden', background: theme.surface,
                        }}
                      >
                        <img src={import.meta.env.BASE_URL + t.path.replace(/^\//, '')} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      </button>
                    ))}
                </div>
                {textures.length === 0 && (
                  <div style={{ color: theme.textMuted, fontSize: 10, padding: 4 }}>No textures found. Add images to public/textures/</div>
                )}
              </div>
            )}
          </div>
          <label style={{ color: theme.textMuted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={grid.backgroundTile}
              onChange={(e) => setGrid({ backgroundTile: e.target.checked })}
            />
            Tile Background Image
          </label>
          {grid.backgroundTile && grid.backgroundImage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0', borderTop: '1px solid ' + theme.borderSubtle, marginTop: 4 }}>
              <div style={{ color: theme.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tiling Controls</div>
              <label style={{ color: theme.textMuted, fontSize: 11 }}>
                Tile Size (cells)
                <input
                  type="number"
                  min={0.25}
                  max={20}
                  step={0.25}
                  value={grid.backgroundTileSize}
                  onChange={(e) => setGrid({ backgroundTileSize: Math.max(0.25, Number(e.target.value)) })}
                  style={{ display: 'block', marginTop: 2, width: '100%', background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '3px 6px', fontSize: 11, boxSizing: 'border-box' }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ color: theme.textMuted, fontSize: 11, flex: 1 }}>
                  Offset X
                  <input
                    type="number"
                    step={4}
                    value={grid.backgroundOffsetX}
                    onChange={(e) => setGrid({ backgroundOffsetX: Number(e.target.value) })}
                    style={{ display: 'block', marginTop: 2, width: '100%', background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '3px 6px', fontSize: 11, boxSizing: 'border-box' }}
                  />
                </label>
                <label style={{ color: theme.textMuted, fontSize: 11, flex: 1 }}>
                  Offset Y
                  <input
                    type="number"
                    step={4}
                    value={grid.backgroundOffsetY}
                    onChange={(e) => setGrid({ backgroundOffsetY: Number(e.target.value) })}
                    style={{ display: 'block', marginTop: 2, width: '100%', background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '3px 6px', fontSize: 11, boxSizing: 'border-box' }}
                  />
                </label>
              </div>
              <label style={{ color: theme.textMuted, fontSize: 11 }}>
                Rotation ({grid.backgroundRotation}°)
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={grid.backgroundRotation}
                  onChange={(e) => setGrid({ backgroundRotation: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: 2 }}
                />
              </label>
              <label style={{ color: theme.textMuted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={grid.backgroundRandomize ?? false}
                  onChange={(e) => setGrid({ backgroundRandomize: e.target.checked })}
                />
                Randomize tiles
              </label>
              {grid.backgroundRandomize && (
                <button
                  onClick={() => setGrid({ backgroundRandomSeed: Math.floor(Math.random() * 100000) })}
                  style={{ background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginTop: 2, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Reshuffle
                </button>
              )}
            </div>
          )}
        </div>
        {/* Lighting */}
        <div style={{ borderTop: '1px solid ' + theme.borderSubtle, paddingTop: 8, marginTop: 8 }}>
          <div style={{ color: theme.warning, fontWeight: 'bold', fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Lighting</div>
          <label style={{ color: theme.textMuted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={grid.lightingEnabled ?? true}
              onChange={(e) => setGrid({ lightingEnabled: e.target.checked })} />
            Enable lighting
          </label>
          {grid.lightingEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: theme.textMuted, fontSize: 11 }}>
                Time of Day
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <input type="text" value={`${Math.floor(grid.timeOfDay ?? 14).toString().padStart(2, '0')}:${Math.round(((grid.timeOfDay ?? 14) % 1) * 60).toString().padStart(2, '0')}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(':');
                      if (parts.length === 2) {
                        const h = parseInt(parts[0]) || 0;
                        const m = parseInt(parts[1]) || 0;
                        const time = Math.min(24, Math.max(0, h + m / 60));
                        setGrid({ timeOfDay: time });
                      }
                    }}
                    style={{ width: 60, background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '3px 6px', fontSize: 12, fontFamily: 'monospace', textAlign: 'center', boxSizing: 'border-box' }} />
                  <input type="range" min={0} max={24} step={0.25} value={grid.timeOfDay ?? 14}
                    onChange={(e) => setGrid({ timeOfDay: Number(e.target.value) })}
                    style={{ flex: 1 }} />
                </div>
              </label>
              <button onClick={() => {
                const cs = grid.cellSize;
                useMapStore.getState().addElement({
                  type: 'light',
                  layerId: 'objects',
                  groupId: null,
                  x: grid.width * cs / 2,
                  y: grid.height * cs / 2,
                  radius: cs * 5,
                  color: '#ffcc66',
                  intensity: 0.8,
                  flickerAmount: 0,
                  lightShape: 'point',
                });
              }} style={{ background: theme.surface, color: theme.warning, border: theme.borderLight, borderRadius: theme.radius, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                + Add Light Source
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Multi-selection ---
  if (selectedIds.length > 1) {
    const selectedElements = elements.filter(el => selectedIds.includes(el.id)) as any[];

    const handleGroup = () => {
      useHistoryStore.getState().captureSnapshot();
      const groupId = useMapStore.getState().addGroup('New Group');
      selectedIds.forEach(id => useMapStore.getState().setElementGroup(id, groupId));
      useEditorStore.getState().setRenamingGroupId(groupId);
    };

    // Seeded PRNG for randomization
    const seededRandom = (seed: number) => {
      let s = seed | 0;
      return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const handleRandomize = () => {
      useHistoryStore.getState().captureSnapshot();
      const rand = seededRandom(Date.now());
      const rotations = [0, 90, 180, 270];
      const cellSize = useMapStore.getState().grid.cellSize;

      selectedElements.forEach(el => {
        const rotation = rotations[Math.floor(rand() * 4)];
        const flipX = rand() > 0.5;
        const flipY = rand() > 0.5;
        // Snap to grid first to get base position
        const baseX = Math.round(el.x / cellSize) * cellSize;
        const baseY = Math.round(el.y / cellSize) * cellSize;
        // Get base size from asset
        const asset = useMapStore.getState().assets[el.assetId];
        const baseW = asset ? asset.gridSize[0] : 1;
        const baseH = asset ? asset.gridSize[1] : 1;
        // Generous jitter: ±25% of cell size
        const jitterRange = cellSize * baseW * 0.25;
        const jitterX = (rand() - 0.5) * 2 * jitterRange;
        const jitterY = (rand() - 0.5) * 2 * jitterRange;
        // Varied scale: 1.1x to 1.5x per tile to look organic
        const scale = 1.1 + rand() * 0.4;
        // Slight opacity variation: 0.8 to 1.0
        const opacity = 0.8 + rand() * 0.2;

        updateElement(el.id, {
          rotation,
          flipX,
          flipY,
          x: Math.round(baseX + jitterX),
          y: Math.round(baseY + jitterY),
          width: baseW * scale,
          height: baseH * scale,
          opacity: Math.round(opacity * 100) / 100,
        });
      });
    };

    const handleResetTransforms = () => {
      useHistoryStore.getState().captureSnapshot();
      const cellSize = useMapStore.getState().grid.cellSize;
      const allAssets = useMapStore.getState().assets;
      selectedElements.forEach(el => {
        const asset = allAssets[el.assetId];
        updateElement(el.id, {
          rotation: 0,
          flipX: false,
          flipY: false,
          x: Math.round(el.x / cellSize) * cellSize,
          y: Math.round(el.y / cellSize) * cellSize,
          width: asset ? asset.gridSize[0] : el.width,
          height: asset ? asset.gridSize[1] : el.height,
        });
      });
    };

    const handleSetAllRotation = (rotation: number) => {
      useHistoryStore.getState().captureSnapshot();
      selectedElements.forEach(el => updateElement(el.id, { rotation }));
    };

    const handleSetAllOpacity = (opacity: number) => {
      useHistoryStore.getState().captureSnapshot();
      selectedElements.forEach(el => updateElement(el.id, { opacity }));
    };

    const btnStyle = { background: theme.surface, color: theme.text, border: 'none', borderRadius: theme.radius, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase' as const, letterSpacing: '0.05em' } as const;

    return (
      <div style={{ padding: 12, color: theme.textMuted, fontSize: 12 }}>
        <div className="panel-header panel-header--success" style={{ color: theme.success }}>Properties</div>
        <div style={{ marginBottom: 8, padding: '8px 12px' }}>{selectedIds.length} elements selected</div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <button onClick={handleGroup} style={{ ...btnStyle, background: theme.info, color: theme.bg }}>
            Group (Ctrl+G)
          </button>
          <button
            onClick={() => {
              useHistoryStore.getState().captureSnapshot();
              selectedIds.forEach((id) => removeElement(id));
              useEditorStore.getState().deselect();
            }}
            style={{ ...btnStyle, background: theme.danger, color: theme.bg }}
          >
            Delete All
          </button>
        </div>

        {/* Batch rotation */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: theme.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Set All Rotation</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 90, 180, 270].map(r => (
              <button key={r} onClick={() => handleSetAllRotation(r)}
                style={{ ...btnStyle, padding: '2px 8px' }}>
                {r}°
              </button>
            ))}
          </div>
        </div>

        {/* Batch opacity */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: theme.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Set All Opacity</div>
          <input
            type="range" min={0} max={100} defaultValue={100}
            onChange={(e) => handleSetAllOpacity(Number(e.target.value) / 100)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Tile scale */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: theme.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tile Scale</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[0.5, 1, 1.5, 2, 3].map(s => (
              <button key={s} onClick={() => {
                useHistoryStore.getState().captureSnapshot();
                const allAssets = useMapStore.getState().assets;
                selectedElements.forEach(el => {
                  const asset = allAssets[el.assetId];
                  const baseW = asset ? asset.gridSize[0] : 1;
                  const baseH = asset ? asset.gridSize[1] : 1;
                  updateElement(el.id, { width: baseW * s, height: baseH * s });
                });
              }} style={{ ...btnStyle, padding: '2px 8px' }}>
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Tiling detection + randomization */}
        <div style={{ borderTop: '1px solid ' + theme.borderSubtle, paddingTop: 8 }}>
          <div style={{ color: theme.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Tiling</div>
          {(() => {
            // Detect if selection forms a grid of same-asset tiles
            const assetIds = new Set(selectedElements.map(el => el.assetId));
            const isSameAsset = assetIds.size === 1;
            const cellSize = useMapStore.getState().grid.cellSize;

            // Check if tiles are arranged in a grid pattern
            const xs = selectedElements.map(el => Math.round(el.x / cellSize));
            const ys = selectedElements.map(el => Math.round(el.y / cellSize));
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const expectedCount = (maxX - minX + 1) * (maxY - minY + 1);
            const isGridPattern = expectedCount === selectedElements.length && expectedCount > 1;

            return (
              <div>
                {isSameAsset && isGridPattern && (
                  <div style={{ background: theme.bg, border: theme.borderLight, borderRadius: theme.radius, padding: 6, marginBottom: 6, fontSize: 10, color: theme.success }}>
                    Detected {maxX - minX + 1}x{maxY - minY + 1} tile grid — tiling tools available
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={handleRandomize} style={{ ...btnStyle, background: theme.success, color: theme.bg }}>
                    Randomize
                  </button>
                  <button onClick={handleResetTransforms} style={btnStyle}>
                    Reset to Grid
                  </button>
                </div>
                <div style={{ color: theme.textMuted, fontSize: 10, marginTop: 4 }}>
                  Randomizes rotation, flip, and position jitter. Tiles scale up 20% to cover gaps.
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // --- Single element selected ---
  const el = elements.find((e) => e.id === selectedIds[0]);
  if (!el) return null;

  const handleUpdate = (updates: Record<string, unknown>) => {
    useHistoryStore.getState().captureSnapshot();
    updateElement(el.id, updates as Partial<typeof el>);
  };
  const opacityPct = Math.round(('opacity' in el ? (el.opacity ?? 1) : 1) * 100);

  return (
    <div style={{ fontSize: 12, color: theme.textMuted }}>
      <div className="panel-header panel-header--success" style={{ color: theme.success }}>Properties</div>
      <div style={{ padding: 12 }}>
      {'assetId' in el && assets[el.assetId] && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '4px 6px', background: theme.surface, borderRadius: theme.radius }}>
          <img src={assets[el.assetId].src} alt="" style={{ width: 24, height: 24, borderRadius: theme.radius, objectFit: 'contain', background: theme.bg }} />
          <span style={{ color: theme.text, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assets[el.assetId].name}</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px', alignItems: 'center' }}>
        {el.type === 'tile' && (
          <>
            <span>Position</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <input type="number" value={Math.round(el.x)} step={useEditorStore.getState().snapToGrid ? grid.cellSize : 1}
                onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
                style={{ flex: 1, ...inputStyle }} />
              <input type="number" value={Math.round(el.y)} step={useEditorStore.getState().snapToGrid ? grid.cellSize : 1}
                onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
                style={{ flex: 1, ...inputStyle }} />
            </div>
            <span>Size</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <input type="number" min={0.1} step={0.1} value={el.width}
                onChange={(e) => handleUpdate({ width: Math.max(0.1, Number(e.target.value)) })}
                style={{ flex: 1, ...inputStyle }} />
              <span style={{ color: theme.textMuted, alignSelf: 'center' }}>×</span>
              <input type="number" min={0.1} step={0.1} value={el.height}
                onChange={(e) => handleUpdate({ height: Math.max(0.1, Number(e.target.value)) })}
                style={{ flex: 1, ...inputStyle }} />
            </div>
            <span>Rotation</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input type="number" min={0} max={359} step={useEditorStore.getState().snapToGrid ? 15 : 1} value={el.rotation}
                onChange={(e) => handleUpdate({ rotation: ((Number(e.target.value) % 360) + 360) % 360 })}
                style={{ width: 50, background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '2px 4px', fontSize: 11, boxSizing: 'border-box' }} />
              <span style={{ color: theme.textMuted, fontSize: 10 }}>°</span>
              {[0, 90, 180, 270].map((r) => (
                <button key={r} onClick={() => handleUpdate({ rotation: r })}
                  style={{ background: el.rotation === r ? theme.primary : theme.surface, color: el.rotation === r ? theme.bg : theme.textMuted, border: 'none', borderRadius: theme.radius, padding: '1px 4px', fontSize: 9, cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>
            <span>Flip</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => handleUpdate({ flipX: !el.flipX })}
                style={{ background: el.flipX ? theme.info : theme.surface, color: el.flipX ? theme.bg : theme.textMuted, border: 'none', borderRadius: theme.radius, padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}
              >
                H
              </button>
              <button
                onClick={() => handleUpdate({ flipY: !el.flipY })}
                style={{ background: el.flipY ? theme.info : theme.surface, color: el.flipY ? theme.bg : theme.textMuted, border: 'none', borderRadius: theme.radius, padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}
              >
                V
              </button>
            </div>
            <span>Light</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={el.blocksLight ?? false}
                onChange={(e) => handleUpdate({ blocksLight: e.target.checked })}
              />
              <span style={{ fontSize: 10, color: theme.textMuted }}>Blocks light</span>
            </label>
            {!assets[el.assetId]?.occlusionHull && (
              <span style={{ fontSize: 9, color: theme.textMuted, gridColumn: '1 / -1' }}>
                No hull computed for this asset
              </span>
            )}
          </>
        )}
        {el.type === 'light' && (
          <>
            <span>Shape</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['point', 'bar', 'polygon'] as const).map(s => (
                <button key={s} onClick={() => handleUpdate({ lightShape: s })}
                  style={{ flex: 1, background: (el.lightShape || 'point') === s ? theme.warning : theme.surface,
                    color: (el.lightShape || 'point') === s ? theme.bg : theme.textMuted,
                    border: 'none', borderRadius: theme.radius, padding: '3px 0', fontSize: 10, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>
            <span>Position</span>
            <span style={{ color: theme.text }}>({Math.round(el.x)}, {Math.round(el.y)})</span>
            {(el.lightShape || 'point') === 'bar' && (
              <>
                <span>End point</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="number" value={Math.round(el.x2 ?? el.x + 64)} step={grid.cellSize}
                    onChange={(e) => handleUpdate({ x2: Number(e.target.value) })}
                    style={{ flex: 1, ...inputStyle }} />
                  <input type="number" value={Math.round(el.y2 ?? el.y)} step={grid.cellSize}
                    onChange={(e) => handleUpdate({ y2: Number(e.target.value) })}
                    style={{ flex: 1, ...inputStyle }} />
                </div>
              </>
            )}
            <span>Radius</span>
            <input type="number" min={10} max={2000} step={10} value={el.radius}
              onChange={(e) => handleUpdate({ radius: Math.max(10, Number(e.target.value)) })}
              style={{ ...inputStyle, padding: '2px 6px' }} />
            <span>Color</span>
            <input type="color" value={el.color}
              onChange={(e) => handleUpdate({ color: e.target.value })}
              style={{ width: 32, height: 20, border: theme.borderLight, borderRadius: theme.radius, padding: 0, cursor: 'pointer', background: 'none' }} />
            <span>Intensity</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="range" min={0} max={100} step={5} value={Math.round(el.intensity * 100)}
                onChange={(e) => handleUpdate({ intensity: Number(e.target.value) / 100 })}
                style={{ flex: 1 }} />
              <span style={{ color: theme.text, width: 28, textAlign: 'right', fontSize: 10 }}>{Math.round(el.intensity * 100)}%</span>
            </div>
            <span>Flicker</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="range" min={0} max={100} step={5} value={Math.round(el.flickerAmount * 100)}
                onChange={(e) => handleUpdate({ flickerAmount: Number(e.target.value) / 100 })}
                style={{ flex: 1 }} />
              <span style={{ color: theme.text, width: 28, textAlign: 'right', fontSize: 10 }}>{Math.round(el.flickerAmount * 100)}%</span>
            </div>
          </>
        )}
        {el.type === 'polygon' && (
          <>
            <span>Vertices</span>
            <span style={{ color: theme.text }}>{el.points.length / 2}</span>
            <span>Smoothing</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="range" min={0} max={1} step={0.05} value={el.tension || 0}
                onChange={(e) => handleUpdate({ tension: Number(e.target.value) })}
                style={{ flex: 1 }} />
              <span style={{ color: theme.text, width: 28, textAlign: 'right', fontSize: 10 }}>{((el.tension || 0) * 100).toFixed(0)}%</span>
            </div>
            <span>Texture</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                {assets[el.assetId] && (
                  <img src={assets[el.assetId].src} alt="" style={{ width: 24, height: 24, borderRadius: theme.radius, border: theme.borderLight, objectFit: 'cover' }} />
                )}
                <span style={{ color: theme.text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {assets[el.assetId]?.name || el.assetId}
                </span>
              </div>
              <select
                value={el.assetId}
                onChange={(e) => handleUpdate({ assetId: e.target.value })}
                style={{ width: '100%', background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '2px 6px', fontSize: 10, boxSizing: 'border-box' }}
              >
                {Object.entries(assets).map(([id, a]) => (
                  <option key={id} value={id}>{a.name}</option>
                ))}
              </select>
            </div>
            <span>Fill Scale</span>
            <input type="number" min={0.1} max={10} step={0.1} value={el.fillScale}
              onChange={(e) => handleUpdate({ fillScale: Math.max(0.1, Number(e.target.value)) })}
              style={{ ...inputStyle, padding: '2px 6px' }} />
            <span>Fill Rotation</span>
            <input type="range" min={0} max={360} step={15} value={el.fillRotation}
              onChange={(e) => handleUpdate({ fillRotation: Number(e.target.value) })}
              style={{ width: '100%' }} />
            <span>Offset X</span>
            <input type="number" step={4} value={el.fillOffsetX}
              onChange={(e) => handleUpdate({ fillOffsetX: Number(e.target.value) })}
              style={{ ...inputStyle, padding: '2px 6px' }} />
            <span>Offset Y</span>
            <input type="number" step={4} value={el.fillOffsetY}
              onChange={(e) => handleUpdate({ fillOffsetY: Number(e.target.value) })}
              style={{ ...inputStyle, padding: '2px 6px' }} />
            <span>Randomize</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flex: 1 }}>
                <input type="checkbox" checked={el.fillRandomize ?? false}
                  onChange={(e) => handleUpdate({ fillRandomize: e.target.checked })} />
                <span style={{ fontSize: 10, color: theme.textMuted }}>Random tiles</span>
              </label>
              {el.fillRandomize && (
                <button
                  onClick={() => handleUpdate({ fillRandomSeed: Math.floor(Math.random() * 100000) })}
                  style={{ background: theme.surface, color: theme.text, border: 'none', borderRadius: theme.radius, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}>
                  Reshuffle
                </button>
              )}
            </div>
            <span>Border</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min={0} max={20} step={1} value={el.borderWidth || 0}
                onChange={(e) => handleUpdate({ borderWidth: Math.max(0, Number(e.target.value)) })}
                style={{ width: 48, background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '2px 6px', fontSize: 11, boxSizing: 'border-box' }} />
              <span style={{ fontSize: 10, color: theme.textMuted }}>px</span>
              <input type="color" value={el.borderColor || '#ffffff'}
                onChange={(e) => handleUpdate({ borderColor: e.target.value })}
                style={{ width: 24, height: 20, border: theme.borderLight, borderRadius: theme.radius, padding: 0, cursor: 'pointer', background: 'none' }} />
            </div>
            <span>Light</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={el.wallsBlockLight ?? true}
                onChange={(e) => handleUpdate({ wallsBlockLight: e.target.checked })} />
              <span style={{ fontSize: 10, color: theme.textMuted }}>{(el.wallsBlockLight ?? true) ? 'Walls block light' : 'Glass walls (light passes through)'}</span>
            </label>
            {/* Openings */}
            <span>Openings</span>
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <button onClick={() => {
                  const pendingOpening = useEditorStore.getState().pendingOpening;
                  useEditorStore.getState().setPendingOpening(pendingOpening === 'door' ? null : 'door');
                  useEditorStore.getState().setPendingInnerWall(false);
                }} style={{
                  background: useEditorStore.getState().pendingOpening === 'door' ? theme.success : theme.surface,
                  color: useEditorStore.getState().pendingOpening === 'door' ? theme.bg : theme.textMuted,
                  border: 'none', borderRadius: theme.radius, padding: '2px 8px', fontSize: 10, cursor: 'pointer',
                }}>+ Door</button>
                <button onClick={() => {
                  const pendingOpening = useEditorStore.getState().pendingOpening;
                  useEditorStore.getState().setPendingOpening(pendingOpening === 'window' ? null : 'window');
                  useEditorStore.getState().setPendingInnerWall(false);
                }} style={{
                  background: useEditorStore.getState().pendingOpening === 'window' ? theme.info : theme.surface,
                  color: useEditorStore.getState().pendingOpening === 'window' ? theme.bg : theme.textMuted,
                  border: 'none', borderRadius: theme.radius, padding: '2px 8px', fontSize: 10, cursor: 'pointer',
                }}>+ Window</button>
              </div>
              {(el.openings || []).length > 0 && (
                <div style={{ fontSize: 10, color: theme.textMuted }}>
                  {(el.openings || []).map(o => {
                    const updateOpening = (updates: Partial<typeof o>) => {
                      useHistoryStore.getState().captureSnapshot();
                      handleUpdate({
                        openings: (el.openings || []).map(op => op.id === o.id ? { ...op, ...updates } : op),
                      });
                    };
                    return (
                      <div key={o.id} style={{ padding: '4px 0', borderBottom: '1px solid ' + theme.borderSubtle }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ flex: 1 }}>{o.type} (edge {o.edgeIndex})</span>
                          <button onClick={() => {
                            useHistoryStore.getState().captureSnapshot();
                            handleUpdate({ openings: (el.openings || []).filter(op => op.id !== o.id) });
                          }} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: 10 }}>×</button>
                        </div>
                        {o.type === 'door' && (
                          <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>Color</span>
                              <input type="color" value={o.doorColor || '#6c7086'}
                                onChange={(e) => updateOpening({ doorColor: e.target.value })}
                                style={{ width: 20, height: 16, border: theme.borderLight, borderRadius: theme.radius, padding: 0, cursor: 'pointer', background: 'none' }} />
                              <span>Hinge</span>
                              <select value={o.doorHinge || 'left'}
                                onChange={(e) => updateOpening({ doorHinge: e.target.value as 'left' | 'right' })}
                                style={{ background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '0 4px', fontSize: 9 }}>
                                <option value="left">L</option>
                                <option value="right">R</option>
                              </select>
                              <span>Swing</span>
                              <select value={o.doorSwing || 'inward'}
                                onChange={(e) => updateOpening({ doorSwing: e.target.value as 'inward' | 'outward' })}
                                style={{ background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '0 4px', fontSize: 9 }}>
                                <option value="inward">In</option>
                                <option value="outward">Out</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>Open</span>
                              <input type="range" min={0} max={90} step={5} value={o.doorOpenAngle ?? 45}
                                onChange={(e) => updateOpening({ doorOpenAngle: Number(e.target.value) })}
                                style={{ flex: 1 }} />
                              <span style={{ width: 24, textAlign: 'right' }}>{o.doorOpenAngle ?? 45}°</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inner Walls */}
            <span>Inner Walls</span>
            <div>
              <button onClick={() => {
                const pendingInnerWall = useEditorStore.getState().pendingInnerWall;
                useEditorStore.getState().setPendingInnerWall(!pendingInnerWall);
                useEditorStore.getState().setPendingOpening(null);
              }} style={{
                background: useEditorStore.getState().pendingInnerWall ? theme.warning : theme.surface,
                color: useEditorStore.getState().pendingInnerWall ? theme.bg : theme.textMuted,
                border: 'none', borderRadius: theme.radius, padding: '2px 8px', fontSize: 10, cursor: 'pointer',
              }}>+ Draw Wall</button>
              {(el.innerWalls || []).length > 0 && (
                <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                  {(el.innerWalls || []).length} inner wall(s)
                  <button onClick={() => {
                    useHistoryStore.getState().captureSnapshot();
                    handleUpdate({ innerWalls: [] });
                  }} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: 10, marginLeft: 4 }}>Clear all</button>
                </div>
              )}
            </div>
          </>
        )}
        {el.type === 'path' && (
          <>
            <span>Points</span>
            <span style={{ color: theme.text }}>{el.pathPoints.length}</span>
            <span>Road Width</span>
            <input type="number" min={4} max={500} step={4} value={el.pathWidth}
              onChange={(e) => handleUpdate({ pathWidth: Math.max(4, Number(e.target.value)) })}
              style={{ ...inputStyle, padding: '2px 6px' }} />
            <span>Texture</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                {assets[el.assetId] && (
                  <img src={assets[el.assetId].src} alt="" style={{ width: 24, height: 24, borderRadius: theme.radius, border: theme.borderLight, objectFit: 'cover' }} />
                )}
                <span style={{ color: theme.text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {assets[el.assetId]?.name || el.assetId}
                </span>
              </div>
              <select value={el.assetId} onChange={(e) => handleUpdate({ assetId: e.target.value })}
                style={{ width: '100%', background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '2px 6px', fontSize: 10, boxSizing: 'border-box' }}>
                {Object.entries(assets).map(([id, a]) => (
                  <option key={id} value={id}>{a.name}</option>
                ))}
              </select>
            </div>
            <span>Fill Scale</span>
            <input type="number" min={0.1} max={10} step={0.1} value={el.fillScale}
              onChange={(e) => handleUpdate({ fillScale: Math.max(0.1, Number(e.target.value)) })}
              style={{ ...inputStyle, padding: '2px 6px' }} />
            <span>Fill Rotation</span>
            <input type="range" min={0} max={360} step={15} value={el.fillRotation}
              onChange={(e) => handleUpdate({ fillRotation: Number(e.target.value) })}
              style={{ width: '100%' }} />
            <span>Border</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min={0} max={20} step={1} value={el.borderWidth || 0}
                onChange={(e) => handleUpdate({ borderWidth: Math.max(0, Number(e.target.value)) })}
                style={{ width: 48, background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '2px 6px', fontSize: 11, boxSizing: 'border-box' }} />
              <span style={{ fontSize: 10, color: theme.textMuted }}>px</span>
              <input type="color" value={el.borderColor || '#000000'}
                onChange={(e) => handleUpdate({ borderColor: e.target.value })}
                style={{ width: 24, height: 20, border: theme.borderLight, borderRadius: theme.radius, padding: 0, cursor: 'pointer', background: 'none' }} />
            </div>
            <span>Closed</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={el.closed}
                onChange={(e) => handleUpdate({ closed: e.target.checked })} />
              <span style={{ fontSize: 10, color: theme.textMuted }}>Loop path</span>
            </label>
          </>
        )}

        {/* Tint */}
        <span>Tint</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="color"
            value={('tint' in el ? el.tint : null) ?? '#ffffff'}
            onChange={(e) => updateElement(el.id, { tint: e.target.value } as any)}
            style={{ width: 32, height: 24, padding: 0, border: theme.borderLight, borderRadius: theme.radius, background: 'none', cursor: 'pointer' }}
          />
          {'tint' in el && el.tint && (
            <button
              onClick={() => handleUpdate({ tint: null })}
              style={{ background: theme.surface, color: theme.textMuted, border: 'none', borderRadius: theme.radius, padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Opacity */}
        <span>Opacity</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="range"
            min={0}
            max={100}
            value={opacityPct}
            onChange={(e) => updateElement(el.id, { opacity: Number(e.target.value) / 100 })}
            onMouseUp={() => useHistoryStore.getState().captureSnapshot()}
            style={{ flex: 1 }}
          />
          <span style={{ color: theme.text, width: 30, textAlign: 'right' }}>{opacityPct}%</span>
        </div>

        {/* Layer */}
        <span>Layer</span>
        <select
          value={el.layerId}
          onChange={(e) => handleUpdate({ layerId: e.target.value })}
          style={{ background: theme.surface, color: theme.text, border: theme.borderLight, borderRadius: theme.radius, padding: '3px 6px', fontSize: 11 }}
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>{layer.name}</option>
          ))}
        </select>
      </div>

      {/* Z-order controls */}
      <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
        <button onClick={() => { useHistoryStore.getState().captureSnapshot(); useMapStore.getState().bringToFront(el.id); }}
          style={{ flex: 1, background: theme.surface, color: theme.textMuted, border: 'none', borderRadius: theme.radius, padding: '3px 0', cursor: 'pointer', fontSize: 9 }} title="Bring to front">⬆⬆</button>
        <button onClick={() => { useHistoryStore.getState().captureSnapshot(); useMapStore.getState().bringForward(el.id); }}
          style={{ flex: 1, background: theme.surface, color: theme.textMuted, border: 'none', borderRadius: theme.radius, padding: '3px 0', cursor: 'pointer', fontSize: 9 }} title="Bring forward">⬆</button>
        <button onClick={() => { useHistoryStore.getState().captureSnapshot(); useMapStore.getState().sendBackward(el.id); }}
          style={{ flex: 1, background: theme.surface, color: theme.textMuted, border: 'none', borderRadius: theme.radius, padding: '3px 0', cursor: 'pointer', fontSize: 9 }} title="Send backward">⬇</button>
        <button onClick={() => { useHistoryStore.getState().captureSnapshot(); useMapStore.getState().sendToBack(el.id); }}
          style={{ flex: 1, background: theme.surface, color: theme.textMuted, border: 'none', borderRadius: theme.radius, padding: '3px 0', cursor: 'pointer', fontSize: 9 }} title="Send to back">⬇⬇</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button
          onClick={() => {
            useHistoryStore.getState().captureSnapshot();
            const cellSize = useMapStore.getState().grid.cellSize;
            const newIds = useMapStore.getState().duplicateElements([el.id], { x: cellSize, y: cellSize });
            useEditorStore.getState().select(newIds);
          }}
          style={{ flex: 1, background: theme.surface, color: theme.text, border: 'none', borderRadius: theme.radius, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Duplicate
        </button>
        <button
          onClick={() => {
            useHistoryStore.getState().captureSnapshot();
            removeElement(el.id);
            useEditorStore.getState().deselect();
          }}
          style={{ flex: 1, background: theme.danger, color: theme.bg, border: 'none', borderRadius: theme.radius, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Delete
        </button>
      </div>
      </div>
    </div>
  );
}
