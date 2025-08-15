/**
 * Validation helpers - Centralized validation logic
 * Reduces duplication across property panels and elements
 */

/**
 * Validate and compile regex pattern
 * @param {string} pattern - Regex pattern string
 * @returns {{isValid: boolean, compiled: RegExp|null, body: string, flags: string, error?: string}}
 */
export function validateRegexPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    return { isValid: true, compiled: null, body: '', flags: '' }; // Empty is valid
  }

  const trimmed = pattern.trim();
  let body = '';
  let flags = '';
  let compiled = null;

  try {
    // Parse /pattern/flags format
    if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
      const lastSlash = trimmed.lastIndexOf('/');
      body = trimmed.slice(1, lastSlash);
      flags = trimmed.slice(lastSlash + 1);
    } else {
      body = trimmed;
    }

    // Clean flags (only allow valid regex flags)
    flags = flags.replace(/[^gimsuy]/g, '');

    compiled = new RegExp(body, flags);
    return { isValid: true, compiled, body, flags };
  } catch (error) {
    return { 
      isValid: false, 
      compiled: null, 
      body, 
      flags, 
      error: error.message 
    };
  }
}

/**
 * Validate CSS color value
 * @param {string} color
 * @returns {{isValid: boolean, normalized?: string, error?: string}}
 */
export function validateColor(color) {
  if (!color || typeof color !== 'string') {
    return { isValid: true, normalized: 'transparent' }; // Empty is valid
  }

  const trimmed = color.trim();
  
  // Test with temporary element
  const div = document.createElement('div');
  div.style.color = trimmed;
  
  if (div.style.color) {
    return { isValid: true, normalized: div.style.color };
  }
  
  return { isValid: false, error: 'Invalid color format' };
}

/**
 * Validate URL
 * @param {string} url
 * @returns {{isValid: boolean, normalized?: string, error?: string}}
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: true, normalized: '' }; // Empty is valid
  }

  const trimmed = url.trim();
  
  try {
    const urlObj = new URL(trimmed);
    return { isValid: true, normalized: urlObj.href };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate number within range
 * @param {*} value
 * @param {Object} options
 * @param {number} [options.min]
 * @param {number} [options.max]
 * @param {number} [options.step]
 * @returns {{isValid: boolean, normalized?: number, error?: string}}
 */
export function validateNumber(value, options = {}) {
  const { min, max, step } = options;
  
  const num = Number(value);
  if (isNaN(num)) {
    return { isValid: false, error: 'Not a valid number' };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `Value must be at most ${max}` };
  }

  let normalized = num;
  if (step !== undefined && step > 0) {
    normalized = Math.round(num / step) * step;
  }

  return { isValid: true, normalized };
}

/**
 * Validate email address
 * @param {string} email
 * @returns {{isValid: boolean, normalized?: string, error?: string}}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: true, normalized: '' }; // Empty is valid
  }

  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailRegex.test(trimmed)) {
    return { isValid: true, normalized: trimmed.toLowerCase() };
  }
  
  return { isValid: false, error: 'Invalid email format' };
}

/**
 * Validate CSS length value
 * @param {string} value
 * @returns {{isValid: boolean, normalized?: string, error?: string}}
 */
export function validateCssLength(value) {
  if (!value || typeof value !== 'string') {
    return { isValid: true, normalized: '0' };
  }

  const trimmed = value.trim();
  const lengthRegex = /^-?\d*\.?\d+(px|em|rem|%|vh|vw|vmin|vmax|ch|ex)?$/;
  
  if (lengthRegex.test(trimmed)) {
    return { isValid: true, normalized: trimmed };
  }
  
  return { isValid: false, error: 'Invalid CSS length format' };
}

/**
 * Sanitize HTML string
 * @param {string} html
 * @returns {string}
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate and normalize font weight
 * @param {*} weight
 * @returns {{isValid: boolean, normalized?: number, error?: string}}
 */
export function validateFontWeight(weight) {
  const num = Number(weight);
  
  if (isNaN(num)) {
    // Try named weights
    const namedWeights = {
      'normal': 400,
      'bold': 700,
      'lighter': 300,
      'bolder': 600
    };
    
    const named = namedWeights[String(weight).toLowerCase()];
    if (named) {
      return { isValid: true, normalized: named };
    }
    
    return { isValid: false, error: 'Invalid font weight' };
  }

  // Clamp to valid range and round to nearest 100
  const clamped = Math.max(100, Math.min(900, num));
  const rounded = Math.round(clamped / 100) * 100;
  
  return { isValid: true, normalized: rounded };
}