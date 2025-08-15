/**
 * Core interfaces and type definitions for the editor
 * @fileoverview Type definitions using JSDoc for better IDE support
 */

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Size
 * @property {number} w
 * @property {number} h
 */

/**
 * @typedef {Object} Bounds
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

/**
 * @typedef {Object} Theme
 * @property {string} id
 * @property {string} label
 * @property {Object<string, string>} tokens
 * @property {function(HTMLElement=): void} apply
 */

/**
 * @typedef {Object} PropertyDef
 * @property {string} key - Property path (supports dot notation)
 * @property {string} label - Display label
 * @property {string} type - Input type (text, number, checkbox, select, etc.)
 * @property {string} [section] - Section grouping
 * @property {string} [group] - Group within section
 * @property {number} [min] - Minimum value for numbers
 * @property {number} [max] - Maximum value for numbers
 * @property {number} [step] - Step for number inputs
 * @property {Array<[string, string]>} [options] - Options for select inputs
 */

/**
 * @typedef {Object} ElementData
 * @property {string} id
 * @property {string} type
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 * @property {number} rotation
 * @property {number} z
 * @property {boolean} lockRatio
 * @property {string} tooltip
 */

/**
 * @typedef {Object} StepData
 * @property {string} id
 * @property {string} name
 * @property {string} orient
 * @property {string} bgUrl
 * @property {Array<ElementData>} items
 */

/**
 * @typedef {Object} CategoryData
 * @property {string} id
 * @property {string} name
 * @property {Array<StepData>} steps
 * @property {boolean} collapsed
 */

/**
 * Interface for serializable objects
 * @interface Serializable
 */
export class Serializable {
  /**
   * @returns {Object} JSON representation
   */
  toJSON() {
    throw new Error('toJSON must be implemented');
  }

  /**
   * @param {Object} data - JSON data to restore from
   */
  fromJSON(data) {
    throw new Error('fromJSON must be implemented');
  }
}

/**
 * Interface for themeable components
 * @interface Themeable
 */
export class Themeable {
  /**
   * @param {Theme} theme - Theme to apply
   */
  applyTheme(theme) {
    throw new Error('applyTheme must be implemented');
  }
}

/**
 * Interface for elements that can be selected and manipulated
 * @interface Selectable
 */
export class Selectable {
  /**
   * @param {boolean} selected - Selection state
   */
  setSelected(selected) {
    throw new Error('setSelected must be implemented');
  }

  /**
   * @returns {boolean} Current selection state
   */
  isSelected() {
    throw new Error('isSelected must be implemented');
  }
}