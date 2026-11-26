const DEMO_STORAGE_PREFIX = 'innosysedu.';

/** Clears only this prototype's namespaced browser-local demo records. */
export function resetDemoData(): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;
  const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(DEMO_STORAGE_PREFIX));
  keys.forEach((key) => window.localStorage.removeItem(key));
}
