/**
 * Element Registry - Manages available element types
 * Follows Open/Closed principle - new elements can be added without modification
 */

export default class ElementRegistry {
  constructor() {
    this.elements = new Map();
  }

  /**
   * Initialize registry with default elements
   */
  async init() {
    // Dynamic imports for better code splitting
    const elementModules = [
      { type: 'label', module: () => import('../elements/LabelElement.js'), label: 'Etichetta', icon: '📝' },
      { type: 'image', module: () => import('../elements/ImageElement.js'), label: 'Immagine', icon: '🖼️' },
      { type: 'textbox', module: () => import('../elements/TextBoxElement.js'), label: 'Campo testo', icon: '📝' },
      { type: 'checkbox', module: () => import('../elements/CheckboxElement.js'), label: 'Checkbox', icon: '☑️' },
      { type: 'radiogroup', module: () => import('../elements/RadioGroupElement.js'), label: 'Radio Group', icon: '🔘' },
    ];

    for (const { type, module, label, icon } of elementModules) {
      try {
        const elementModule = await module();
        const ElementClass = elementModule.default;
        
        this.register(type, ElementClass, { label, icon });
      } catch (error) {
        console.error(`Failed to load element type ${type}:`, error);
      }
    }
  }

  /**
   * Register an element type
   * @param {string} type - Element type identifier
   * @param {Class} ElementClass - Element class constructor
   * @param {Object} metadata - Additional metadata (label, icon, etc.)
   */
  register(type, ElementClass, metadata = {}) {
    if (!type || !ElementClass) {
      throw new Error('Type and ElementClass are required');
    }

    this.elements.set(type, {
      type,
      klass: ElementClass,
      label: metadata.label || type,
      icon: metadata.icon || '📄',
      category: metadata.category || 'general',
      ...metadata,
    });
  }

  /**
   * Get element info by type
   * @param {string} type
   * @returns {Object|null}
   */
  get(type) {
    return this.elements.get(type) || null;
  }

  /**
   * Get all registered elements
   * @returns {Array}
   */
  getAll() {
    return Array.from(this.elements.values());
  }

  /**
   * Get elements by category
   * @param {string} category
   * @returns {Array}
   */
  getByCategory(category) {
    return this.getAll().filter(element => element.category === category);
  }

  /**
   * Check if element type is registered
   * @param {string} type
   * @returns {boolean}
   */
  has(type) {
    return this.elements.has(type);
  }

  /**
   * Unregister element type
   * @param {string} type
   */
  unregister(type) {
    return this.elements.delete(type);
  }

  /**
   * Get available element types
   * @returns {Array<string>}
   */
  getTypes() {
    return Array.from(this.elements.keys());
  }

  /**
   * Create element instance by type
   * @param {string} type
   * @param {...*} args - Constructor arguments
   * @returns {BaseElement|null}
   */
  create(type, ...args) {
    const elementInfo = this.get(type);
    if (!elementInfo) {
      console.error(`Unknown element type: ${type}`);
      return null;
    }

    try {
      return new elementInfo.klass(...args);
    } catch (error) {
      console.error(`Failed to create element of type ${type}:`, error);
      return null;
    }
  }
}