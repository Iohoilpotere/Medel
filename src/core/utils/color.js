/**
 * Color utility functions
 */

/**
 * Parse color string to RGBA components
 * @param {string} color - Color string (hex, rgb, rgba, hsl, etc.)
 * @returns {{r: number, g: number, b: number, a: number}|null}
 */
export function parseColor(color) {
  if (!color || typeof color !== 'string') return null;

  // Create a temporary element to let the browser parse the color
  const div = document.createElement('div');
  div.style.color = color;
  document.body.appendChild(div);
  
  const computedColor = getComputedStyle(div).color;
  document.body.removeChild(div);

  // Parse rgb/rgba format
  const match = computedColor.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;

  const values = match[1].split(',').map(v => parseFloat(v.trim()));
  return {
    r: values[0] || 0,
    g: values[1] || 0,
    b: values[2] || 0,
    a: values[3] !== undefined ? values[3] : 1,
  };
}

/**
 * Convert RGBA to hex string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {number} [a] - Alpha (0-1)
 * @returns {string}
 */
export function rgbaToHex(r, g, b, a) {
  const toHex = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  
  let hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  
  if (a !== undefined && a < 1) {
    hex += toHex(a * 255);
  }
  
  return hex;
}

/**
 * Convert hex to RGBA
 * @param {string} hex - Hex color string
 * @returns {{r: number, g: number, b: number, a: number}|null}
 */
export function hexToRgba(hex) {
  if (!hex || typeof hex !== 'string') return null;
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Handle 6 or 8 digit hex
  if (hex.length !== 6 && hex.length !== 8) return null;
  
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  
  return { r, g, b, a };
}

/**
 * Format color as CSS string
 * @param {{r: number, g: number, b: number, a: number}} rgba
 * @returns {string}
 */
export function formatRgba(rgba) {
  if (!rgba) return 'transparent';
  
  const { r, g, b, a } = rgba;
  
  if (a === 1) {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  } else {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  }
}

/**
 * Check if color is light or dark
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {boolean} True if light
 */
export function isLightColor(rgb) {
  if (!rgb) return false;
  
  // Calculate relative luminance
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
}

/**
 * Generate contrasting color (black or white)
 * @param {string} backgroundColor
 * @returns {string}
 */
export function getContrastColor(backgroundColor) {
  const rgb = parseColor(backgroundColor);
  return isLightColor(rgb) ? '#000000' : '#ffffff';
}

/**
 * Validate CSS color string
 * @param {string} color
 * @returns {boolean}
 */
export function isValidColor(color) {
  if (!color || typeof color !== 'string') return false;
  
  const div = document.createElement('div');
  div.style.color = color;
  return div.style.color !== '';
}