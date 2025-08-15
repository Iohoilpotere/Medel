/**
 * Manages element selection state and operations
 */

import { EventEmitter } from '../core/event-emitter.js';

export default class SelectionManager extends EventEmitter {
  constructor() {
    super();
    this.selected = [];
  }

  /**
   * Get currently selected elements
   * @returns {Array} Selected elements
   */
  getSelected() {
    return [...this.selected];
  }

  /**
   * Check if element is selected
   * @param {BaseElement} element
   * @returns {boolean}
   */
  isSelected(element) {
    return this.selected.includes(element);
  }

  /**
   * Select only the specified element
   * @param {BaseElement} element
   */
  selectOnly(element) {
    this.clearSelection();
    this.addToSelection(element);
  }

  /**
   * Add element to selection
   * @param {BaseElement} element
   */
  addToSelection(element) {
    if (!this.selected.includes(element)) {
      this.selected.push(element);
      element.setSelected(true);
      this.emit('selectionChanged', this.selected);
    }
  }

  /**
   * Remove element from selection
   * @param {BaseElement} element
   */
  removeFromSelection(element) {
    const index = this.selected.indexOf(element);
    if (index >= 0) {
      this.selected.splice(index, 1);
      element.setSelected(false);
      this.emit('selectionChanged', this.selected);
    }
  }

  /**
   * Toggle element selection
   * @param {BaseElement} element
   */
  toggleSelection(element) {
    if (this.isSelected(element)) {
      this.removeFromSelection(element);
    } else {
      this.addToSelection(element);
    }
  }

  /**
   * Clear all selection
   */
  clearSelection() {
    this.selected.forEach(element => element.setSelected(false));
    this.selected = [];
    this.emit('selectionChanged', this.selected);
  }

  /**
   * Select all elements
   * @param {Array} elements - All available elements
   */
  selectAll(elements) {
    this.clearSelection();
    elements.forEach(element => this.addToSelection(element));
  }

  /**
   * Get selection bounds
   * @returns {{x: number, y: number, w: number, h: number}|null}
   */
  getSelectionBounds() {
    if (this.selected.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.selected.forEach(element => {
      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, element.x + element.w);
      maxY = Math.max(maxY, element.y + element.h);
    });

    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    };
  }

  /**
   * Check if selection has multiple elements
   * @returns {boolean}
   */
  hasMultipleSelected() {
    return this.selected.length > 1;
  }

  /**
   * Get primary selected element (first in selection)
   * @returns {BaseElement|null}
   */
  getPrimarySelected() {
    return this.selected[0] || null;
  }
}