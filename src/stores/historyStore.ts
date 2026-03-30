import { create } from 'zustand';
import { useMapStore } from './mapStore';
import { useEditorStore } from './editorStore';
import type { ToolName, PendingShape } from './editorStore';

interface MapSnapshot {
  id: string;
  name: string;
  version: number;
  grid: ReturnType<typeof useMapStore.getState>['grid'];
  layers: ReturnType<typeof useMapStore.getState>['layers'];
  elements: ReturnType<typeof useMapStore.getState>['elements'];
  assets: ReturnType<typeof useMapStore.getState>['assets'];
  groups: ReturnType<typeof useMapStore.getState>['groups'];
}

interface EditorSnapshot {
  activeTool: ToolName;
  activeLayerId: string;
  selectedElementIds: string[];
  stampAssetId: string | null;
  stampRotation: number;
  snapToGrid: boolean;
  pendingShape: PendingShape;
}

interface FullSnapshot {
  map: MapSnapshot;
  editor: EditorSnapshot;
}

const MAX_UNDO = 100;

function takeMapSnapshot(): MapSnapshot {
  const { id, name, version, grid, layers, elements, assets, groups } = useMapStore.getState();
  return JSON.parse(JSON.stringify({ id, name, version, grid, layers, elements, assets, groups }));
}

function takeEditorSnapshot(): EditorSnapshot {
  const { activeTool, activeLayerId, selectedElementIds, stampAssetId, stampRotation, snapToGrid, pendingShape } = useEditorStore.getState();
  return {
    activeTool,
    activeLayerId,
    selectedElementIds: [...selectedElementIds],
    stampAssetId,
    stampRotation,
    snapToGrid,
    pendingShape,
  };
}

function takeFullSnapshot(): FullSnapshot {
  return {
    map: takeMapSnapshot(),
    editor: takeEditorSnapshot(),
  };
}

function restoreFullSnapshot(snapshot: FullSnapshot) {
  // Restore map state
  useMapStore.getState().loadProject(snapshot.map);

  // Restore editor state (excluding viewport and transient UI)
  const store = useEditorStore.getState();
  store.setTool(snapshot.editor.activeTool);
  store.setActiveLayer(snapshot.editor.activeLayerId);
  store.select(snapshot.editor.selectedElementIds);
  store.setStampAsset(snapshot.editor.stampAssetId ?? '');
  store.setStampRotation(snapshot.editor.stampRotation);
  store.setSnapToGrid(snapshot.editor.snapToGrid);
  store.setPendingShape(snapshot.editor.pendingShape);
}

interface HistoryState {
  undoStack: FullSnapshot[];
  redoStack: FullSnapshot[];
  canUndo: boolean;
  canRedo: boolean;

  captureSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  captureSnapshot: () => {
    const snapshot = takeFullSnapshot();
    set((state) => {
      const stack = [...state.undoStack, snapshot];
      if (stack.length > MAX_UNDO) stack.shift();
      return { undoStack: stack, redoStack: [], canUndo: true, canRedo: false };
    });
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;

    const currentSnapshot = takeFullSnapshot();
    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    restoreFullSnapshot(previous);
    set({
      undoStack: newUndoStack,
      redoStack: [...get().redoStack, currentSnapshot],
      canUndo: newUndoStack.length > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const currentSnapshot = takeFullSnapshot();
    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    restoreFullSnapshot(next);
    set({
      undoStack: [...get().undoStack, currentSnapshot],
      redoStack: newRedoStack,
      canUndo: true,
      canRedo: newRedoStack.length > 0,
    });
  },

  reset: () => set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false }),
}));
