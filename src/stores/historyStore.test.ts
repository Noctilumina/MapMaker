import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from './historyStore';
import { useMapStore } from './mapStore';
import { useEditorStore } from './editorStore';

const testTile = {
  type: 'tile' as const,
  layerId: 'floor',
  assetId: 'a',
  groupId: null,
  x: 0, y: 0, width: 1, height: 1,
  rotation: 0, flipX: false, flipY: false,
  tint: null, opacity: 1.0,
};

describe('historyStore', () => {
  beforeEach(() => {
    useMapStore.getState().reset();
    useEditorStore.getState().reset();
    useHistoryStore.getState().reset();
  });

  it('captures a snapshot and undoes map changes', () => {
    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement(testTile);
    expect(useMapStore.getState().elements).toHaveLength(1);
    useHistoryStore.getState().undo();
    expect(useMapStore.getState().elements).toHaveLength(0);
  });

  it('redoes an undone action', () => {
    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement(testTile);
    useHistoryStore.getState().undo();
    expect(useMapStore.getState().elements).toHaveLength(0);
    useHistoryStore.getState().redo();
    expect(useMapStore.getState().elements).toHaveLength(1);
  });

  it('clears redo stack on new action after undo', () => {
    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement(testTile);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement({ ...testTile, assetId: 'b', x: 64 });
    expect(useHistoryStore.getState().canRedo).toBe(false);
  });

  it('limits undo stack to 100 entries', () => {
    for (let i = 0; i < 110; i++) {
      useHistoryStore.getState().captureSnapshot();
      useMapStore.getState().addElement({ ...testTile, assetId: `a-${i}`, x: i * 64 });
    }
    expect(useHistoryStore.getState().undoStack.length).toBeLessThanOrEqual(100);
  });

  it('undoes editor state changes (tool, snap)', () => {
    useHistoryStore.getState().captureSnapshot();
    useEditorStore.getState().setTool('stamp');
    useEditorStore.getState().setSnapToGrid(false);

    expect(useEditorStore.getState().activeTool).toBe('stamp');
    expect(useEditorStore.getState().snapToGrid).toBe(false);

    useHistoryStore.getState().undo();
    expect(useEditorStore.getState().activeTool).toBe('select');
    expect(useEditorStore.getState().snapToGrid).toBe(true);
  });

  it('undoes active layer change', () => {
    useHistoryStore.getState().captureSnapshot();
    useEditorStore.getState().setActiveLayer('walls');
    expect(useEditorStore.getState().activeLayerId).toBe('walls');

    useHistoryStore.getState().undo();
    expect(useEditorStore.getState().activeLayerId).toBe('floor');
  });
});
