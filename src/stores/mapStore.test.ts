import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from './mapStore';

const testElement = {
  type: 'tile' as const,
  layerId: 'floor',
  assetId: 'test-asset',
  groupId: null,
  x: 192, y: 320,
  width: 1, height: 1,
  rotation: 0, flipX: false, flipY: false,
  tint: null, opacity: 1.0,
};

describe('mapStore', () => {
  beforeEach(() => {
    useMapStore.getState().reset();
  });

  it('initializes with default grid, layers, and empty groups', () => {
    const state = useMapStore.getState();
    expect(state.grid.width).toBe(50);
    expect(state.grid.backgroundColor).toBe('#1a1a1a');
    expect(state.layers).toHaveLength(4);
    expect(state.elements).toHaveLength(0);
    expect(state.groups).toHaveLength(0);
    expect(state.version).toBe(2);
  });

  it('adds an element with pixel coords', () => {
    useMapStore.getState().addElement(testElement);
    const { elements } = useMapStore.getState();
    expect(elements).toHaveLength(1);
    expect(elements[0].x).toBe(192);
    expect(elements[0].opacity).toBe(1.0);
    expect(elements[0].groupId).toBeNull();
  });

  it('moves an element', () => {
    useMapStore.getState().addElement(testElement);
    const id = useMapStore.getState().elements[0].id;
    useMapStore.getState().moveElement(id, 256, 384);
    expect(useMapStore.getState().elements[0].x).toBe(256);
  });

  it('removes an element', () => {
    useMapStore.getState().addElement(testElement);
    const id = useMapStore.getState().elements[0].id;
    useMapStore.getState().removeElement(id);
    expect(useMapStore.getState().elements).toHaveLength(0);
  });

  it('updates an element', () => {
    useMapStore.getState().addElement(testElement);
    const id = useMapStore.getState().elements[0].id;
    useMapStore.getState().updateElement(id, { rotation: 90, opacity: 0.5 });
    const el = useMapStore.getState().elements[0];
    expect(el.rotation).toBe(90);
    expect(el.opacity).toBe(0.5);
  });

  it('updates a layer', () => {
    useMapStore.getState().updateLayer('floor', { visible: false });
    const floor = useMapStore.getState().layers.find(l => l.id === 'floor')!;
    expect(floor.visible).toBe(false);
  });

  it('registers an asset with name and source', () => {
    useMapStore.getState().registerAsset('test-tile', {
      src: 'data:image/png;base64,abc',
      category: 'floors',
      gridSize: [1, 1],
      name: 'Test Tile',
      source: 'preset',
    });
    const asset = useMapStore.getState().assets['test-tile'];
    expect(asset.name).toBe('Test Tile');
    expect(asset.source).toBe('preset');
  });

  it('imports an asset', () => {
    const id = useMapStore.getState().importAsset('My Tile', 'data:...', 'imported', [1, 1]);
    const asset = useMapStore.getState().assets[id];
    expect(asset.name).toBe('My Tile');
    expect(asset.source).toBe('imported');
  });

  it('removes an asset and its elements', () => {
    useMapStore.getState().registerAsset('doomed', {
      src: 'x', category: 'test', gridSize: [1, 1], name: 'Doomed', source: 'imported',
    });
    useMapStore.getState().addElement({ ...testElement, assetId: 'doomed' });
    expect(useMapStore.getState().elements).toHaveLength(1);
    useMapStore.getState().removeAsset('doomed');
    expect(useMapStore.getState().assets['doomed']).toBeUndefined();
    expect(useMapStore.getState().elements).toHaveLength(0);
  });

  it('adds and removes a group', () => {
    const id = useMapStore.getState().addGroup('Test Room');
    expect(useMapStore.getState().groups).toHaveLength(1);
    expect(useMapStore.getState().groups[0].name).toBe('Test Room');
    useMapStore.getState().removeGroup(id);
    expect(useMapStore.getState().groups).toHaveLength(0);
  });

  it('removing a group reparents children to grandparent', () => {
    const parentId = useMapStore.getState().addGroup('Parent');
    const childId = useMapStore.getState().addGroup('Child', parentId);
    useMapStore.getState().addElement({ ...testElement, groupId: childId });
    useMapStore.getState().removeGroup(childId);
    expect(useMapStore.getState().elements[0].groupId).toBe(parentId);
  });

  it('sets element group', () => {
    useMapStore.getState().addElement(testElement);
    const elId = useMapStore.getState().elements[0].id;
    const groupId = useMapStore.getState().addGroup('Room');
    useMapStore.getState().setElementGroup(elId, groupId);
    expect(useMapStore.getState().elements[0].groupId).toBe(groupId);
  });

  it('duplicates a group with offset', () => {
    const groupId = useMapStore.getState().addGroup('Room');
    useMapStore.getState().addElement({ ...testElement, groupId });
    useMapStore.getState().duplicateGroup(groupId, { x: 100, y: 0 });
    expect(useMapStore.getState().groups).toHaveLength(2);
    expect(useMapStore.getState().elements).toHaveLength(2);
    expect(useMapStore.getState().elements[1].x).toBe(292);
    expect(useMapStore.getState().groups[1].name).toBe('Room (copy)');
  });
});
