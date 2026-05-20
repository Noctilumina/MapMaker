import { create } from 'zustand';
import type { Viewport } from '../types';

export type ToolName = 'select' | 'stamp' | 'eraser' | 'pan' | 'polygon' | 'path' | 'light' | 'rect-stamp' | 'line-stamp' | 'scatter' | 'replace' | 'fill' | 'copy-stamp' | 'measure' | 'random-stamp';
export type PendingShape = 'circle' | 'rect' | 'hexagon' | null;

export interface StampTemplateEntry {
  dx: number;
  dy: number;
  assetId: string;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  tint: string | null;
  opacity: number;
}

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
  clipboardElementIds: string[] | null;
  scatterAssetIds: string[];
  replaceSourceAssetId: string | null;
  replaceTargetAssetId: string | null;
  stampTemplate: StampTemplateEntry[] | null;
  lineStampAxisLock: 'free' | 'h' | 'v';
  mirrorSymmetry: boolean;
  mirrorAxis: 'x' | 'y' | 'both';
  mirrorLineX: number | null;
  mirrorLineY: number | null;
  showHotkeys: boolean;
  measureStart: { x: number; y: number } | null;
  measureEnd: { x: number; y: number } | null;
  randomStampAssetIds: string[];
  randomStampShuffleMode: 'bag' | 'pure' | 'round-robin';
  randomStampRotationMode: 'full' | 'cardinal' | 'none';
  randomStampScaleEnabled: boolean;
  randomStampScaleRange: number;

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
  setClipboard: (ids: string[]) => void;
  toggleScatterAsset: (assetId: string) => void;
  setReplaceSource: (assetId: string | null) => void;
  setReplaceTarget: (assetId: string | null) => void;
  setStampTemplate: (template: StampTemplateEntry[] | null) => void;
  setLineStampAxisLock: (lock: 'free' | 'h' | 'v') => void;
  setMirrorSymmetry: (enabled: boolean) => void;
  setMirrorAxis: (axis: 'x' | 'y' | 'both') => void;
  setMirrorLineX: (x: number | null) => void;
  setMirrorLineY: (y: number | null) => void;
  setShowHotkeys: (show: boolean) => void;
  setMeasureStart: (pos: { x: number; y: number } | null) => void;
  setMeasureEnd: (pos: { x: number; y: number } | null) => void;
  toggleRandomStampAsset: (assetId: string) => void;
  setRandomStampShuffleMode: (mode: 'bag' | 'pure' | 'round-robin') => void;
  setRandomStampRotationMode: (mode: 'full' | 'cardinal' | 'none') => void;
  setRandomStampScaleEnabled: (enabled: boolean) => void;
  setRandomStampScaleRange: (range: number) => void;
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
  clipboardElementIds: null as string[] | null,
  scatterAssetIds: [] as string[],
  replaceSourceAssetId: null as string | null,
  replaceTargetAssetId: null as string | null,
  stampTemplate: null as StampTemplateEntry[] | null,
  lineStampAxisLock: 'free' as 'free' | 'h' | 'v',
  mirrorSymmetry: false,
  mirrorAxis: 'x' as 'x' | 'y' | 'both',
  mirrorLineX: null as number | null,
  mirrorLineY: null as number | null,
  showHotkeys: false,
  measureStart: null as { x: number; y: number } | null,
  measureEnd: null as { x: number; y: number } | null,
  randomStampAssetIds: [] as string[],
  randomStampShuffleMode: 'bag' as 'bag' | 'pure' | 'round-robin',
  randomStampRotationMode: 'full' as 'full' | 'cardinal' | 'none',
  randomStampScaleEnabled: false,
  randomStampScaleRange: 25,
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
  setClipboard: (ids) => set({ clipboardElementIds: ids }),
  toggleScatterAsset: (assetId) => set((state) => ({
    scatterAssetIds: state.scatterAssetIds.includes(assetId)
      ? state.scatterAssetIds.filter(id => id !== assetId)
      : [...state.scatterAssetIds, assetId],
  })),
  setReplaceSource: (assetId) => set({ replaceSourceAssetId: assetId }),
  setReplaceTarget: (assetId) => set({ replaceTargetAssetId: assetId }),
  setStampTemplate: (template) => set({ stampTemplate: template }),
  setLineStampAxisLock: (lock) => set({ lineStampAxisLock: lock }),
  setMirrorSymmetry: (enabled) => set({ mirrorSymmetry: enabled }),
  setMirrorAxis: (axis) => set({ mirrorAxis: axis }),
  setMirrorLineX: (x) => set({ mirrorLineX: x }),
  setMirrorLineY: (y) => set({ mirrorLineY: y }),
  setShowHotkeys: (show) => set({ showHotkeys: show }),
  setMeasureStart: (pos) => set({ measureStart: pos }),
  setMeasureEnd: (pos) => set({ measureEnd: pos }),
  toggleRandomStampAsset: (assetId) => set((state) => ({
    randomStampAssetIds: state.randomStampAssetIds.includes(assetId)
      ? state.randomStampAssetIds.filter(id => id !== assetId)
      : [...state.randomStampAssetIds, assetId],
  })),
  setRandomStampShuffleMode: (mode) => set({ randomStampShuffleMode: mode }),
  setRandomStampRotationMode: (mode) => set({ randomStampRotationMode: mode }),
  setRandomStampScaleEnabled: (enabled) => set({ randomStampScaleEnabled: enabled }),
  setRandomStampScaleRange: (range) => set({ randomStampScaleRange: range }),
  reset: () => set({ ...initialState, selectionBox: null, snapToGrid: true, renamingGroupId: null, pendingShape: null, pendingOpening: null, pendingInnerWall: false }),
}));
