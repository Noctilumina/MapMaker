import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StampTemplateEntry } from './editorStore';

export interface Prefab {
  id: string;
  name: string;
  template: StampTemplateEntry[];
}

interface PrefabState {
  prefabs: Prefab[];
  savePrefab: (name: string, template: StampTemplateEntry[]) => void;
  deletePrefab: (id: string) => void;
  renamePrefab: (id: string, name: string) => void;
}

export const usePrefabStore = create<PrefabState>()(
  persist(
    (set) => ({
      prefabs: [],

      savePrefab: (name, template) =>
        set((state) => ({
          prefabs: [
            ...state.prefabs,
            { id: `prefab-${Date.now()}`, name, template },
          ],
        })),

      deletePrefab: (id) =>
        set((state) => ({
          prefabs: state.prefabs.filter((p) => p.id !== id),
        })),

      renamePrefab: (id, name) =>
        set((state) => ({
          prefabs: state.prefabs.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
    }),
    { name: 'mapmaker-prefabs' }
  )
);
