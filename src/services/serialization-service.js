/**
 * Handles serialization and deserialization of editor data
 */

import { uid } from '../core/utils/index.js';

export default class SerializationService {
  constructor(elementRegistry) {
    this.elementRegistry = elementRegistry;
  }

  /**
   * Generate unique ID for element type
   * @param {string} type
   * @returns {string}
   */
  generateId(type) {
    return uid(type);
  }

  /**
   * Serialize element to JSON
   * @param {BaseElement} element
   * @returns {Object}
   */
  serializeElement(element) {
    if (!element || typeof element.toJSON !== 'function') {
      throw new Error('Element must implement toJSON method');
    }
    return element.toJSON();
  }

  /**
   * Deserialize element from JSON
   * @param {Object} data
   * @returns {BaseElement}
   */
  deserializeElement(data) {
    if (!data || !data.type) {
      throw new Error('Invalid element data: missing type');
    }

    const elementInfo = this.elementRegistry.get(data.type);
    if (!elementInfo) {
      throw new Error(`Unknown element type: ${data.type}`);
    }

    const element = new elementInfo.klass();
    
    // Restore properties
    Object.assign(element, data);
    
    return element;
  }

  /**
   * Serialize step to JSON
   * @param {Step} step
   * @param {Array} elements - Elements in the step
   * @returns {Object}
   */
  serializeStep(step, elements) {
    return {
      ...step.toJSON(),
      items: elements.map(element => this.serializeElement(element)),
    };
  }

  /**
   * Deserialize step from JSON
   * @param {Object} data
   * @returns {{step: Step, elements: Array}}
   */
  deserializeStep(data) {
    const { Step } = require('../steps/step-models.js');
    
    const step = new Step();
    Object.assign(step, {
      id: data.id,
      name: data.name,
      orient: data.orient,
      bgUrl: data.bgUrl,
    });

    const elements = (data.items || []).map(itemData => 
      this.deserializeElement(itemData)
    );

    return { step, elements };
  }

  /**
   * Serialize entire project
   * @param {Array} categories
   * @param {Object} settings
   * @returns {Object}
   */
  serializeProject(categories, settings = {}) {
    return {
      version: '2.6.1',
      timestamp: Date.now(),
      settings,
      categories: categories.map(category => ({
        ...category,
        steps: category.steps.map(step => ({
          ...step,
          items: step.items.map(element => this.serializeElement(element)),
        })),
      })),
    };
  }

  /**
   * Deserialize entire project
   * @param {Object} data
   * @returns {{categories: Array, settings: Object}}
   */
  deserializeProject(data) {
    if (!data || !data.categories) {
      throw new Error('Invalid project data');
    }

    const { Category, Step } = require('../steps/step-models.js');

    const categories = data.categories.map(catData => {
      const category = new Category(catData.name);
      Object.assign(category, catData);

      category.steps = catData.steps.map(stepData => {
        const step = new Step(stepData.name, stepData.orient);
        Object.assign(step, stepData);

        step.items = (stepData.items || []).map(itemData =>
          this.deserializeElement(itemData)
        );

        return step;
      });

      return category;
    });

    return {
      categories,
      settings: data.settings || {},
    };
  }

  /**
   * Export project as JSON string
   * @param {Array} categories
   * @param {Object} settings
   * @returns {string}
   */
  exportProject(categories, settings) {
    const data = this.serializeProject(categories, settings);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import project from JSON string
   * @param {string} jsonString
   * @returns {{categories: Array, settings: Object}}
   */
  importProject(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return this.deserializeProject(data);
    } catch (error) {
      throw new Error(`Failed to import project: ${error.message}`);
    }
  }
}