/**
 * DOM utility functions
 */

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

/**
 * Create element with attributes and children
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Attributes to set
 * @param {...(string|HTMLElement)} children - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        el.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      el.appendChild(child);
    }
  });

  return el;
}

/**
 * Remove all children from element
 * @param {HTMLElement} element
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Toggle class on element
 * @param {HTMLElement} element
 * @param {string} className
 * @param {boolean} [force] - Force add/remove
 */
export function toggleClass(element, className, force) {
  if (force !== undefined) {
    element.classList.toggle(className, force);
  } else {
    element.classList.toggle(className);
  }
}

/**
 * Get element's bounding rect relative to another element
 * @param {HTMLElement} element
 * @param {HTMLElement} relativeTo
 * @returns {{x: number, y: number, width: number, height: number}}
 */
export function getRelativeBounds(element, relativeTo) {
  const elementRect = element.getBoundingClientRect();
  const relativeRect = relativeTo.getBoundingClientRect();
  
  return {
    x: elementRect.left - relativeRect.left,
    y: elementRect.top - relativeRect.top,
    width: elementRect.width,
    height: elementRect.height,
  };
}