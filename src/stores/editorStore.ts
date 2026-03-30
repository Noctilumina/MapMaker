import { create } from 'zustand';
import type { Viewport } from '../types';

export type ToolName = 'select' | 'stamp' | 'eraser' | 'pan' | 'polygon' | 'path';
export type PendingShape = 'circle' | 'rect' | 'hexagon' | null;

interface EditorState {
  activeTool: ToolName;
  activeLayerId: string;
  selectedElementIds: string[];
  stampAssetId: string | null;
  stampRotation: number;
  viewport: Viewport;
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  snapToGrid: boolean;
  renamingGroupId: string | null;
  pendingShape: PendingShape;
  pendingOpening: 'door' | 'window' | null;
  pendingInnerWall: boolean;

  setTool: (tool: ToolName) => void;
  setActiveLayer: (id: string) => void;
  select: (ids: string[]) => void;
  deselect: () => void;
  setStampAsset: (assetId: string) => void;
  setStampRotation: (rotation: number) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setSelectionBox: (box: { x: number; y: number; width: number; height: number } | null) => void;
  setSnapToGrid: (snap: boolean) => void;
  setRenamingGroupId: (id: string | null) => void;
  setPendingShape: (shape: PendingShape) => void;
  setPendingOpening: (type: 'door' | 'window' | null) => void;
  setPendingInnerWall: (active: boolean) => void;
  reset: () => void;
}

const initialState = {
  activeTool: 'select' as ToolName,
  activeLayerId: 'floor',
  selectedElementIds: [] as string[],
  stampAssetId: null as string | null,
  stampRotation: 0,
  viewport: { zoom: 0.25, panX: 0, panY: 0 },
  selectionBox: null as { x: number; y: number; width: number; height: number } | null,
  snapToGrid: true,
  renamingGroupId: null as string | null,
  pendingShape: null as PendingShape,
  pendingOpening: null as 'door' | 'window' | null,
  pendingInnerWall: false,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setTool: (tool) => set({ activeTool: tool }),
  setActiveLayer: (id) => set({ activeLayerId: id }),
  select: (ids) => set({ selectedElementIds: ids }),
  deselect: () => set({ selectedElementIds: [] }),
  setStampAsset: (assetId) => set({ stampAssetId: assetId }),
  setStampRotation: (rotation) => set({ stampRotation: rotation }),
  setViewport: (viewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    })),
  setSelectionBox: (box) => set({ selectionBox: box }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setRenamingGroupId: (id) => set({ renamingGroupId: id }),
  setPendingShape: (shape) => set({ pendingShape: shape }),
  setPendingOpening: (type) => set({ pendingOpening: type }),
  setPendingInnerWall: (active) => set({ pendingInnerWall: active }),
  reset: () => set({ ...initialState, selectionBox: null, snapToGrid: true, renamingGroupId: null, pendingShape: null, pendingOpening: null, pendingInnerWall: false }),
}));
