import { lazy } from 'react';

const chunkReloadStorageKey = 'saas-dashboard:chunk-reload-attempted';
const chunkReloadCooldownMs = 60_000;

const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '');

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk') ||
    message.includes('MIME type')
  );
};

const reloadForFreshChunks = () => {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return false;
  }

  const lastReloadAttempt = Number(window.sessionStorage.getItem(chunkReloadStorageKey) || 0);

  if (Date.now() - lastReloadAttempt < chunkReloadCooldownMs) {
    return false;
  }

  window.sessionStorage.setItem(chunkReloadStorageKey, String(Date.now()));
  window.location.reload();
  return true;
};

export const lazyWithChunkRetry = (loader) =>
  lazy(async () => {
    try {
      return await loader();
    } catch (error) {
      if (isChunkLoadError(error) && reloadForFreshChunks()) {
        return new Promise(() => {});
      }

      throw error;
    }
  });
