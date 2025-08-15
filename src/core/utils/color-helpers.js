/**
 * Color helpers - Centralized color manipulation utilities
 * Reduces duplication across property panels and elements
 */

/**
 * Parse color string to RGBA components
 * @param {string} color - Color string (hex, rgb, rgba, hsl, etc.)
 * @returns {{r: number, g: number, b: number, a: number}|null}
 */
export function parseColor(color) {
  if (!color || typeof color !== 'string') return null;

  // Handle named colors and CSS functions by using browser parsing
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
    r: Math.max(0, Math.min(255, values[0] || 0)),
    g: Math.max(0, Math.min(255, values[1] || 0)),
    b: Math.max(0, Math.min(255, values[2] || 0)),
    a: values[3] !== undefined ? Math.max(0, Math.min(1, values[3])) : 1,
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
 * Format RGBA as CSS string
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
 * Convert RGB to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {{h: number, s: number, l: number}}
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {{r: number, g: number, b: number}}
 */
export function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Check if color is light or dark
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {boolean} True if light
 */
export function isLightColor(rgb) {
  if (!rgb) return false;
  
  // Calculate relative luminance using sRGB coefficients
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
 * Lighten color by percentage
 * @param {string} color
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string}
 */
export function lightenColor(color, percent) {
  const rgba = parseColor(color);
  if (!rgba) return color;

  const { r, g, b, a } = rgba;
  const { h, s, l } = rgbToHsl(r, g, b);
  
  const newL = Math.min(100, l + percent);
  const newRgb = hslToRgb(h, s, newL);
  
  return formatRgba({ ...newRgb, a });
}

/**
 * Darken color by percentage
 * @param {string} color
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string}
 */
export function darkenColor(color, percent) {
  const rgba = parseColor(color);
  if (!rgba) return color;

  const { r, g, b, a } = rgba;
  const { h, s, l } = rgbToHsl(r, g, b);
  
  const newL = Math.max(0, l - percent);
  const newRgb = hslToRgb(h, s, newL);
  
  return formatRgba({ ...newRgb, a });
}

/**
 * Adjust color opacity
 * @param {string} color
 * @param {number} opacity - New opacity (0-1)
 * @returns {string}
 */
export function adjustOpacity(color, opacity) {
  const rgba = parseColor(color);
  if (!rgba) return color;

  return formatRgba({ ...rgba, a: Math.max(0, Math.min(1, opacity)) });
}

/**
 * Mix two colors
 * @param {string} color1
 * @param {string} color2
 * @param {number} ratio - Mix ratio (0-1, 0 = all color1, 1 = all color2)
 * @returns {string}
 */
export function mixColors(color1, color2, ratio = 0.5) {
  const rgba1 = parseColor(color1);
  const rgba2 = parseColor(color2);
  
  if (!rgba1 || !rgba2) return color1;

  const mixed = {
    r: rgba1.r + (rgba2.r - rgba1.r) * ratio,
    g: rgba1.g + (rgba2.g - rgba1.g) * ratio,
    b: rgba1.b + (rgba2.b - rgba1.b) * ratio,
    a: rgba1.a + (rgba2.a - rgba1.a) * ratio,
  };

  return formatRgba(mixed);
}

/**
 * Get color palette from base color
 * @param {string} baseColor
 * @param {number} [steps=5] - Number of variations
 * @returns {Array<string>}
 */
export function generateColorPalette(baseColor, steps = 5) {
  const palette = [];
  const stepSize = 80 / (steps - 1); // Range from -40% to +40%
  
  for (let i = 0; i < steps; i++) {
    const adjustment = -40 + (i * stepSize);
    if (adjustment < 0) {
      palette.push(darkenColor(baseColor, Math.abs(adjustment)));
    } else if (adjustment > 0) {
      palette.push(lightenColor(baseColor, adjustment));
    } else {
      palette.push(baseColor);
    }
  }
  
  return palette;
}