/**
 * Element interfaces and contracts
 * Defines the contracts that elements must implement
 */

/**
 * @interface IElement
 * Base interface for all elements
 */
export class IElement {
  /**
   * Create DOM representation
   * @returns {HTMLElement}
   */
  createDom() {
    throw new Error('createDom must be implemented');
  }

  /**
   * Mount element to parent
   * @param {HTMLElement} parent
   */
  mount(parent) {
    throw new Error('mount must be implemented');
  }

  /**
   * Unmount element
   */
  unmount() {
    throw new Error('unmount must be implemented');
  }

  /**
   * Apply transform (position, size, rotation)
   */
  applyTransform() {
    throw new Error('applyTransform must be implemented');
  }

  /**
   * Set selection state
   * @param {boolean} selected
   */
  setSelected(selected) {
    throw new Error('setSelected must be implemented');
  }

  /**
   * Get property schema for UI generation
   * @returns {Array<PropertyDef>}
   */
  getPropSchema() {
    throw new Error('getPropSchema must be implemented');
  }

  /**
   * Read properties and update DOM
   */
  readProps() {
    throw new Error('readProps must be implemented');
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    throw new Error('toJSON must be implemented');
  }
}

/**
 * @interface ISelectable
 * Interface for selectable objects
 */
export class ISelectable {
  /**
   * Set selection state
   * @param {boolean} selected
   */
  setSelected(selected) {
    throw new Error('setSelected must be implemented');
  }

  /**
   * Check if selected
   * @returns {boolean}
   */
  isSelected() {
    throw new Error('isSelected must be implemented');
  }
}

/**
 * @interface ITransformable
 * Interface for transformable objects
 */
export class ITransformable {
  /**
   * Apply geometric transform
   */
  applyTransform() {
    throw new Error('applyTransform must be implemented');
  }

  /**
   * Get bounds
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getBounds() {
    throw new Error('getBounds must be implemented');
  }

  /**
   * Set bounds
   * @param {{x: number, y: number, w: number, h: number}} bounds
   */
  setBounds(bounds) {
    throw new Error('setBounds must be implemented');
  }
}

/**
 * @interface ISerializable
 * Interface for serializable objects
 */
export class ISerializable {
  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    throw new Error('toJSON must be implemented');
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   */
  fromJSON(data) {
    throw new Error('fromJSON must be implemented');
  }
}