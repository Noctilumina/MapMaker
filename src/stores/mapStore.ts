import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MapElement, TileElement, PolygonElement, PathElement, LightSource, Layer, GridConfig, AssetDef, Group } from '../types';
import { DEFAULT_GRID, DEFAULT_LAYERS } from '../types';

export type ElementInput =
  | Omit<TileElement, 'id'>
  | Omit<PolygonElement, 'id'>
  | Omit<PathElement, 'id'>
  | Omit<LightSource, 'id'>;

interface MapState {
  id: string;
  name: string;
  version: number;
  grid: GridConfig;
  layers: Layer[];
  elements: MapElement[];
  assets: Record<string, AssetDef>;
  groups: Group[];

  addElement: (input: ElementInput) => void;
  moveElement: (id: string, x: number, y: number) => void;
  movePolygon: (id: string, deltaX: number, deltaY: number) => void;
  movePath: (id: string, deltaX: number, deltaY: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<MapElement>) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  registerAsset: (id: string, asset: AssetDef) => void;
  importAsset: (name: string, src: string, category: string, gridSize: [number, number]) => string;
  removeAsset: (id: string) => void;
  setAssetHull: (id: string, hull: number[]) => void;
  addGroup: (name: string, parentId?: string | null) => string;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  setElementGroup: (elementId: string, groupId: string | null) => void;
  duplicateElements: (ids: string[], offset: { x: number; y: number }) => string[];
  duplicateGroup: (id: string, offset: { x: number; y: number }) => void;
  setGrid: (updates: Partial<GridConfig>) => void;
  setName: (name: string) => void;
  loadProject: (project: {
    id: string; name: string; version: number; grid: GridConfig;
    layers: Layer[]; elements: MapElement[];
    assets: Record<string, AssetDef>; groups: Group[];
  }) => void;
  reset: () => void;
}

const initialState = {
  id: uuidv4(),
  name: 'Untitled Map',
  version: 2,
  grid: { ...DEFAULT_GRID },
  layers: DEFAULT_LAYERS.map(l => ({ ...l })),
  elements: [] as MapElement[],
  assets: {} as Record<string, AssetDef>,
  groups: [] as Group[],
};

function getDescendantGroupIds(groups: Group[], parentId: string): string[] {
  const children = groups.filter(g => g.parentId === parentId);
  return children.flatMap(c => [c.id, ...getDescendantGroupIds(groups, c.id)]);
}

export const useMapStore = create<MapState>((set, get) => ({
  ...initialState,

  addElement: (input) =>
    set((state) => ({
      elements: [...state.elements, { ...input, id: uuidv4() } as MapElement],
    })),

  moveElement: (id, x, y) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    })),

  movePolygon: (id, deltaX, deltaY) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id && el.type === 'polygon'
          ? {
              ...el,
              points: el.points.map((v, i) => i % 2 === 0 ? v + deltaX : v + deltaY),
              innerWalls: (el.innerWalls || []).map(w => ({
                ...w,
                x1: w.x1 + deltaX, y1: w.y1 + deltaY,
                x2: w.x2 + deltaX, y2: w.y2 + deltaY,
              })),
            }
          : el
      ),
    })),

  movePath: (id, deltaX, deltaY) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id && el.type === 'path'
          ? {
              ...el,
              pathPoints: el.pathPoints.map(pt => ({
                ...pt,
                x: pt.x + deltaX,
                y: pt.y + deltaY,
              })),
            }
          : el
      ),
    })),

  bringToFront: (id) =>
    set((state) => {
      const el = state.elements.find(e => e.id === id);
      if (!el) return state;
      return { elements: [...state.elements.filter(e => e.id !== id), el] };
    }),

  sendToBack: (id) =>
    set((state) => {
      const el = state.elements.find(e => e.id === id);
      if (!el) return state;
      return { elements: [el, ...state.elements.filter(e => e.id !== id)] };
    }),

  bringForward: (id) =>
    set((state) => {
      const idx = state.elements.findIndex(e => e.id === id);
      if (idx < 0 || idx >= state.elements.length - 1) return state;
      const els = [...state.elements];
      [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
      return { elements: els };
    }),

  sendBackward: (id) =>
    set((state) => {
      const idx = state.elements.findIndex(e => e.id === id);
      if (idx <= 0) return state;
      const els = [...state.elements];
      [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
      return { elements: els };
    }),

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
    })),

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } as MapElement : el
      ),
    })),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  registerAsset: (id, asset) =>
    set((state) => ({
      assets: { ...state.assets, [id]: asset },
    })),

  importAsset: (name, src, category, gridSize) => {
    const id = uuidv4();
    set((state) => ({
      assets: {
        ...state.assets,
        [id]: { src, category, gridSize, name, source: 'imported' as const },
      },
    }));
    return id;
  },

  removeAsset: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.assets;
      return {
        assets: rest,
        elements: state.elements.filter((el) => !('assetId' in el) || el.assetId !== id),
      };
    }),

  setAssetHull: (id, hull) =>
    set((state) => ({
      assets: {
        ...state.assets,
        [id]: { ...state.assets[id], occlusionHull: hull },
      },
    })),

  addGroup: (name, parentId = null) => {
    const id = uuidv4();
    set((state) => ({
      groups: [...state.groups, {
        id, name, parentId: parentId ?? null,
        collapsed: false, visible: true, locked: false,
      }],
    }));
    return id;
  },

  removeGroup: (id) =>
    set((state) => {
      const group = state.groups.find(g => g.id === id);
      if (!group) return state;
      const parentId = group.parentId;
      return {
        groups: state.groups
          .filter(g => g.id !== id)
          .map(g => g.parentId === id ? { ...g, parentId } : g),
        elements: state.elements.map(el =>
          el.groupId === id ? { ...el, groupId: parentId } : el
        ),
      };
    }),

  updateGroup: (id, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),

  setElementGroup: (elementId, groupId) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === elementId ? { ...el, groupId } : el
      ),
    })),

  duplicateElements: (ids, offset) => {
    const state = get();
    const newIds: string[] = [];
    const newElements = ids.map(id => {
      const el = state.elements.find(e => e.id === id);
      if (!el) return null;
      const newId = uuidv4();
      newIds.push(newId);
      if (el.type === 'polygon') {
        return {
          ...el,
          id: newId,
          groupId: null,
          points: el.points.map((v, i) => i % 2 === 0 ? v + offset.x : v + offset.y),
        };
      }
      if (el.type === 'path') {
        return {
          ...el,
          id: newId,
          groupId: null,
          pathPoints: el.pathPoints.map(pt => ({
            ...pt,
            x: pt.x + offset.x,
            y: pt.y + offset.y,
          })),
        };
      }
      return {
        ...el,
        id: newId,
        groupId: null,
        x: el.x + offset.x,
        y: el.y + offset.y,
      };
    }).filter(Boolean);

    set((s) => ({
      elements: [...s.elements, ...newElements] as typeof s.elements,
    }));
    return newIds;
  },

  duplicateGroup: (id, offset) => {
    const state = get();
    const allGroupIds = [id, ...getDescendantGroupIds(state.groups, id)];
    const groupIdMap: Record<string, string> = {};
    allGroupIds.forEach(gid => { groupIdMap[gid] = uuidv4(); });

    const newGroups: Group[] = allGroupIds.map(gid => {
      const original = state.groups.find(g => g.id === gid)!;
      return {
        ...original,
        id: groupIdMap[gid],
        parentId: original.parentId && groupIdMap[original.parentId]
          ? groupIdMap[original.parentId]
          : original.parentId,
        name: gid === id ? `${original.name} (copy)` : original.name,
      };
    });

    const elementsInGroup = state.elements.filter(
      el => el.groupId && allGroupIds.includes(el.groupId)
    );
    const newElements = elementsInGroup.map(el => {
      const base = { ...el, id: uuidv4(), groupId: el.groupId ? groupIdMap[el.groupId] : null };
      if (el.type === 'polygon') {
        return { ...base, points: el.points.map((v, i) => i % 2 === 0 ? v + offset.x : v + offset.y) };
      }
      if (el.type === 'path') {
        return { ...base, pathPoints: el.pathPoints.map(pt => ({ ...pt, x: pt.x + offset.x, y: pt.y + offset.y })) };
      }
      return { ...base, x: el.x + offset.x, y: el.y + offset.y };
    }) as MapElement[];

    set((s) => ({
      groups: [...s.groups, ...newGroups],
      elements: [...s.elements, ...newElements],
    }));
  },

  setGrid: (updates) =>
    set((state) => ({
      grid: { ...state.grid, ...updates },
    })),

  setName: (name) => set({ name }),

  loadProject: (project) =>
    set({
      id: project.id,
      name: project.name,
      version: project.version,
      grid: project.grid,
      layers: project.layers,
      elements: project.elements,
      assets: project.assets,
      groups: project.groups,
    }),

  reset: () =>
    set({
      ...initialState,
      id: uuidv4(),
      layers: DEFAULT_LAYERS.map(l => ({ ...l })),
      elements: [],
      assets: {},
      groups: [],
    }),
}));
