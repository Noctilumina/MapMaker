import { create } from 'zustand';
import type { MapProject } from '../types/index';

interface ProjectManagerState {
  tabs: MapProject[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  updateTab: (i: number, snap: MapProject) => void;
  addTab: (snap: MapProject) => void;
  removeTab: (i: number) => void;
}

export const useProjectManagerStore = create<ProjectManagerState>((set) => ({
  tabs: [],
  activeIndex: 0,
  setActiveIndex: (i) => set({ activeIndex: i }),
  updateTab: (i, snap) =>
    set((state) => {
      const tabs = [...state.tabs];
      tabs[i] = snap;
      return { tabs };
    }),
  addTab: (snap) =>
    set((state) => ({ tabs: [...state.tabs, snap] })),
  removeTab: (i) =>
    set((state) => ({ tabs: state.tabs.filter((_, idx) => idx !== i) })),
}));
