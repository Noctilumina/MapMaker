import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MapElement, TileElement, PolygonElement, PathElement, LightSource, Layer, GridConfig, AssetDef, Group } from '../types';
import { DEFAULT_GRID, DEFAULT_LAYERS } from '../types';

export type ElementInput =
  | Omit<TileElement, 'id'>
  | Omit<PolygonElement, 'id'>
  | Omit<PathElement, 'id'>
  | Omit<LightSource, 'id'>;

export interface MapState {
  id: string;
  name: string;
  version: number;
  grid: GridConfig;
  layers: Layer[];
  elements: MapElement[];
  assets: Record<string, AssetDef>;
  groups: Group[];

  addElement: (input: ElementInput) => void;
  addElements: (inputs: ElementInput[]) => void;
  replaceAsset: (layerId: string, sourceAssetId: string, targetAssetId: string) => void;
  moveElement: (id: string, x: number, y: number) => void;
  moveElements: (moves: Array<{ id: string; dx: number; dy: number }>) => void;
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
    set((state) => {
      const maxZ = state.elements.reduce((m, e) => Math.max(m, e.zIndex ?? 0), -1);
      const zIndex = (input as any).zIndex !== undefined ? (input as any).zIndex : maxZ + 1;
      return { elements: [...state.elements, { ...input, id: uuidv4(), zIndex } as MapElement] };
    }),

  addElements: (inputs) =>
    set((state) => {
      let maxZ = state.elements.reduce((m, e) => Math.max(m, e.zIndex ?? 0), -1);
      const newElements = inputs.map(input => {
        const zIndex = (input as any).zIndex !== undefined ? (input as any).zIndex : ++maxZ;
        return { ...input, id: uuidv4(), zIndex } as MapElement;
      });
      return { elements: [...state.elements, ...newElements] };
    }),

  replaceAsset: (layerId, sourceAssetId, targetAssetId) =>
    set((state) => ({
      elements: state.elements.map(el =>
        el.layerId === layerId && el.type === 'tile' && el.assetId === sourceAssetId
          ? { ...el, assetId: targetAssetId }
          : el
      ),
    })),

  moveElement: (id, x, y) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    })),

  moveElements: (moves) =>
    set((state) => {
      const moveMap = new Map(moves.map(m => [m.id, m]));
      return {
        elements: state.elements.map(el => {
          const m = moveMap.get(el.id);
          if (!m) return el;
          if (el.type === 'polygon') {
            return {
              ...el,
              points: el.points.map((v, i) => i % 2 === 0 ? v + m.dx : v + m.dy),
              innerWalls: (el.innerWalls || []).map(w => ({
                ...w, x1: w.x1 + m.dx, y1: w.y1 + m.dy, x2: w.x2 + m.dx, y2: w.y2 + m.dy,
              })),
            };
          }
          if (el.type === 'path') {
            return {
              ...el,
              pathPoints: el.pathPoints.map(pt => ({ ...pt, x: pt.x + m.dx, y: pt.y + m.dy })),
            };
          }
          return { ...el, x: el.x + m.dx, y: el.y + m.dy };
        }),
      };
    }),

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
      const maxZ = state.elements.reduce((m, e) => Math.max(m, e.zIndex ?? 0), -1);
      return { elements: state.elements.map(e => e.id === id ? { ...e, zIndex: maxZ + 1 } : e) };
    }),

  sendToBack: (id) =>
    set((state) => {
      const el = state.elements.find(e => e.id === id);
      if (!el) return state;
      const minZ = state.elements.reduce((m, e) => Math.min(m, e.zIndex ?? 0), Infinity);
      return { elements: state.elements.map(e => e.id === id ? { ...e, zIndex: minZ - 1 } : e) };
    }),

  bringForward: (id) =>
    set((state) => {
      const el = state.elements.find(e => e.id === id);
      if (!el) return state;
      const myZ = el.zIndex ?? 0;
      // Find element with next higher zIndex
      const above = state.elements
        .filter(e => e.id !== id && (e.zIndex ?? 0) > myZ)
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))[0];
      if (!above) return state;
      const aboveZ = above.zIndex ?? 0;
      return {
        elements: state.elements.map(e =>
          e.id === id ? { ...e, zIndex: aboveZ } :
          e.id === above.id ? { ...e, zIndex: myZ } : e
        ),
      };
    }),

  sendBackward: (id) =>
    set((state) => {
      const el = state.elements.find(e => e.id === id);
      if (!el) return state;
      const myZ = el.zIndex ?? 0;
      // Find element with next lower zIndex
      const below = state.elements
        .filter(e => e.id !== id && (e.zIndex ?? 0) < myZ)
        .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))[0];
      if (!below) return state;
      const belowZ = below.zIndex ?? 0;
      return {
        elements: state.elements.map(e =>
          e.id === id ? { ...e, zIndex: belowZ } :
          e.id === below.id ? { ...e, zIndex: myZ } : e
        ),
      };
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

    // Remap group IDs so pasted elements preserve their grouping relative to each other.
    // Collect all groupIds referenced by the selected elements, then walk up parent chains
    // so nested group hierarchy within the selection is also preserved.
    const directGroupIds = new Set(
      ids.map(id => state.elements.find(e => e.id === id)?.groupId).filter((g): g is string => !!g)
    );
    const allGroupIds = new Set(directGroupIds);
    const walkParents = (gid: string) => {
      const g = state.groups.find(g => g.id === gid);
      if (g?.parentId && !allGroupIds.has(g.parentId)) {
        allGroupIds.add(g.parentId);
        walkParents(g.parentId);
      }
    };
    directGroupIds.forEach(walkParents);

    const groupIdMap = new Map<string, string>();
    allGroupIds.forEach(gid => groupIdMap.set(gid, uuidv4()));

    const newGroups: Group[] = [];
    allGroupIds.forEach(gid => {
      const original = state.groups.find(g => g.id === gid);
      if (!original) return;
      newGroups.push({
        ...original,
        id: groupIdMap.get(gid)!,
        parentId: original.parentId && groupIdMap.has(original.parentId)
          ? groupIdMap.get(original.parentId)!
          : null,
      });
    });

    const newElements = ids.map(id => {
      const el = state.elements.find(e => e.id === id);
      if (!el) return null;
      const newId = uuidv4();
      newIds.push(newId);
      const newGroupId = el.groupId && groupIdMap.has(el.groupId)
        ? groupIdMap.get(el.groupId)!
        : null;
      if (el.type === 'polygon') {
        return {
          ...el,
          id: newId,
          groupId: newGroupId,
          points: el.points.map((v, i) => i % 2 === 0 ? v + offset.x : v + offset.y),
        };
      }
      if (el.type === 'path') {
        return {
          ...el,
          id: newId,
          groupId: newGroupId,
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
        groupId: newGroupId,
        x: el.x + offset.x,
        y: el.y + offset.y,
      };
    }).filter(Boolean);

    set((s) => ({
      elements: [...s.elements, ...newElements] as typeof s.elements,
      groups: [...s.groups, ...newGroups],
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
      // Migrate legacy elements without zIndex: assign array position so render order is preserved
      elements: project.elements.map((el, idx) =>
        el.zIndex !== undefined ? el : { ...el, zIndex: idx }
      ),
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
