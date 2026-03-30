import { get, set, del, keys } from 'idb-keyval';
import type { MapProject } from '../types';
import { migrateProject } from './migration';

const PROJECT_PREFIX = 'mapmaker-project-';

export async function saveProject(project: MapProject): Promise<void> {
  await set(PROJECT_PREFIX + project.id, project);
}

export async function loadProject(id: string): Promise<MapProject | undefined> {
  return get(PROJECT_PREFIX + id);
}

export async function deleteProject(id: string): Promise<void> {
  await del(PROJECT_PREFIX + id);
}

export async function listProjectIds(): Promise<string[]> {
  const allKeys = await keys();
  return allKeys
    .filter((k) => typeof k === 'string' && k.startsWith(PROJECT_PREFIX))
    .map((k) => (k as string).slice(PROJECT_PREFIX.length));
}

export function exportProjectToFile(project: MapProject): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name || 'map'}.mapmaker.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProjectFromFile(): Promise<MapProject> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.mapmaker.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const text = await file.text();
      const project = migrateProject(JSON.parse(text));
      resolve(project);
    };
    input.click();
  });
}
