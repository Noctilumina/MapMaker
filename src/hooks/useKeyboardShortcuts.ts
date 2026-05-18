import { useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';
import { useMapStore } from '../stores/mapStore';
import type { StampTemplateEntry } from '../stores/editorStore';
import type { ToolName } from '../stores/editorStore';
import type { TileElement } from '../types/index';
import { KEYS, KEY_EVENTS, matchesKey } from '../keys';

export function useKeyboardShortcuts() {
  const setTool = useEditorStore((s) => s.setTool);

  useEffect(() => {
    const previousToolRef = { current: null as string | null };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (matchesKey(e, KEYS.PAN_TEMP) && previousToolRef.current) {
        useEditorStore.getState().setTool(previousToolRef.current as ToolName);
        previousToolRef.current = null;
      }
    };

    const switchTool = (tool: ToolName) => {
      if (useEditorStore.getState().activeTool !== tool) {
        useHistoryStore.getState().captureSnapshot();
        setTool(tool);
      }
    };

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Arrow nudge — KEY_EVENTS.ARROWS (multi-key, can't use matchesKey)
      if (KEY_EVENTS.ARROWS.includes(e.key as typeof KEY_EVENTS.ARROWS[number]) && !e.ctrlKey && !e.metaKey) {
        const selected = useEditorStore.getState().selectedElementIds;
        if (selected.length > 0) {
          e.preventDefault();
          const cellSize = useMapStore.getState().grid.cellSize;
          const step = e.shiftKey ? 1 : cellSize;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0;
          useHistoryStore.getState().captureSnapshot();
          useMapStore.getState().moveElements(selected.map(id => ({ id, dx, dy })));
        }
        return;
      }

      // Shift+] → '}', Shift+[ → '{' on US layout (KEY_EVENTS, pre-loop to avoid symbol conflict)
      if (KEY_EVENTS.Z_FRONT.includes(e.key as typeof KEY_EVENTS.Z_FRONT[number])) {
        const sel = useEditorStore.getState().selectedElementIds;
        if (sel.length === 1) { useHistoryStore.getState().captureSnapshot(); useMapStore.getState().bringToFront(sel[0]); }
        return;
      }
      if (KEY_EVENTS.Z_BACK.includes(e.key as typeof KEY_EVENTS.Z_BACK[number])) {
        const sel = useEditorStore.getState().selectedElementIds;
        if (sel.length === 1) { useHistoryStore.getState().captureSnapshot(); useMapStore.getState().sendToBack(sel[0]); }
        return;
      }

      // Delete / Backspace (KEY_EVENTS.DELETE — multi-key)
      if (KEY_EVENTS.DELETE.includes(e.key as typeof KEY_EVENTS.DELETE[number])) {
        const selected = useEditorStore.getState().selectedElementIds;
        const elements = useMapStore.getState().elements;
        const deletable = selected.filter(id => !elements.find(el => el.id === id)?.locked);
        if (deletable.length > 0) {
          useHistoryStore.getState().captureSnapshot();
          deletable.forEach(id => useMapStore.getState().removeElement(id));
          useEditorStore.getState().deselect();
        }
        return;
      }

      // Binding table — composite bindings MUST precede their single-letter counterparts
      // to prevent e.g. Ctrl+B matching KEYS.STAMP ('B') before KEYS.CAPTURE_TEMPLATE ('Ctrl+B').
      const bindings: Array<[string, (e: KeyboardEvent) => void]> = [
        [KEYS.SAVE,             (e) => { e.preventDefault(); }],
        [KEYS.UNDO,             (e) => { e.preventDefault(); useHistoryStore.getState().undo(); }],
        [KEYS.REDO,             (e) => { e.preventDefault(); useHistoryStore.getState().redo(); }],
        [KEYS.COPY,             (e) => {
          e.preventDefault();
          const selected = useEditorStore.getState().selectedElementIds;
          if (selected.length > 0) useEditorStore.getState().setClipboard([...selected]);
        }],
        [KEYS.PASTE,            (e) => {
          e.preventDefault();
          const clipboard = useEditorStore.getState().clipboardElementIds;
          if (clipboard?.length) {
            useHistoryStore.getState().captureSnapshot();
            const cellSize = useMapStore.getState().grid.cellSize;
            const newIds = useMapStore.getState().duplicateElements(clipboard, { x: cellSize, y: cellSize });
            if (newIds.length > 0) useEditorStore.getState().select(newIds);
          }
        }],
        [KEYS.DUPLICATE,        (e) => {
          e.preventDefault();
          const selected = useEditorStore.getState().selectedElementIds;
          if (selected.length > 0) {
            useHistoryStore.getState().captureSnapshot();
            const cellSize = useMapStore.getState().grid.cellSize;
            const newIds = useMapStore.getState().duplicateElements(selected, { x: cellSize, y: cellSize });
            useEditorStore.getState().select(newIds);
          }
        }],
        [KEYS.UNGROUP,          (e) => {
          e.preventDefault();
          const selected = useEditorStore.getState().selectedElementIds;
          if (selected.length > 0) {
            const elements = useMapStore.getState().elements;
            const groupIds = new Set(
              selected.map(id => elements.find(el => el.id === id)?.groupId).filter(Boolean) as string[]
            );
            groupIds.forEach(gid => {
              useHistoryStore.getState().captureSnapshot();
              useMapStore.getState().removeGroup(gid);
            });
          }
        }],
        [KEYS.GROUP,            (e) => {
          e.preventDefault();
          const selected = useEditorStore.getState().selectedElementIds;
          if (selected.length > 1) {
            useHistoryStore.getState().captureSnapshot();
            const groupId = useMapStore.getState().addGroup('New Group');
            selected.forEach(id => useMapStore.getState().setElementGroup(id, groupId));
            useEditorStore.getState().setRenamingGroupId(groupId);
          }
        }],
        [KEYS.CAPTURE_TEMPLATE, (e) => {
          e.preventDefault();
          const selected = useEditorStore.getState().selectedElementIds;
          if (selected.length > 0) {
            const elements = useMapStore.getState().elements;
            const tiles = selected
              .map(id => elements.find(el => el.id === id))
              .filter(el => el?.type === 'tile') as TileElement[];
            if (tiles.length > 0) {
              const minX = Math.min(...tiles.map(t => t.x));
              const minY = Math.min(...tiles.map(t => t.y));
              const template: StampTemplateEntry[] = tiles.map(t => ({
                dx: t.x - minX, dy: t.y - minY, assetId: t.assetId,
                width: t.width, height: t.height, rotation: t.rotation,
                flipX: t.flipX, flipY: t.flipY, tint: t.tint, opacity: t.opacity,
              }));
              useEditorStore.getState().setStampTemplate(template);
              useEditorStore.getState().setTool('copy-stamp');
            }
          }
        }],
        [KEYS.SELECT_BY_ASSET,  (e) => {
          e.preventDefault();
          const selected = useEditorStore.getState().selectedElementIds;
          if (selected.length > 0) {
            const elements = useMapStore.getState().elements;
            const activeLayerId = useEditorStore.getState().activeLayerId;
            const refEl = elements.find(el => el.id === selected[0]);
            if (refEl?.type === 'tile') {
              const sameAsset = elements
                .filter(el => el.type === 'tile' && el.layerId === activeLayerId &&
                  (el as TileElement).assetId === (refEl as TileElement).assetId)
                .map(el => el.id);
              useEditorStore.getState().select(sameAsset);
            }
          }
        }],
        [KEYS.PAN_TEMP,         (e) => {
          e.preventDefault();
          previousToolRef.current = useEditorStore.getState().activeTool;
          setTool('pan');
        }],
        [KEYS.SELECT,           () => switchTool('select')],
        [KEYS.STAMP,            () => switchTool('stamp')],
        [KEYS.RECT_STAMP,       () => switchTool('rect-stamp')],
        [KEYS.LINE_STAMP,       () => switchTool('line-stamp')],
        [KEYS.SCATTER,          () => switchTool('scatter')],
        [KEYS.REPLACE,          () => switchTool('replace')],
        [KEYS.POLYGON,          () => switchTool('polygon')],
        [KEYS.PATH,             () => {
          if (useEditorStore.getState().activeTool === 'stamp') {
            const store = useEditorStore.getState();
            store.setStampRotation((store.stampRotation + 90) % 360);
          } else {
            switchTool('path');
          }
        }],
        [KEYS.ERASER,           () => switchTool('eraser')],
        [KEYS.LIGHT,            () => switchTool('light')],
        [KEYS.FILL,             () => switchTool('fill')],
        [KEYS.COPY_STAMP,       () => switchTool('copy-stamp')],
        [KEYS.PAN,              () => switchTool('pan')],
        [KEYS.SNAP,             () => { useHistoryStore.getState().captureSnapshot(); useEditorStore.getState().setSnapToGrid(!useEditorStore.getState().snapToGrid); }],
        [KEYS.MIRROR,           () => useEditorStore.getState().setMirrorSymmetry(!useEditorStore.getState().mirrorSymmetry)],
        [KEYS.HOTKEYS,          () => useEditorStore.getState().setShowHotkeys(!useEditorStore.getState().showHotkeys)],
        [KEYS.Z_FORWARD,        () => {
          const sel = useEditorStore.getState().selectedElementIds;
          if (sel.length === 1) { useHistoryStore.getState().captureSnapshot(); useMapStore.getState().bringForward(sel[0]); }
        }],
        [KEYS.Z_BACKWARD,       () => {
          const sel = useEditorStore.getState().selectedElementIds;
          if (sel.length === 1) { useHistoryStore.getState().captureSnapshot(); useMapStore.getState().sendBackward(sel[0]); }
        }],
      ];

      for (const [binding, action] of bindings) {
        if (matchesKey(e, binding)) { action(e); return; }
      }
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('keyup', handleKeyUp); };
  }, [setTool]);
}
