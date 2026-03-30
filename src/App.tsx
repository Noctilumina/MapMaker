import { useEffect, useState, useCallback, useRef } from 'react';
import './App.css';
import MapCanvas, { getStageInstance } from './components/canvas/MapCanvas';
import AssetBrowser from './components/panels/AssetBrowser';
import PropertiesPanel from './components/panels/PropertiesPanel';
import HierarchyPanel from './components/panels/HierarchyPanel';
import LayerBar from './components/panels/LayerBar';
import Toolbar from './components/toolbar/Toolbar';
import ToolSidebar from './components/toolbar/ToolSidebar';
import StatusBar from './components/toolbar/StatusBar';
import ExportDialog from './components/dialogs/ExportDialog';
import NewProjectDialog from './components/dialogs/NewProjectDialog';
import { useMapStore } from './stores/mapStore';
import { loadPresetAssets } from './utils/assetLoader';
import { exportToPng } from './utils/export';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';

export default function App() {
  const [showExport, setShowExport] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [assetPanelWidth, setAssetPanelWidth] = useState(260);
  const [rightPanelWidth, setRightPanelWidth] = useState(240);
  const dragRef = useRef<{ target: 'asset' | 'right'; startX: number; startWidth: number } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    if (dragRef.current.target === 'asset') {
      setAssetPanelWidth(Math.max(160, Math.min(500, dragRef.current.startWidth + delta)));
    } else {
      setRightPanelWidth(Math.max(160, Math.min(500, dragRef.current.startWidth - delta)));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const store = useMapStore.getState();
    const grid = store.grid;
    const presets = loadPresetAssets(grid.cellSize);
    Object.entries(presets).forEach(([id, asset]) => {
      store.registerAsset(id, asset);
    });
    // Scene setup follows below

    if (store.elements.length > 0) return; // Don't recreate if already loaded

    const cs = grid.cellSize;
    const pc = cs;

    // === REGISTER TEXTURES ===
    const tex = (id: string, src: string, name: string) => {
      if (!store.assets[id]) store.registerAsset(id, { src, category: 'floors', gridSize: [1, 1], name, source: 'preset' });
      return id;
    };
    const concrete = tex('t:concrete', '/textures/misc/stone 1.png', 'Concrete');
    tex('t:asphalt', '/textures/misc/stone 2.png', 'Asphalt');
    const tiles = tex('t:tiles', '/textures/paving/paving 5.png', 'Floor Tiles');
    const tilesAlt = tex('t:tilesAlt', '/textures/paving/paving 6.png', 'Floor Tiles Alt');
    const metal = tex('t:metal', '/textures/misc/stone 3.png', 'Metal');

    // === REGISTER OBJECT ASSETS ===
    const obj = (path: string, name: string, gw = 1, gh = 1) => {
      const id = `o:${path.replace(/[\s,()]/g, '-')}`;
      if (!store.assets[id]) store.registerAsset(id, { src: `/assets/${path}`, category: 'objects', gridSize: [gw, gh], name, source: 'preset' });
      return id;
    };
    // Furniture
    const bed = obj('furniture/Bed A.png', 'Bed');
    obj('furniture/Bed - Pattern 5 - Cot.png', 'Cot');
    const couch = obj('furniture/Chair - Couch.png', 'Couch');
    const armchair = obj('furniture/Chair - Armchair.png', 'Armchair');
    const chairC = obj('furniture/Chair C.png', 'Chair');
    const deskA = obj('furniture/Work Desk A.png', 'Work Desk A');
    const deskB = obj('furniture/Work Desk B.png', 'Work Desk B');
    const deskC = obj('furniture/Work Desk C.png', 'Work Desk C');
    const kitchenSink = obj('furniture/Kitchen Sink A.png', 'Kitchen Sink');
    const kitchenBench = obj('furniture/Kitchen Bench A.png', 'Kitchen Bench');
    const kitchenBuffet = obj('furniture/Kitchen Buffet.png', 'Kitchen Buffet');
    const shelf = obj('furniture/Storage - Modular shelf - Straight - Dark.png', 'Shelf');
    const toilet = obj('furniture/Bathroom Toilet A.png', 'Toilet');
    const shower = obj('furniture/Bathroom Shower A.png', 'Shower');
    const sink = obj('furniture/Bathroom Sink A.png', 'Bathroom Sink');
    const grill = obj('furniture/Grill.png', 'Grill');
    const brokenTable = obj('furniture/Table - Broken 2 - Dark.png', 'Broken Table');
    const mattress = obj('furniture/Bed - Discarded mattress 5.png', 'Discarded Mattress');
    // Tech
    const screenR = obj('tech/Screen 1 - Red - 1x1.png', 'Screen Red');
    const screenY = obj('tech/Screen 1 - Yellow - 1x1.png', 'Screen Yellow');
    const vendingA = obj('tech/Vending Machine A.png', 'Vending Machine A');
    const vendingB = obj('tech/Vending Machine B.png', 'Vending Machine B');
    const billboard = obj('tech/Screen billboard - Red - 3x1.png', 'Billboard', 3, 1);
    // Street
    const streetLight = obj('street/Street light 1 - 2x1.png', 'Street Light', 2, 1);
    const trafficLight = obj('street/Traffic light 1 - 1x1.png', 'Traffic Light');
    const fireHydrant = obj('street/Fire hydrant - Orange - 1x1.png', 'Fire Hydrant');
    const grate = obj('street/Grate 1 - 1x1.png', 'Grate');
    const manhole = obj('street/Manhole 1 - 1x1.png', 'Manhole');
    const trafficCone = obj('street/Traffic cone - 1x1.png', 'Traffic Cone');
    const streetSign = obj('street/Street sign - Blue - 1x1.png', 'Street Sign');
    // Trash
    const trashCan = obj('trash/Trash can - 1x1.png', 'Trash Can');
    const dumpster = obj('trash/Dumpster 1 - 2x2.png', 'Dumpster', 2, 2);
    const trashBags = obj('trash/Trash bags - 1x1.png', 'Trash Bags');
    const crushedBox = obj('trash/Crushed boxes 1 - 1x1.png', 'Crushed Boxes');
    // Crates
    const barrel = obj('crates/Barrel 1 - 1x1.png', 'Barrel');
    const barrelBlue = obj('crates/Barrel 1 - Blue - 1x1.png', 'Blue Barrel');
    const crate = obj('crates/Crate 1 - 1x1.png', 'Crate');
    // Security
    const barrier = obj('security/Barrier - Concrete 1 - 1x1.png', 'Concrete Barrier');
    const corrSheet = obj('security/Corrugated sheet 1 - 3x2.png', 'Corrugated Sheet', 3, 2);
    const fence = obj('security/Fence 1 - 1x1.png', 'Fence');
    // Vehicles
    const car1 = obj('vehicles/Car - Stinger - 2x4.png', 'Car Stinger', 2, 4);
    const car2 = obj('vehicles/Car - Iron Giant - 2x4.png', 'Car Iron Giant', 2, 4);
    const car3 = obj('vehicles/Car - Tagger - 2x4.png', 'Car Tagger', 2, 4);
    // Scrap
    const shoppingCart = obj('scrap-debris/Scrap - Shopping Cart 1 - Colorful.webp', 'Shopping Cart');
    const scrapDoor = obj('scrap-debris/Scrap - Door - Colorful.webp', 'Scrap Door');
    // Graffiti
    const chalkOutline = obj('graffiti/Crime scene chalk outline - 2x2.png', 'Chalk Outline', 2, 2);
    // Road tiles
    const roadStraight = obj('street/City Street Tile - Straight - 10x10.jpg', 'Road Straight', 10, 10);
    const roadEnd = obj('street/City Street Tile - End - 10x10.jpg', 'Road End', 10, 10);
    obj('street/City Street Tile - Bend - 10x10.jpg', 'Road Bend', 10, 10);
    obj('street/City Street Tile - Intersection - 10x10.jpg', 'Road Intersection', 10, 10);
    const roadJunction = obj('street/City Street Tile - Junction - 10x10.jpg', 'Road Junction', 10, 10);
    const roadBase = obj('street/City Street Tile - Base - 10x10.jpg', 'Road Base', 10, 10);

    // Helper to place tiles
    const place = (id: string, gid: string | null, x: number, y: number, rot = 0) => {
      const a = useMapStore.getState().assets[id];
      store.addElement({ type: 'tile', layerId: 'objects', assetId: id, groupId: gid,
        x: x*pc, y: y*pc, width: a?.gridSize[0]||1, height: a?.gridSize[1]||1,
        rotation: rot, flipX: false, flipY: false, tint: null, opacity: 1.0 });
    };
    const placeFloor = (id: string, gid: string | null, x: number, y: number, rot = 0) => {
      const a = useMapStore.getState().assets[id];
      store.addElement({ type: 'tile', layerId: 'floor', assetId: id, groupId: gid,
        x: x*pc, y: y*pc, width: a?.gridSize[0]||1, height: a?.gridSize[1]||1,
        rotation: rot, flipX: false, flipY: false, tint: null, opacity: 1.0 });
    };
    const op = (id: string, type: 'door'|'window', edge: number, pos: number, w: number, angle = 0, hinge: 'left'|'right' = 'left', swing: 'inward'|'outward' = 'inward', color = '#555') =>
      ({ id, type, edgeIndex: edge, position: pos, width: w, doorColor: color, doorOpenAngle: angle, doorHinge: hinge, doorSwing: swing } as const);

    // ========================================
    // ROAD NETWORK
    // ========================================
    const roadGrp = store.addGroup('Road Network');

    // Map grid (50x40) divided into 10x10 blocks:
    // Cols: 0, 10, 20, 30, 40  (5 columns)
    // Rows: 0, 10, 20, 30      (4 rows)

    // Base tiles first (background pavement everywhere)
    for (let col = 0; col < 50; col += 10) {
      for (let row = 0; row < 40; row += 10) {
        placeFloor(roadBase, roadGrp, col, row);
      }
    }

    // Main east-west road (row 20) — overwrites base tiles
    placeFloor(roadEnd, roadGrp, 0, 20, 270);
    placeFloor(roadStraight, roadGrp, 10, 20, 90);
    placeFloor(roadJunction, roadGrp, 20, 20, 0);
    placeFloor(roadStraight, roadGrp, 30, 20, 90);
    placeFloor(roadEnd, roadGrp, 40, 20, 90);

    // North-south cross street (col 20)
    placeFloor(roadEnd, roadGrp, 20, 0, 0);
    placeFloor(roadStraight, roadGrp, 20, 10, 0);
    // Junction at (20,20) already placed
    placeFloor(roadEnd, roadGrp, 20, 30, 180);

    // ========================================
    // APARTMENT 1 — top-left (large, 3 rooms)
    // ========================================
    const apt1 = store.addGroup('Apartment Complex A');
    store.addElement({ type: 'polygon', layerId: 'objects', assetId: tiles, groupId: apt1,
      points: [2*pc, 2*pc, 18*pc, 2*pc, 18*pc, 13*pc, 2*pc, 13*pc],
      fillScale: 0.5, fillRotation: 0, fillOffsetX: 0, fillOffsetY: 0,
      fillRandomize: false, fillRandomSeed: 10, tension: 0,
      borderWidth: 6, borderColor: '#2a2a3a',
      openings: [
        op('a1-door', 'door', 2, 0.3, pc*1.5, 70, 'left', 'outward', '#555'),
        op('a1-w1', 'window', 2, 0.6, pc),
        op('a1-w2', 'window', 2, 0.85, pc),
        op('a1-w3', 'window', 0, 0.2, pc),
        op('a1-w4', 'window', 0, 0.5, pc),
        op('a1-w5', 'window', 0, 0.8, pc),
        op('a1-w6', 'window', 3, 0.5, pc),
      ],
      innerWalls: [
        { id: 'a1-iw1', x1: 8*pc, y1: 2*pc, x2: 8*pc, y2: 13*pc, width: 6, color: '#2a2a3a' },
        { id: 'a1-iw2', x1: 13*pc, y1: 2*pc, x2: 13*pc, y2: 13*pc, width: 6, color: '#2a2a3a' },
        { id: 'a1-iw3', x1: 2*pc, y1: 8*pc, x2: 8*pc, y2: 8*pc, width: 6, color: '#2a2a3a' },
      ],
      wallsBlockLight: true, tint: '#ddd', opacity: 1.0 });

    // Apt1 — Living room (left-bottom)
    place(couch, apt1, 3, 9);
    place(armchair, apt1, 5, 9);
    place(screenR, apt1, 3, 11);
    place(shelf, apt1, 6, 11);
    // Apt1 — Bedroom (left-top)
    place(bed, apt1, 3, 3);
    place(deskA, apt1, 6, 3);
    place(chairC, apt1, 6, 4, 180);
    // Apt1 — Kitchen (center)
    place(kitchenSink, apt1, 9, 3);
    place(kitchenBench, apt1, 10, 3);
    place(kitchenBuffet, apt1, 11, 3);
    place(chairC, apt1, 9, 5);
    place(chairC, apt1, 11, 5);
    // Apt1 — Bathroom (center-bottom)
    place(toilet, apt1, 9, 10);
    place(shower, apt1, 11, 10);
    place(sink, apt1, 9, 11);
    // Apt1 — Study (right)
    place(deskB, apt1, 14, 3);
    place(deskC, apt1, 14, 5);
    place(chairC, apt1, 15, 3, 90);
    place(chairC, apt1, 15, 5, 90);
    place(screenY, apt1, 14, 4);
    place(shelf, apt1, 17, 8);
    place(vendingA, apt1, 17, 11);

    // ========================================
    // APARTMENT 2 — top-right (smaller)
    // ========================================
    const apt2 = store.addGroup('Apartment Complex B');
    store.addElement({ type: 'polygon', layerId: 'objects', assetId: tilesAlt, groupId: apt2,
      points: [24*pc, 2*pc, 38*pc, 2*pc, 38*pc, 13*pc, 24*pc, 13*pc],
      fillScale: 0.5, fillRotation: 0, fillOffsetX: 0, fillOffsetY: 0,
      fillRandomize: false, fillRandomSeed: 20, tension: 0,
      borderWidth: 6, borderColor: '#2a2a3a',
      openings: [
        op('a2-door', 'door', 2, 0.35, pc*1.5, 65, 'right', 'outward', '#555'),
        op('a2-w1', 'window', 0, 0.25, pc),
        op('a2-w2', 'window', 0, 0.75, pc),
        op('a2-w3', 'window', 1, 0.3, pc),
        op('a2-w4', 'window', 1, 0.7, pc),
        op('a2-w5', 'window', 3, 0.5, pc),
      ],
      innerWalls: [
        { id: 'a2-iw1', x1: 31*pc, y1: 2*pc, x2: 31*pc, y2: 13*pc, width: 6, color: '#2a2a3a' }, // this is correct - divider at col 31
        { id: 'a2-iw2', x1: 24*pc, y1: 8*pc, x2: 31*pc, y2: 8*pc, width: 6, color: '#2a2a3a' },
      ],
      wallsBlockLight: true, tint: '#ddd', opacity: 1.0 });

    // Apt2 — Living room (left-top)
    place(couch, apt2, 25, 3);
    place(armchair, apt2, 27, 3);
    place(screenR, apt2, 25, 5);
    // Apt2 — Kitchen (left-bottom)
    place(kitchenSink, apt2, 25, 9);
    place(kitchenBench, apt2, 26, 9);
    place(grill, apt2, 28, 9);
    // Apt2 — Bedroom (right)
    place(bed, apt2, 32, 3);
    place(deskA, apt2, 35, 3);
    place(chairC, apt2, 36, 3, 90);
    place(shelf, apt2, 37, 6);
    // Apt2 — Bathroom (right-bottom)
    place(toilet, apt2, 32, 10);
    place(sink, apt2, 33, 10);
    place(shower, apt2, 35, 10);

    // ========================================
    // BAR — south-west
    // ========================================
    const barId = store.addGroup('Night Owl Bar');
    store.addElement({ type: 'polygon', layerId: 'objects', assetId: metal, groupId: barId,
      points: [2*pc, 31*pc, 16*pc, 31*pc, 16*pc, 39*pc, 2*pc, 39*pc],
      fillScale: 0.8, fillRotation: 0, fillOffsetX: 0, fillOffsetY: 0,
      fillRandomize: false, fillRandomSeed: 30, tension: 0,
      borderWidth: 6, borderColor: '#1a1a2e',
      openings: [
        op('bar-door', 'door', 0, 0.4, pc*1.5, 80, 'left', 'outward', '#444'),
        op('bar-w1', 'window', 0, 0.75, pc*2),
        op('bar-w2', 'window', 1, 0.5, pc),
      ],
      innerWalls: [
        { id: 'bar-iw1', x1: 10*pc, y1: 31*pc, x2: 10*pc, y2: 37*pc, width: 6, color: '#1a1a2e' },
      ],
      wallsBlockLight: true, tint: '#1a1020', opacity: 1.0 });

    // Bar — main area
    place(kitchenBench, barId, 3, 30);
    place(kitchenBench, barId, 4, 30);
    place(kitchenBench, barId, 5, 30);
    place(kitchenBench, barId, 6, 30);
    place(chairC, barId, 3, 31, 180);
    place(chairC, barId, 4, 31, 180);
    place(chairC, barId, 5, 31, 180);
    place(chairC, barId, 6, 31, 180);
    place(couch, barId, 3, 34);
    place(couch, barId, 5, 34);
    place(armchair, barId, 7, 34);
    place(screenR, barId, 3, 36);
    place(vendingB, barId, 8, 36);
    // Bar — back room
    place(shelf, barId, 11, 28);
    place(shelf, barId, 12, 28);
    place(barrel, barId, 14, 35);
    place(barrelBlue, barId, 15, 35);
    place(crate, barId, 14, 36);

    // ========================================
    // RUINED BUILDING — south-east
    // ========================================
    const ruinId = store.addGroup('Ruined Building');
    store.addElement({ type: 'polygon', layerId: 'objects', assetId: concrete, groupId: ruinId,
      points: [24*pc, 31*pc, 40*pc, 31*pc, 40*pc, 39*pc, 28*pc, 39*pc, 28*pc, 35*pc, 24*pc, 35*pc],
      fillScale: 0.7, fillRotation: 0, fillOffsetX: 0, fillOffsetY: 0,
      fillRandomize: true, fillRandomSeed: 40, tension: 0,
      borderWidth: 5, borderColor: '#333',
      openings: [
        op('ruin-door', 'door', 0, 0.3, pc*2, 90, 'right', 'outward', '#444'),
        op('ruin-w1', 'window', 1, 0.4, pc*1.5),
      ],
      innerWalls: [],
      wallsBlockLight: true, tint: '#666', opacity: 1.0 });

    // Ruined interior — scattered debris
    place(brokenTable, ruinId, 30, 29);
    place(mattress, ruinId, 35, 29);
    place(crushedBox, ruinId, 32, 31);
    place(crushedBox, ruinId, 34, 32);
    place(barrel, ruinId, 37, 35);
    place(crate, ruinId, 38, 35);
    place(shoppingCart, ruinId, 25, 30);
    place(scrapDoor, ruinId, 36, 30);
    place(corrSheet, ruinId, 30, 35);
    place(chalkOutline, ruinId, 33, 34);

    // ========================================
    // STREET FURNITURE
    // ========================================
    const streetGrp = store.addGroup('Street Objects');
    // Cars parked along road
    place(car1, streetGrp, 4, 14);
    place(car2, streetGrp, 15, 25.5);
    place(car3, streetGrp, 32, 14);
    place(car1, streetGrp, 44, 25.5, 180);
    // Street lights
    place(streetLight, streetGrp, 6, 14);
    place(streetLight, streetGrp, 18, 14);
    place(streetLight, streetGrp, 36, 14);
    place(streetLight, streetGrp, 46, 14);
    place(streetLight, streetGrp, 10, 25.5, 180);
    place(streetLight, streetGrp, 28, 25.5, 180);
    place(streetLight, streetGrp, 42, 25.5, 180);
    // Traffic lights at intersection
    place(trafficLight, streetGrp, 20, 14.5);
    place(trafficLight, streetGrp, 29, 25);
    // Signs
    place(streetSign, streetGrp, 19, 25);
    place(streetSign, streetGrp, 30, 14.5);
    // Billboards
    place(billboard, streetGrp, 20, 1);
    place(billboard, streetGrp, 35, 39);
    // Vending machines on sidewalk
    place(vendingA, streetGrp, 8, 14);
    place(vendingB, streetGrp, 40, 25.5);
    // Fire hydrants
    place(fireHydrant, streetGrp, 12, 14.5);
    place(fireHydrant, streetGrp, 34, 25);
    // Manholes & grates
    place(manhole, streetGrp, 15, 20);
    place(grate, streetGrp, 25, 20);
    place(grate, streetGrp, 35, 20);
    // Traffic cones near ruin
    place(trafficCone, streetGrp, 23, 26);
    place(trafficCone, streetGrp, 22, 27);
    // Barriers
    place(barrier, streetGrp, 41, 27);
    place(barrier, streetGrp, 41, 28);
    // Trash
    place(trashCan, streetGrp, 2, 14);
    place(trashCan, streetGrp, 22, 14);
    place(trashCan, streetGrp, 38, 25.5);
    place(dumpster, streetGrp, 19, 1);
    place(trashBags, streetGrp, 21, 26);
    place(trashBags, streetGrp, 42, 38);
    // Fences around ruin
    place(fence, streetGrp, 23, 35);
    place(fence, streetGrp, 23, 36);
    place(fence, streetGrp, 23, 37);

    // ========================================
    // LIGHTS
    // ========================================
    // Street lights — cold white sodium
    const sl = (x: number, y: number) =>
      store.addElement({ type: 'light', layerId: 'objects', groupId: null, x: x*pc, y: y*pc, radius: pc*5, color: '#ddeeff', intensity: 0.7, flickerAmount: 0, lightShape: 'point' });
    sl(6, 14); sl(18, 14); sl(36, 14); sl(46, 14);
    sl(10, 26); sl(28, 26); sl(42, 26);

    // Apt 1 interior
    store.addElement({ type: 'light', layerId: 'objects', groupId: apt1, x: 5*pc, y: 5*pc, radius: pc*4, color: '#ffeecc', intensity: 0.7, flickerAmount: 0, lightShape: 'point' });
    store.addElement({ type: 'light', layerId: 'objects', groupId: apt1, x: 5*pc, y: 10*pc, radius: pc*4, color: '#cceeff', intensity: 0.6, flickerAmount: 0, lightShape: 'point' });
    store.addElement({ type: 'light', layerId: 'objects', groupId: apt1, x: 10*pc, y: 5*pc, radius: pc*3, color: '#ffeecc', intensity: 0.6, flickerAmount: 0, lightShape: 'point' });
    store.addElement({ type: 'light', layerId: 'objects', groupId: apt1, x: 15*pc, y: 6*pc, radius: pc*4, color: '#cceeff', intensity: 0.7, flickerAmount: 0, lightShape: 'point' });

    // Apt 2 interior
    store.addElement({ type: 'light', layerId: 'objects', groupId: apt2, x: 31*pc, y: 5*pc, radius: pc*4, color: '#ffeecc', intensity: 0.7, flickerAmount: 0, lightShape: 'point' });
    store.addElement({ type: 'light', layerId: 'objects', groupId: apt2, x: 31*pc, y: 10*pc, radius: pc*3, color: '#ffeecc', intensity: 0.5, flickerAmount: 0, lightShape: 'point' });
    store.addElement({ type: 'light', layerId: 'objects', groupId: apt2, x: 35*pc, y: 5*pc, radius: pc*4, color: '#cceeff', intensity: 0.6, flickerAmount: 0, lightShape: 'point' });

    // Bar — neon pink outside + purple inside
    store.addElement({ type: 'light', layerId: 'objects', groupId: barId, x: 8*pc, y: 26.5*pc, radius: pc*4, color: '#ff0088', intensity: 0.9, flickerAmount: 0.15, lightShape: 'point' });
    store.addElement({ type: 'light', layerId: 'objects', groupId: barId, x: 5*pc, y: 32*pc, radius: pc*5, color: '#7700dd', intensity: 0.6, flickerAmount: 0.1, lightShape: 'point' });
    store.addElement({ type: 'light', layerId: 'objects', groupId: barId, x: 13*pc, y: 31*pc, radius: pc*4, color: '#ff2200', intensity: 0.4, flickerAmount: 0.2, lightShape: 'point' });

    // Ruin — single flickering bulb
    store.addElement({ type: 'light', layerId: 'objects', groupId: ruinId, x: 32*pc, y: 32*pc, radius: pc*5, color: '#ffaa44', intensity: 0.4, flickerAmount: 0.5, lightShape: 'point' });

    /* Old scene removed */
  }, []);

  useKeyboardShortcuts();
  useAutoSave();

  return (
    <div className="app">
      <header className="toolbar">
        <Toolbar onExportPng={() => setShowExport(true)} onNewProject={() => setShowNewProject(true)} />
      </header>
      <div className="workspace">
        <aside className="tool-sidebar">
          <ToolSidebar />
        </aside>
        <aside className="asset-panel" style={{ width: assetPanelWidth }}>
          <AssetBrowser />
          <div className="resize-handle resize-handle-right"
            onMouseDown={(e) => { dragRef.current = { target: 'asset', startX: e.clientX, startWidth: assetPanelWidth }; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} />
        </aside>
        <main className="canvas-area">
          <MapCanvas />
        </main>
        <aside className="right-panel" style={{ width: rightPanelWidth, display: 'flex', flexDirection: 'column' }}>
          <div className="resize-handle resize-handle-left"
            onMouseDown={(e) => { dragRef.current = { target: 'right', startX: e.clientX, startWidth: rightPanelWidth }; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} />
          <div style={{ flex: 1, borderBottom: '1px solid #313244', overflow: 'auto' }}>
            <PropertiesPanel />
          </div>
          <LayerBar />
          <div style={{ flex: 1, overflow: 'auto' }}>
            <HierarchyPanel />
          </div>
        </aside>
      </div>
      <footer className="status-bar">
        <StatusBar />
      </footer>
      {showExport && (
        <ExportDialog
          onExport={(opts) => {
            const stage = getStageInstance();
            const grid = useMapStore.getState().grid;
            if (stage) {
              exportToPng(stage, {
                dpi: opts.dpi,
                gridWidthCells: grid.width,
                gridHeightCells: grid.height,
                cellSizePx: grid.cellSize,
                includeGrid: opts.includeGrid,
                includeGmNotes: opts.includeGmNotes,
                backgroundColor: useMapStore.getState().grid.backgroundColor,
              });
            }
            setShowExport(false);
          }}
          onClose={() => setShowExport(false)}
        />
      )}
      {showNewProject && (
        <NewProjectDialog
          onConfirm={(opts) => {
            useMapStore.getState().reset();
            useMapStore.getState().setGrid({ width: opts.width, height: opts.height, scale: opts.scale });
            const grid = useMapStore.getState().grid;
            const presets = loadPresetAssets(grid.cellSize);
            Object.entries(presets).forEach(([id, asset]) => {
              useMapStore.getState().registerAsset(id, asset);
            });
            setShowNewProject(false);
          }}
          onClose={() => setShowNewProject(false)}
        />
      )}
    </div>
  );
}
