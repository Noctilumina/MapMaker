import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('initializes with select tool and floor layer', () => {
    const state = useEditorStore.getState();
    expect(state.activeTool).toBe('select');
    expect(state.activeLayerId).toBe('floor');
    expect(state.selectedElementIds).toEqual([]);
  });

  it('sets active tool', () => {
    useEditorStore.getState().setTool('stamp');
    expect(useEditorStore.getState().activeTool).toBe('stamp');
  });

  it('sets active layer', () => {
    useEditorStore.getState().setActiveLayer('walls');
    expect(useEditorStore.getState().activeLayerId).toBe('walls');
  });

  it('selects and deselects elements', () => {
    useEditorStore.getState().select(['a', 'b']);
    expect(useEditorStore.getState().selectedElementIds).toEqual(['a', 'b']);
    useEditorStore.getState().deselect();
    expect(useEditorStore.getState().selectedElementIds).toEqual([]);
  });

  it('sets stamp asset', () => {
    useEditorStore.getState().setStampAsset('concrete-01');
    expect(useEditorStore.getState().stampAssetId).toBe('concrete-01');
  });

  it('updates viewport', () => {
    useEditorStore.getState().setViewport({ zoom: 1.5, panX: 100, panY: 200 });
    const vp = useEditorStore.getState().viewport;
    expect(vp.zoom).toBe(1.5);
    expect(vp.panX).toBe(100);
  });

  it('toggles snap to grid', () => {
    expect(useEditorStore.getState().snapToGrid).toBe(true);
    useEditorStore.getState().setSnapToGrid(false);
    expect(useEditorStore.getState().snapToGrid).toBe(false);
  });
});
