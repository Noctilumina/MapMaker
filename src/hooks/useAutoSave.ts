import { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/mapStore';
import { saveProject } from '../utils/storage';

export function useAutoSave(debounceMs = 2000) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const unsub = useMapStore.subscribe(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const { id, name, version, grid, layers, elements, assets, groups } = useMapStore.getState();
        saveProject({ id, name, version, grid, layers, elements, assets, groups });
      }, debounceMs);
    });

    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [debounceMs]);
}
