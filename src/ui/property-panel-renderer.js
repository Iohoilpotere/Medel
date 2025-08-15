/**
 * Renders property panels with sections, groups, and various input types
 */

import { $ } from '../core/utils/index.js';
import { createElement, clearElement } from '../core/utils/dom-helpers.js';
import { getByPath, setByPath } from '../core/utils/object.js';
import { parseColor, formatRgba, hexToRgba } from '../core/utils/color-helpers.js';

export default class PropertyPanelRenderer {
  constructor(commandManager) {
    this.commandManager = commandManager;
    this.form = $('#propForm');
    this.currentElements = [];
  }

  /**
   * Render properties for selected elements
   * @param {Array} elements - Selected elements
   */
  render(elements) {
    this.currentElements = elements;
    
    if (!this.form) return;
    
    clearElement(this.form);

    if (elements.length === 0) {
      this.renderEmptyState();
      return;
    }

    if (elements.length === 1) {
      this.renderSingleElement(elements[0]);
    } else {
      this.renderMultipleElements(elements);
    }
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    const message = createElement('div', {
      className: 'text-secondary small'
    }, 'Nessun elemento selezionato');
    
    this.form.appendChild(message);
  }

  /**
   * Render properties for single element
   * @param {BaseElement} element
   */
  renderSingleElement(element) {
    const schema = element.getPropSchema();
    const sections = this.groupBySection(schema);
    
    Object.entries(sections).forEach(([sectionName, properties]) => {
      this.renderSection(sectionName, properties, element);
    });
  }

  /**
   * Render properties for multiple elements (common properties only)
   * @param {Array} elements
   */
  renderMultipleElements(elements) {
    // Find common properties across all selected elements
    const commonSchema = this.findCommonProperties(elements);
    const sections = this.groupBySection(commonSchema);
    
    // Add multi-selection header
    const header = createElement('div', {
      className: 'mb-3 p-2 bg-primary bg-opacity-10 rounded'
    }, `${elements.length} elementi selezionati`);
    
    this.form.appendChild(header);
    
    Object.entries(sections).forEach(([sectionName, properties]) => {
      this.renderSection(sectionName, properties, elements);
    });
  }

  /**
   * Group properties by section
   * @param {Array} schema
   * @returns {Object}
   */
  groupBySection(schema) {
    const sections = {};
    
    schema.forEach(prop => {
      const sectionName = prop.section || 'Generale';
      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }
      sections[sectionName].push(prop);
    });
    
    return sections;
  }

  /**
   * Find common properties across multiple elements
   * @param {Array} elements
   * @returns {Array}
   */
  findCommonProperties(elements) {
    if (elements.length === 0) return [];
    
    const firstSchema = elements[0].getPropSchema();
    
    return firstSchema.filter(prop => {
      return elements.every(element => {
        const elementSchema = element.getPropSchema();
        return elementSchema.some(p => p.key === prop.key && p.type === prop.type);
      });
    });
  }

  /**
   * Render a property section
   * @param {string} sectionName
   * @param {Array} properties
   * @param {BaseElement|Array} elementOrElements
   */
  renderSection(sectionName, properties, elementOrElements) {
    const section = createElement('div', {
      className: 'prop-section',
      dataset: { collapsed: '0' }
    });

    // Section header
    const header = createElement('div', {
      className: 'prop-head',
      onClick: () => this.toggleSection(section)
    });

    const title = createElement('div', {
      className: 'title'
    }, sectionName);

    const toggle = createElement('span', {}, '▼');

    header.appendChild(title);
    header.appendChild(toggle);
    section.appendChild(header);

    // Section body
    const body = createElement('div', {
      className: 'prop-body'
    });

    // Group properties by group
    const groups = this.groupByGroup(properties);
    
    Object.entries(groups).forEach(([groupName, groupProps]) => {
      if (groupName === 'null') {
        // Ungrouped properties
        groupProps.forEach(prop => {
          body.appendChild(this.renderProperty(prop, elementOrElements));
        });
      } else {
        // Grouped properties
        body.appendChild(this.renderPropertyGroup(groupName, groupProps, elementOrElements));
      }
    });

    section.appendChild(body);
    this.form.appendChild(section);
  }

  /**
   * Group properties by group
   * @param {Array} properties
   * @returns {Object}
   */
  groupByGroup(properties) {
    const groups = {};
    
    properties.forEach(prop => {
      const groupName = prop.group || 'null';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(prop);
    });
    
    return groups;
  }

  /**
   * Render a property group
   * @param {string} groupName
   * @param {Array} properties
   * @param {BaseElement|Array} elementOrElements
   * @returns {HTMLElement}
   */
  renderPropertyGroup(groupName, properties, elementOrElements) {
    const row = createElement('div', {
      className: 'prop-row'
    });

    // Group label (use first property's label or group name)
    const firstProp = properties[0];
    const label = createElement('label', {
      className: 'form-label small'
    }, firstProp.label || groupName);

    const groupContainer = createElement('div', {
      className: 'prop-group'
    });

    properties.forEach(prop => {
      const mini = createElement('div', {
        className: 'mini'
      });

      if (prop.label) {
        const miniLabel = createElement('label', {
          className: 'small-label icon'
        }, prop.label);
        mini.appendChild(miniLabel);
      }

      const input = this.createInput(prop, elementOrElements);
      mini.appendChild(input);

      groupContainer.appendChild(mini);
    });

    row.appendChild(label);
    row.appendChild(groupContainer);

    return row;
  }

  /**
   * Render a single property
   * @param {Object} prop
   * @param {BaseElement|Array} elementOrElements
   * @returns {HTMLElement}
   */
  renderProperty(prop, elementOrElements) {
    const row = createElement('div', {
      className: 'prop-row'
    });

    const label = createElement('label', {
      className: 'form-label small'
    }, prop.label);

    const inputContainer = createElement('div', {
      className: 'prop-input'
    });

    if (prop.type === 'color-alpha') {
      inputContainer.appendChild(this.createColorAlphaInput(prop, elementOrElements));
    } else {
      const input = this.createInput(prop, elementOrElements);
      inputContainer.appendChild(input);
    }

    row.appendChild(label);
    row.appendChild(inputContainer);

    return row;
  }

  /**
   * Create input element for property
   * @param {Object} prop
   * @param {BaseElement|Array} elementOrElements
   * @returns {HTMLElement}
   */
  createInput(prop, elementOrElements) {
    const isMultiple = Array.isArray(elementOrElements);
    const elements = isMultiple ? elementOrElements : [elementOrElements];
    
    // Get current value
    const currentValue = this.getCurrentValue(prop.key, elements);
    
    let input;

    switch (prop.type) {
      case 'text':
      case 'url':
        input = createElement('input', {
          type: prop.type,
          className: 'form-control form-control-sm',
          value: currentValue || ''
        });
        break;

      case 'textarea':
        input = createElement('textarea', {
          className: 'form-control form-control-sm',
          rows: 3
        });
        input.value = currentValue || '';
        break;

      case 'number':
      case 'range':
        input = createElement('input', {
          type: prop.type,
          className: prop.type === 'range' ? 'form-range' : 'form-control form-control-sm',
          min: prop.min,
          max: prop.max,
          step: prop.step
        });
        input.value = currentValue || 0;
        break;

      case 'checkbox':
        input = createElement('input', {
          type: 'checkbox',
          className: 'form-check-input'
        });
        input.checked = !!currentValue;
        break;

      case 'select':
        input = createElement('select', {
          className: 'form-select form-select-sm'
        });
        
        if (prop.options) {
          prop.options.forEach(([value, label]) => {
            const option = createElement('option', {
              value: value
            }, label);
            
            if (value === currentValue) {
              option.selected = true;
            }
            
            input.appendChild(option);
          });
        }
        break;

      case 'color':
        input = createElement('input', {
          type: 'color',
          className: 'form-control form-control-color',
          value: currentValue || '#000000'
        });
        break;

      default:
        input = createElement('input', {
          type: 'text',
          className: 'form-control form-control-sm',
          value: currentValue || ''
        });
    }

    // Add change listener
    this.addChangeListener(input, prop, elements);

    return input;
  }

  /**
   * Create color-alpha input (color picker + alpha slider)
   * @param {Object} prop
   * @param {BaseElement|Array} elementOrElements
   * @returns {HTMLElement}
   */
  createColorAlphaInput(prop, elementOrElements) {
    const isMultiple = Array.isArray(elementOrElements);
    const elements = isMultiple ? elementOrElements : [elementOrElements];
    
    const currentValue = this.getCurrentValue(prop.key, elements) || 'rgba(0,0,0,1)';
    const rgba = parseColor(currentValue) || { r: 0, g: 0, b: 0, a: 1 };

    const container = createElement('div', {
      className: 'color-alpha'
    });

    // Color picker
    const colorPicker = createElement('input', {
      type: 'color',
      className: 'form-control-color',
      value: `#${Math.round(rgba.r).toString(16).padStart(2, '0')}${Math.round(rgba.g).toString(16).padStart(2, '0')}${Math.round(rgba.b).toString(16).padStart(2, '0')}`
    });

    // Hex input
    const hexInput = createElement('input', {
      type: 'text',
      className: 'form-control form-control-sm hex-input',
      value: colorPicker.value,
      placeholder: '#000000'
    });

    // Alpha controls
    const alphaContainer = createElement('div', {
      className: 'prop-two'
    });

    const alphaInput = createElement('input', {
      type: 'number',
      className: 'form-control form-control-sm w-70',
      min: 0,
      max: 100,
      value: Math.round(rgba.a * 100)
    });

    const alphaLabel = createElement('span', {
      className: 'small-label w-30'
    }, '%');

    alphaContainer.appendChild(alphaInput);
    alphaContainer.appendChild(alphaLabel);

    container.appendChild(colorPicker);
    container.appendChild(hexInput);
    container.appendChild(alphaContainer);

    // Add change listeners
    const updateColor = () => {
      const hex = hexInput.value;
      const alpha = parseInt(alphaInput.value) / 100;
      const color = hexToRgba(hex);
      
      if (color) {
        color.a = alpha;
        const cssColor = formatRgba(color);
        this.updateProperty(prop.key, cssColor, elements);
      }
    };

    colorPicker.addEventListener('change', (e) => {
      hexInput.value = e.target.value;
      updateColor();
    });

    hexInput.addEventListener('change', updateColor);
    alphaInput.addEventListener('change', updateColor);

    return container;
  }

  /**
   * Get current value for property from elements
   * @param {string} key
   * @param {Array} elements
   * @returns {*}
   */
  getCurrentValue(key, elements) {
    if (elements.length === 0) return undefined;
    
    const firstValue = getByPath(elements[0], key);
    
    // For multiple elements, return value only if all elements have the same value
    if (elements.length > 1) {
      const allSame = elements.every(element => {
        const value = getByPath(element, key);
        return value === firstValue;
      });
      
      return allSame ? firstValue : '';
    }
    
    return firstValue;
  }

  /**
   * Add change listener to input
   * @param {HTMLElement} input
   * @param {Object} prop
   * @param {Array} elements
   */
  addChangeListener(input, prop, elements) {
    const handler = (event) => {
      let value = event.target.value;
      
      // Convert value based on type
      if (prop.type === 'number' || prop.type === 'range') {
        value = parseFloat(value);
        if (isNaN(value)) value = 0;
      } else if (prop.type === 'checkbox') {
        value = event.target.checked;
      }
      
      this.updateProperty(prop.key, value, elements);
    };

    input.addEventListener('change', handler);
    
    // For text inputs, also listen to input event for live updates
    if (['text', 'textarea', 'url'].includes(prop.type)) {
      input.addEventListener('input', handler);
    }
  }

  /**
   * Update property value on elements
   * @param {string} key
   * @param {*} value
   * @param {Array} elements
   */
  updateProperty(key, value, elements) {
    if (!this.commandManager || elements.length === 0) return;

    elements.forEach(element => {
      const oldValue = getByPath(element, key);
      
      if (oldValue !== value) {
        const { ChangePropertyCommand } = await import('../commands/element-commands.js');
        const command = new ChangePropertyCommand(
          window.editorInstance, // editor context
          element,
          key,
          value,
          oldValue,
          `Modifica ${key}`
        );
        
        this.commandManager.executeCommand(command);
      }
    });
  }

  /**
   * Toggle section collapsed state
   * @param {HTMLElement} section
   */
  toggleSection(section) {
    const isCollapsed = section.dataset.collapsed === '1';
    section.dataset.collapsed = isCollapsed ? '0' : '1';
    
    const toggle = section.querySelector('.prop-head span');
    if (toggle) {
      toggle.textContent = isCollapsed ? '▼' : '▶';
    }
  }
}