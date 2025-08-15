/**
 * Object manipulation utilities
 */

/**
 * Get nested property value using dot notation
 * @param {Object} obj
 * @param {string} path
 * @returns {*}
 */
export function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((current, key) => (current == null ? current : current[key]), obj);
}

/**
 * Set nested property value using dot notation
 * @param {Object} obj
 * @param {string} path
 * @param {*} value
 */
export function setByPath(obj, path, value) {
  if (!obj || !path) return;
  
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;
  
  for (const key of keys) {
    if (typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * Deep clone an object
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
}

/**
 * Merge objects deeply
 * @param {Object} target
 * @param {...Object} sources
 * @returns {Object}
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is a plain object
 * @param {*} item
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Generate unique ID
 * @param {string} prefix
 * @returns {string}
 */
export const uid = (prefix = 'el') => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Debounce function calls
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}