/**
 * Core utilities barrel export
 */

export * from './dom.js';
export * from './math.js';
export * from './object.js';
export * from './color.js';
export * from './validation.js';

// Legacy exports for backward compatibility
export { $ as $, $$ as $$ } from './dom.js';
export { clamp, snapTo, pxToPct, pctToPx, clientToStage } from './math.js';
export { getByPath, setByPath, uid } from './object.js';