/**
 * Validation utility functions
 */

/**
 * Validate and compile regex pattern
 * @param {string} pattern - Regex pattern string
 * @returns {{isValid: boolean, compiled: RegExp|null, body: string, flags: string}}
 */
export function validateRegexPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    return { isValid: false, compiled: null, body: '', flags: '' };
  }

  const trimmed = pattern.trim();
  let body = '';
  let flags = '';
  let compiled = null;

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

  try {
    compiled = new RegExp(body, flags);
    return { isValid: true, compiled, body, flags };
  } catch (error) {
    return { isValid: false, compiled: null, body, flags };
  }
}

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate number within range
 * @param {*} value
 * @param {number} [min]
 * @param {number} [max]
 * @returns {boolean}
 */
export function isValidNumber(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) return false;
  
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
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
 * Validate CSS property value
 * @param {string} property
 * @param {string} value
 * @returns {boolean}
 */
export function isValidCssValue(property, value) {
  if (!property || !value) return false;
  
  const div = document.createElement('div');
  div.style[property] = value;
  return div.style[property] !== '';
}