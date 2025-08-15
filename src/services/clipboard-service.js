/**
 * Clipboard operations for elements
 */

import { deepClone } from '../core/utils/index.js';

export default class ClipboardService {
  constructor(serializationService) {
    this.serializationService = serializationService;
    this.clipboard = [];
  }

  /**
   * Copy elements to clipboard
   * @param {Array} elements
   */
  copy(elements) {
    if (!elements || elements.length === 0) return;

    this.clipboard = elements.map(element => {
      return this.serializationService.serializeElement(element);
    });
  }

  /**
   * Cut elements to clipboard
   * @param {Array} elements
   * @param {Function} deleteCallback - Function to delete elements
   */
  cut(elements, deleteCallback) {
    this.copy(elements);
    if (deleteCallback) {
      deleteCallback(elements);
    }
  }

  /**
   * Paste elements from clipboard
   * @param {number} [offsetX=10] - Horizontal offset for pasted elements
   * @param {number} [offsetY=10] - Vertical offset for pasted elements
   * @returns {Array} Pasted elements
   */
  paste(offsetX = 10, offsetY = 10) {
    if (this.clipboard.length === 0) return [];

    const pastedElements = this.clipboard.map(elementData => {
      // Clone the data and apply offset
      const clonedData = deepClone(elementData);
      clonedData.x += offsetX;
      clonedData.y += offsetY;
      
      // Generate new ID to avoid conflicts
      clonedData.id = this.serializationService.generateId(clonedData.type);
      
      return this.serializationService.deserializeElement(clonedData);
    });

    return pastedElements;
  }

  /**
   * Duplicate elements (copy + paste in one operation)
   * @param {Array} elements
   * @param {number} [offsetX=10]
   * @param {number} [offsetY=10]
   * @returns {Array} Duplicated elements
   */
  duplicate(elements, offsetX = 10, offsetY = 10) {
    this.copy(elements);
    return this.paste(offsetX, offsetY);
  }

  /**
   * Check if clipboard has content
   * @returns {boolean}
   */
  hasContent() {
    return this.clipboard.length > 0;
  }

  /**
   * Clear clipboard
   */
  clear() {
    this.clipboard = [];
  }

  /**
   * Get clipboard content count
   * @returns {number}
   */
  getContentCount() {
    return this.clipboard.length;
  }
}