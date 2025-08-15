// Re-export from modular utils for backward compatibility
export * from './utils/index.js';

// Legacy exports
export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
