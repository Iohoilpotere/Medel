/**
 * DOM helpers - Centralized DOM manipulation utilities
 * Reduces duplication across components
 */

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
    } else if (value !== null && value !== undefined) {
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
 * Toggle class on element with optional force
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
 * Add multiple classes to element
 * @param {HTMLElement} element
 * @param {...string} classNames
 */
export function addClasses(element, ...classNames) {
  element.classList.add(...classNames);
}

/**
 * Remove multiple classes from element
 * @param {HTMLElement} element
 * @param {...string} classNames
 */
export function removeClasses(element, ...classNames) {
  element.classList.remove(...classNames);
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

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view if needed
 * @param {HTMLElement} element
 * @param {Object} [options]
 */
export function scrollIntoViewIfNeeded(element, options = {}) {
  if (!isElementVisible(element)) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
      ...options
    });
  }
}

/**
 * Create form control with label
 * @param {string} type - Input type
 * @param {string} label - Label text
 * @param {Object} attrs - Additional attributes
 * @returns {{container: HTMLElement, input: HTMLElement, label: HTMLElement}}
 */
export function createFormControl(type, label, attrs = {}) {
  const id = attrs.id || `input-${Math.random().toString(36).slice(2)}`;
  
  const container = createElement('div', { className: 'form-control-container' });
  
  const labelEl = createElement('label', {
    htmlFor: id,
    className: 'form-label'
  }, label);
  
  const input = createElement('input', {
    type,
    id,
    className: 'form-control',
    ...attrs
  });
  
  container.appendChild(labelEl);
  container.appendChild(input);
  
  return { container, input, label: labelEl };
}

/**
 * Create select control with options
 * @param {string} label - Label text
 * @param {Array<[string, string]>} options - [value, label] pairs
 * @param {Object} attrs - Additional attributes
 * @returns {{container: HTMLElement, select: HTMLElement, label: HTMLElement}}
 */
export function createSelectControl(label, options, attrs = {}) {
  const id = attrs.id || `select-${Math.random().toString(36).slice(2)}`;
  
  const container = createElement('div', { className: 'form-control-container' });
  
  const labelEl = createElement('label', {
    htmlFor: id,
    className: 'form-label'
  }, label);
  
  const select = createElement('select', {
    id,
    className: 'form-select',
    ...attrs
  });
  
  options.forEach(([value, optionLabel]) => {
    const option = createElement('option', { value }, optionLabel);
    select.appendChild(option);
  });
  
  container.appendChild(labelEl);
  container.appendChild(select);
  
  return { container, select, label: labelEl };
}

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

/**
 * Wait for element to be added to DOM
 * @param {string} selector
 * @param {HTMLElement} [parent=document]
 * @param {number} [timeout=5000]
 * @returns {Promise<HTMLElement>}
 */
export function waitForElement(selector, parent = document, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = parent.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const found = node.matches?.(selector) ? node : node.querySelector?.(selector);
            if (found) {
              observer.disconnect();
              resolve(found);
              return;
            }
          }
        }
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}