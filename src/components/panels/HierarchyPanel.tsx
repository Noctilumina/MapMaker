import { useState, useEffect } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';
import { theme } from '../../theme';
import type { Group, MapElement } from '../../types';

function GroupNode({ group, depth }: { group: Group; depth: number }) {
  const elements = useMapStore((s) => s.elements);
  const groups = useMapStore((s) => s.groups);
  const updateGroup = useMapStore((s) => s.updateGroup);
  const removeGroup = useMapStore((s) => s.removeGroup);
  const duplicateGroup = useMapStore((s) => s.duplicateGroup);
  const select = useEditorStore((s) => s.select);
  const renamingGroupId = useEditorStore((s) => s.renamingGroupId);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState(group.name);
  const [showContext, setShowContext] = useState(false);

  useEffect(() => {
    if (renamingGroupId === group.id) {
      setRenameName(group.name);
      setRenaming(true);
      useEditorStore.getState().setRenamingGroupId(null);
    }
  }, [renamingGroupId, group.id, group.name]);

  const childGroups = groups.filter(g => g.parentId === group.id);
  const childElements = elements.filter(el => el.groupId === group.id);

  const getAllDescendantElementIds = (gid: string): string[] => {
    const directEls = elements.filter(el => el.groupId === gid).map(el => el.id);
    const childGs = groups.filter(g => g.parentId === gid);
    return [...directEls, ...childGs.flatMap(g => getAllDescendantElementIds(g.id))];
  };

  const handleClick = () => {
    const allIds = getAllDescendantElementIds(group.id);
    select(allIds);
  };

  const handleRenameSubmit = () => {
    if (renameName.trim()) updateGroup(group.id, { name: renameName.trim() });
    setRenaming(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('mapmaker/group', group.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedGroupId = e.dataTransfer.getData('mapmaker/group');
    const droppedElementId = e.dataTransfer.getData('mapmaker/element');
    if (droppedGroupId && droppedGroupId !== group.id) {
      useMapStore.getState().updateGroup(droppedGroupId, { parentId: group.id });
    }
    if (droppedElementId) {
      useMapStore.getState().setElementGroup(droppedElementId, group.id);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setShowContext(!showContext); }}
        draggable
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 6px', paddingLeft: depth * 16 + 6,
          cursor: 'pointer', fontSize: 11, background: 'transparent', position: 'relative',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = theme.surface)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <span onClick={(e) => { e.stopPropagation(); updateGroup(group.id, { collapsed: !group.collapsed }); }}
          style={{ cursor: 'pointer', fontSize: 8, width: 12, textAlign: 'center' }}>
          {group.collapsed ? '▶' : '▼'}
        </span>
        <button onClick={(e) => { e.stopPropagation(); updateGroup(group.id, { visible: !group.visible }); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, opacity: group.visible ? 1 : 0.3, padding: 0 }}>
          👁
        </button>
        {renaming ? (
          <input value={renameName} onChange={(e) => setRenameName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenaming(false); }}
            autoFocus onClick={(e) => e.stopPropagation()}
            style={{ flex: 1, background: theme.surface, color: theme.text, border: `1px solid ${theme.primary}`, borderRadius: theme.radius, padding: '0 4px', fontSize: 11, outline: 'none' }} />
        ) : (
          <span onDoubleClick={(e) => { e.stopPropagation(); setRenameName(group.name); setRenaming(true); }}
            style={{ flex: 1, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.name}
          </span>
        )}
        <button onClick={(e) => { e.stopPropagation(); updateGroup(group.id, { locked: !group.locked }); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 8, opacity: group.locked ? 1 : 0.3, padding: 0 }}>
          🔒
        </button>
      </div>
      {showContext && (
        <div style={{
          position: 'absolute', zIndex: 200, background: theme.bg, border: theme.borderHeavy,
          borderRadius: theme.radius, padding: 4, minWidth: 120, marginLeft: depth * 16 + 6, boxShadow: theme.shadowMd,
        }}>
          {[
            { label: 'Rename', action: () => { setRenameName(group.name); setRenaming(true); setShowContext(false); } },
            { label: 'Duplicate', action: () => { useHistoryStore.getState().captureSnapshot(); duplicateGroup(group.id, { x: 64, y: 64 }); setShowContext(false); } },
            { label: 'Ungroup', action: () => { useHistoryStore.getState().captureSnapshot(); removeGroup(group.id); setShowContext(false); } },
            { label: 'Delete All', action: () => {
              useHistoryStore.getState().captureSnapshot();
              getAllDescendantElementIds(group.id).forEach(id => useMapStore.getState().removeElement(id));
              removeGroup(group.id); setShowContext(false);
            }},
          ].map(item => (
            <div key={item.label} onClick={(e) => { e.stopPropagation(); item.action(); }}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: theme.textMuted, borderRadius: theme.radius, fontFamily: theme.fontHeading, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.surface)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              {item.label}
            </div>
          ))}
        </div>
      )}
      {!group.collapsed && (
        <>
          {childGroups.map(cg => <GroupNode key={cg.id} group={cg} depth={depth + 1} />)}
          {childElements.map(el => <ElementNode key={el.id} element={el} depth={depth + 1} />)}
        </>
      )}
    </div>
  );
}

function ElementNode({ element, depth }: { element: MapElement; depth: number }) {
  const assets = useMapStore((s) => s.assets);
  const select = useEditorStore((s) => s.select);
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
  const isSelected = selectedIds.includes(element.id);
  const assetId = 'assetId' in element ? element.assetId : undefined;
  const asset = assetId ? assets[assetId] : undefined;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('mapmaker/element', element.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div onClick={() => select([element.id])} draggable onDragStart={handleDragStart}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '2px 6px', paddingLeft: depth * 16 + 18,
        cursor: 'pointer', fontSize: 11,
        background: isSelected ? theme.borderSubtle : 'transparent',
        color: isSelected ? theme.text : theme.textMuted,
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = theme.surface; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {asset?.name || assetId || element.type}
      </span>
    </div>
  );
}

export default function HierarchyPanel() {
  const groups = useMapStore((s) => s.groups);
  const elements = useMapStore((s) => s.elements);
  const topGroups = groups.filter(g => g.parentId === null);
  const ungroupedElements = elements.filter(el => el.groupId === null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header panel-header--warning" style={{ color: theme.warning }}>
        Hierarchy
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {topGroups.map(g => <GroupNode key={g.id} group={g} depth={0} />)}
        {ungroupedElements.map(el => <ElementNode key={el.id} element={el} depth={0} />)}
        {topGroups.length === 0 && ungroupedElements.length === 0 && (
          <div style={{ padding: '8px 12px', color: theme.textMuted, fontSize: 11 }}>No elements yet</div>
        )}
      </div>
    </div>
  );
}
