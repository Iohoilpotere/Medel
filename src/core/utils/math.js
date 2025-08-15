/**
 * Mathematical utility functions
 */

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Snap value to grid
 * @param {number} value
 * @param {number} grid
 * @returns {number}
 */
export const snapTo = (value, grid) => (grid ? Math.round(value / grid) * grid : value);

/**
 * Convert pixels to percentage
 * @param {number} px
 * @param {number} base
 * @returns {number}
 */
export const pxToPct = (px, base) => (base ? (px / base) * 100 : 0);

/**
 * Convert percentage to pixels
 * @param {number} pct
 * @param {number} base
 * @returns {number}
 */
export const pctToPx = (pct, base) => (base * pct) / 100;

/**
 * Convert client coordinates to stage coordinates
 * @param {MouseEvent} event
 * @param {HTMLElement} stage
 * @returns {{x: number, y: number}}
 */
export const clientToStage = (event, stage) => {
  const rect = stage.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

/**
 * Check if two values are approximately equal
 * @param {number} a
 * @param {number} b
 * @param {number} tolerance
 * @returns {boolean}
 */
export const approx = (a, b, tolerance = 0.06) => Math.abs(a - b) <= tolerance;

/**
 * Linear interpolation between two values
 * @param {number} start
 * @param {number} end
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number}
 */
export const lerp = (start, end, t) => start + (end - start) * t;

/**
 * Calculate distance between two points
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @returns {number}
 */
export const distance = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

/**
 * Calculate angle between two points in radians
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @returns {number}
 */
export const angle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

/**
 * Normalize angle to 0-2π range
 * @param {number} radians
 * @returns {number}
 */
export const normalizeAngle = (radians) => {
  while (radians < 0) radians += 2 * Math.PI;
  while (radians >= 2 * Math.PI) radians -= 2 * Math.PI;
  return radians;
};