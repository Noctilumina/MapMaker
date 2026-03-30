import { useState, useMemo, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { getManifestEntries } from '../../utils/assetLoader';
import ImportDialog from '../dialogs/ImportDialog';

import type { ToolName } from '../../stores/editorStore';

const CATEGORIES = ['all', 'floors', 'walls', 'furniture', 'props', 'doors'];
const TEXTURE_CATEGORIES = ['all', 'drawn', 'grass', 'ground', 'rock', 'stone-wall', 'wood', 'paving', 'roof', 'misc', 'numbered'];
const OBJECT_CATEGORIES = [
  'all', 'furniture', 'characters', 'street', 'crates', 'trash',
  'security', 'tech', 'vehicles', 'buildings', 'nature',
  'wall-elements', 'floor-elements', 'doors-hatches', 'railings-stairs',
  'dungeon-tiles', 'rugs-decor', 'lighting', 'rubble', 'gore',
  'graffiti', 'scrap-debris', 'Door Tiles', 'Stair Tiles',
  'Special Rooms', 'Structures', 'Bloody Assets',
];

interface TextureEntry {
  id: string;
  name: string;
  category: string;
  path: string;
}

interface ObjectEntry {
  id: string;
  name: string;
  category: string;
  path: string;
  gridSize: [number, number];
}

type Tab = 'presets' | 'textures' | 'objects' | 'imported' | 'map';

interface PendingImport {
  file: File;
  previewSrc: string;
}

export default function AssetBrowser() {
  const [tab, setTab] = useState<Tab>('presets');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [textures, setTextures] = useState<TextureEntry[]>([]);
  const [texCategory, setTexCategory] = useState('all');
  const [objects, setObjects] = useState<ObjectEntry[]>([]);
  const [objCategory, setObjCategory] = useState('all');
  const [objVibe, setObjVibe] = useState('all');
  const [tagMap, setTagMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch('/textures/manifest.json')
      .then(r => r.json())
      .then(data => setTextures(data.textures || []))
      .catch(() => {});
    fetch('/assets/manifest.json')
      .then(r => r.json())
      .then(data => setObjects(data.assets || []))
      .catch(() => {});
    fetch('/assets/tags.json')
      .then(r => r.json())
      .then((tags: Array<{ rel_path: string; vibe_tags?: string[] }>) => {
        const map: Record<string, string[]> = {};
        tags.forEach(t => { map[t.rel_path] = t.vibe_tags || ['generic']; });
        setTagMap(map);
      })
      .catch(() => {});
  }, []);

  const stampAssetId = useEditorStore((s) => s.stampAssetId);
  const setStampAsset = useEditorStore((s) => s.setStampAsset);
  const setTool = useEditorStore((s) => s.setTool);
  const assets = useMapStore((s) => s.assets);
  const elements = useMapStore((s) => s.elements);
  const removeAsset = useMapStore((s) => s.removeAsset);

  // Preset entries (manifest-based)
  const presetEntries = useMemo(() => {
    let items = getManifestEntries();
    if (category !== 'all') items = items.filter((e) => e.category === category);
    if (search) {
      const lower = search.toLowerCase();
      items = items.filter((e) => e.name.toLowerCase().includes(lower));
    }
    return items;
  }, [category, search]);

  // Imported assets
  const importedEntries = useMemo(() => {
    return Object.entries(assets)
      .filter(([, asset]) => asset.source === 'imported')
      .filter(([, asset]) => !search || asset.name.toLowerCase().includes(search.toLowerCase()));
  }, [assets, search]);

  // Map assets (all assets used in current map with usage counts)
  const mapAssetEntries = useMemo(() => {
    const usageMap: Record<string, number> = {};
    for (const el of elements) {
      usageMap[el.assetId] = (usageMap[el.assetId] ?? 0) + 1;
    }
    return Object.entries(usageMap)
      .map(([id, count]) => ({ id, count, asset: assets[id] }))
      .filter((entry) => entry.asset != null)
      .filter((entry) => !search || entry.asset.name.toLowerCase().includes(search.toLowerCase()));
  }, [assets, elements, search]);

  const handleSelect = (assetId: string) => {
    setStampAsset(assetId);
    setTool('stamp' as ToolName);
  };

  const handleTextureSelect = (tex: TextureEntry) => {
    const assetId = `texture:${tex.id}`;
    // Register the texture as an asset if not already registered
    if (!assets[assetId]) {
      useMapStore.getState().registerAsset(assetId, {
        src: tex.path,
        category: 'floors',
        gridSize: [1, 1],
        name: tex.name,
        source: 'preset',
      });
    }
    handleSelect(assetId);
  };

  const handleObjectSelect = (obj: ObjectEntry) => {
    const assetId = `object:${obj.id}`;
    if (!assets[assetId]) {
      useMapStore.getState().registerAsset(assetId, {
        src: obj.path,
        category: obj.category,
        gridSize: obj.gridSize,
        name: obj.name,
        source: 'preset',
      });
    }
    handleSelect(assetId);
  };

  const filteredObjects = useMemo(() => {
    let items = objects;
    if (objCategory !== 'all') items = items.filter(o => o.category === objCategory);
    if (objVibe !== 'all') {
      items = items.filter(o => {
        const relPath = o.path.replace('/assets/', '');
        const tags = tagMap[relPath] || ['generic'];
        return tags.includes(objVibe);
      });
    }
    if (search) {
      const lower = search.toLowerCase();
      items = items.filter(o => o.name.toLowerCase().includes(lower));
    }
    return items;
  }, [objects, objCategory, objVibe, search, tagMap]);

  const filteredTextures = useMemo(() => {
    let items = textures;
    if (texCategory !== 'all') items = items.filter(t => t.category === texCategory);
    if (search) {
      const lower = search.toLowerCase();
      items = items.filter(t => t.name.toLowerCase().includes(lower));
    }
    return items;
  }, [textures, texCategory, search]);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPending({ file, previewSrc: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  };

  const handleImportConfirm = (opts: { name: string; category: string; gridSize: [number, number] }) => {
    if (!pending) return;
    useMapStore.getState().importAsset(opts.name, pending.previewSrc, opts.category, opts.gridSize);
    setPending(null);
    setTab('imported');
  };

  const tabStyle = (t: Tab) => ({
    flex: 1,
    background: tab === t ? '#313244' : 'transparent',
    color: tab === t ? '#cdd6f4' : '#6c7086',
    border: 'none',
    borderBottom: tab === t ? '2px solid #cba6f7' : '2px solid transparent',
    padding: '6px 4px',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'color 0.15s',
  } as React.CSSProperties);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFileSelect(file);
      }}
    >
      {/* Header: search + import button */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, background: '#313244', border: '1px solid #45475a', borderRadius: 4, padding: '5px 8px', color: '#cdd6f4', fontSize: 12, outline: 'none' }}
        />
        <button
          onClick={handleImportClick}
          title="Import image asset"
          style={{ background: '#313244', color: '#a6e3a1', border: '1px solid #45475a', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          + Import
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #313244' }}>
        <button style={tabStyle('presets')} onClick={() => setTab('presets')}>Presets</button>
        <button style={tabStyle('objects')} onClick={() => setTab('objects')}>
          Objects{objects.length > 0 ? ` (${objects.length})` : ''}
        </button>
        <button style={tabStyle('textures')} onClick={() => setTab('textures')}>
          Textures
        </button>
        <button style={tabStyle('imported')} onClick={() => setTab('imported')}>
          Imported{importedEntries.length > 0 ? ` (${importedEntries.length})` : ''}
        </button>
        <button style={tabStyle('map')} onClick={() => setTab('map')}>
          Map{mapAssetEntries.length > 0 ? ` (${mapAssetEntries.length})` : ''}
        </button>
      </div>

      {/* Presets tab: category filter + grid */}
      {tab === 'presets' && (
        <>
          <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{ background: category === cat ? '#cba6f7' : '#313244', color: category === cat ? '#1e1e2e' : '#a6adc8', border: 'none', borderRadius: 10, padding: '2px 8px', fontSize: 11, cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, alignContent: 'start' }}>
            {presetEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleSelect(entry.id)}
                title={entry.name}
                style={{ aspectRatio: '1', background: entry.color, border: stampAssetId === entry.id ? '2px solid #cba6f7' : '2px solid transparent', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 2 }}
              >
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{entry.name}</span>
              </button>
            ))}
            {presetEntries.length === 0 && (
              <div style={{ gridColumn: '1/-1', color: '#6c7086', fontSize: 11, padding: '8px 0', textAlign: 'center' }}>No results</div>
            )}
          </div>
        </>
      )}

      {/* Objects tab */}
      {tab === 'objects' && (
        <>
          <div style={{ padding: '4px 12px', display: 'flex', gap: 3, borderBottom: '1px solid #313244' }}>
            {['all', 'fantasy', 'modern', 'sci-fi', 'generic'].map((v) => (
              <button key={v} onClick={() => setObjVibe(v)}
                style={{ background: objVibe === v ? '#f9e2af' : '#313244', color: objVibe === v ? '#1e1e2e' : '#a6adc8', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontWeight: objVibe === v ? 'bold' : 'normal', textTransform: 'capitalize' }}>
                {v}
              </button>
            ))}
          </div>
          <div style={{ padding: '4px 12px', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {OBJECT_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setObjCategory(cat)}
                style={{ background: objCategory === cat ? '#cba6f7' : '#313244', color: objCategory === cat ? '#1e1e2e' : '#a6adc8', border: 'none', borderRadius: 8, padding: '1px 6px', fontSize: 10, cursor: 'pointer', textTransform: 'capitalize' }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, alignContent: 'start' }}>
            {filteredObjects.map((obj) => (
              <button key={obj.id} onClick={() => handleObjectSelect(obj)} title={`${obj.name} (${obj.gridSize[0]}x${obj.gridSize[1]})`}
                style={{ height: 80, border: stampAssetId === `object:${obj.id}` ? '2px solid #cba6f7' : '2px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 4, background: '#313244', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <img src={obj.path} alt={obj.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} loading="lazy" />
                <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 8, color: '#cdd6f4', background: 'rgba(0,0,0,0.6)', borderRadius: 2, padding: '0 3px', lineHeight: '14px' }}>{obj.gridSize[0]}x{obj.gridSize[1]}</span>
              </button>
            ))}
            {filteredObjects.length === 0 && (
              <div style={{ gridColumn: '1/-1', color: '#6c7086', fontSize: 11, padding: '8px 0', textAlign: 'center' }}>No objects found</div>
            )}
          </div>
        </>
      )}

      {/* Textures tab */}
      {tab === 'textures' && (
        <>
          <div style={{ padding: '6px 12px', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {TEXTURE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setTexCategory(cat)}
                style={{ background: texCategory === cat ? '#cba6f7' : '#313244', color: texCategory === cat ? '#1e1e2e' : '#a6adc8', border: 'none', borderRadius: 8, padding: '1px 6px', fontSize: 10, cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, alignContent: 'start' }}>
            {filteredTextures.map((tex) => (
              <button
                key={tex.id}
                onClick={() => handleTextureSelect(tex)}
                title={tex.name}
                style={{ aspectRatio: '1', border: stampAssetId === `texture:${tex.id}` ? '2px solid #cba6f7' : '2px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 0, overflow: 'hidden', background: '#313244' }}
              >
                <img src={tex.path} alt={tex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </button>
            ))}
            {filteredTextures.length === 0 && (
              <div style={{ gridColumn: '1/-1', color: '#6c7086', fontSize: 11, padding: '8px 0', textAlign: 'center' }}>No textures found</div>
            )}
          </div>
        </>
      )}

      {/* Imported tab */}
      {tab === 'imported' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
          {importedEntries.length === 0 ? (
            <div style={{ color: '#6c7086', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
              No imported assets yet.<br />
              <span style={{ color: '#a6adc8' }}>Use + Import or drag an image here.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, alignContent: 'start' }}>
              {importedEntries.map(([id, asset]) => (
                <div key={id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    onClick={() => handleSelect(id)}
                    title={asset.name}
                    style={{ height: 80, border: stampAssetId === id ? '2px solid #cba6f7' : '2px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 4, background: '#313244', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img src={asset.src} alt={asset.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ flex: 1, fontSize: 9, color: '#a6adc8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</span>
                    <button
                      onClick={() => removeAsset(id)}
                      title="Delete asset"
                      style={{ background: 'transparent', color: '#f38ba8', border: 'none', fontSize: 12, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Assets tab */}
      {tab === 'map' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
          {mapAssetEntries.length === 0 ? (
            <div style={{ color: '#6c7086', fontSize: 11, textAlign: 'center', marginTop: 16 }}>No assets placed on map yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, alignContent: 'start' }}>
              {mapAssetEntries.map(({ id, count, asset }) => (
                <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    onClick={() => handleSelect(id)}
                    title={asset.name}
                    style={{ height: 80, border: stampAssetId === id ? '2px solid #cba6f7' : '2px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 4, background: '#313244', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img src={asset.src} alt={asset.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                    <span style={{ position: 'absolute', top: 2, right: 3, fontSize: 9, color: '#cdd6f4', background: 'rgba(0,0,0,0.5)', borderRadius: 3, padding: '1px 3px' }}>×{count}</span>
                  </button>
                  <span style={{ fontSize: 9, color: '#a6adc8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import dialog */}
      {pending && (
        <ImportDialog
          file={pending.file}
          previewSrc={pending.previewSrc}
          onImport={handleImportConfirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
