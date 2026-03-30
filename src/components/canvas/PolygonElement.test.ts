import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';

// Test polygon data model behavior — rendering is visual but we can verify
// the store handles polygon properties correctly for border and fill rotation

const basePolygon = {
  type: 'polygon' as const,
  layerId: 'floor',
  assetId: 'test-asset',
  groupId: null,
  points: [0, 0, 100, 0, 100, 100, 0, 100],
  fillScale: 1,
  fillRotation: 0,
  fillOffsetX: 0,
  fillOffsetY: 0,
  fillRandomize: false,
  fillRandomSeed: 42,
  tension: 0,
  borderWidth: 0,
  borderColor: '#000000',
  tint: null,
  opacity: 1.0,
};

describe('Polygon element properties', () => {
  beforeEach(() => {
    useMapStore.getState().reset();
  });

  it('stores border width and color', () => {
    useMapStore.getState().addElement({
      ...basePolygon,
      borderWidth: 5,
      borderColor: '#ff0000',
    });
    const el = useMapStore.getState().elements[0];
    expect(el.type).toBe('polygon');
    if (el.type === 'polygon') {
      expect(el.borderWidth).toBe(5);
      expect(el.borderColor).toBe('#ff0000');
    }
  });

  it('updates border width via updateElement', () => {
    useMapStore.getState().addElement(basePolygon);
    const id = useMapStore.getState().elements[0].id;
    useMapStore.getState().updateElement(id, { borderWidth: 8 });
    const el = useMapStore.getState().elements[0];
    if (el.type === 'polygon') {
      expect(el.borderWidth).toBe(8);
    }
  });

  it('stores fill rotation', () => {
    useMapStore.getState().addElement({
      ...basePolygon,
      fillRotation: 45,
    });
    const el = useMapStore.getState().elements[0];
    if (el.type === 'polygon') {
      expect(el.fillRotation).toBe(45);
    }
  });

  it('updates fill rotation via updateElement', () => {
    useMapStore.getState().addElement(basePolygon);
    const id = useMapStore.getState().elements[0].id;
    useMapStore.getState().updateElement(id, { fillRotation: 90 });
    const el = useMapStore.getState().elements[0];
    if (el.type === 'polygon') {
      expect(el.fillRotation).toBe(90);
    }
  });

  it('border visible when opacity is 0 (fill hidden, border separate)', () => {
    useMapStore.getState().addElement({
      ...basePolygon,
      borderWidth: 5,
      borderColor: '#ff0000',
      opacity: 0,
    });
    const el = useMapStore.getState().elements[0];
    if (el.type === 'polygon') {
      // Border should still be renderable even with opacity 0
      // (opacity controls fill, border is separate)
      expect(el.opacity).toBe(0);
      expect(el.borderWidth).toBe(5);
      expect(el.borderColor).toBe('#ff0000');
    }
  });

  it('fill rotation and scale persist through updates', () => {
    useMapStore.getState().addElement({
      ...basePolygon,
      fillRotation: 45,
      fillScale: 2.5,
    });
    const id = useMapStore.getState().elements[0].id;

    // Update an unrelated property
    useMapStore.getState().updateElement(id, { tension: 0.5 });

    const el = useMapStore.getState().elements[0];
    if (el.type === 'polygon') {
      expect(el.fillRotation).toBe(45);
      expect(el.fillScale).toBe(2.5);
      expect(el.tension).toBe(0.5);
    }
  });

  it('movePolygon preserves border and fill properties', () => {
    useMapStore.getState().addElement({
      ...basePolygon,
      borderWidth: 5,
      fillRotation: 45,
    });
    const id = useMapStore.getState().elements[0].id;
    useMapStore.getState().movePolygon(id, 50, 50);

    const el = useMapStore.getState().elements[0];
    if (el.type === 'polygon') {
      expect(el.borderWidth).toBe(5);
      expect(el.fillRotation).toBe(45);
      // Points should be offset
      expect(el.points[0]).toBe(50);
      expect(el.points[1]).toBe(50);
    }
  });
});
