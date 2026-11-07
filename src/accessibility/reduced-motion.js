import { settingsStore } from '../persistence/settings-store.js?v=20261107-2046';

export function prefersReducedMotion() {
  if (settingsStore.get('reducedMotion')) return true;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function shouldAnimate() {
  return settingsStore.get('animationsEnabled') && !prefersReducedMotion();
}