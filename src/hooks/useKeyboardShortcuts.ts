import { useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';
import { useMapStore } from '../stores/mapStore';

import type { ToolName } from '../stores/editorStore';

export function useKeyboardShortcuts() {
  const setTool = useEditorStore((s) => s.setTool);

  useEffect(() => {
    const previousToolRef = { current: null as string | null };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && previousToolRef.current) {
        useEditorStore.getState().setTool(previousToolRef.current as ToolName);
        previousToolRef.current = null;
      }
    };

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'g') {
          e.preventDefault();
          if (e.shiftKey) {
            // Ctrl+Shift+G: Ungroup
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
          } else {
            // Ctrl+G: Group selected elements
            const selected = useEditorStore.getState().selectedElementIds;
            if (selected.length > 1) {
              useHistoryStore.getState().captureSnapshot();
              const groupId = useMapStore.getState().addGroup('New Group');
              selected.forEach(id => useMapStore.getState().setElementGroup(id, groupId));
              // Auto-focus rename on the new group
              useEditorStore.getState().setRenamingGroupId(groupId);
            }
          }
          return;
        }
        if (e.key === 'z') { e.preventDefault(); useHistoryStore.getState().undo(); return; }
        if (e.key === 'y') { e.preventDefault(); useHistoryStore.getState().redo(); return; }
        if (e.key === 's') { e.preventDefault(); return; }
        if (e.key === 'd') {
          e.preventDefault();
          const selected = useEditorStore.getState().selectedElementIds;
          if (selected.length > 0) {
            useHistoryStore.getState().captureSnapshot();
            const cellSize = useMapStore.getState().grid.cellSize;
            const newIds = useMapStore.getState().duplicateElements(selected, { x: cellSize, y: cellSize });
            useEditorStore.getState().select(newIds);
          }
          return;
        }
      }

      if (e.key === ' ') {
        e.preventDefault();
        previousToolRef.current = useEditorStore.getState().activeTool;
        setTool('pan');
        return;
      }

      const switchTool = (tool: ToolName) => {
        if (useEditorStore.getState().activeTool !== tool) {
          useHistoryStore.getState().captureSnapshot();
          setTool(tool);
        }
      };

      switch (e.key.toLowerCase()) {
        case 'v': switchTool('select'); break;
        case 'b': switchTool('stamp'); break;
        case 'p': switchTool('polygon'); break;
        case 'r':
          // When stamp tool is active, R rotates the stamp instead of switching tools
          if (useEditorStore.getState().activeTool === 'stamp') {
            const store = useEditorStore.getState();
            store.setStampRotation((store.stampRotation + 90) % 360);
          } else {
            switchTool('path');
          }
          break;
        case 'e': switchTool('eraser'); break;
        case 'h': switchTool('pan'); break;
        case 'g':
          useHistoryStore.getState().captureSnapshot();
          useEditorStore.getState().setSnapToGrid(!useEditorStore.getState().snapToGrid);
          break;
        case ']': {
          const sel = useEditorStore.getState().selectedElementIds;
          if (sel.length === 1) {
            useHistoryStore.getState().captureSnapshot();
            if (e.shiftKey) useMapStore.getState().bringToFront(sel[0]);
            else useMapStore.getState().bringForward(sel[0]);
          }
          break;
        }
        case '[': {
          const sel = useEditorStore.getState().selectedElementIds;
          if (sel.length === 1) {
            useHistoryStore.getState().captureSnapshot();
            if (e.shiftKey) useMapStore.getState().sendToBack(sel[0]);
            else useMapStore.getState().sendBackward(sel[0]);
          }
          break;
        }
        case 'delete':
        case 'backspace': {
          const selected = useEditorStore.getState().selectedElementIds;
          if (selected.length > 0) {
            useHistoryStore.getState().captureSnapshot();
            selected.forEach((id) => useMapStore.getState().removeElement(id));
            useEditorStore.getState().deselect();
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('keyup', handleKeyUp); };
  }, [setTool]);
}
