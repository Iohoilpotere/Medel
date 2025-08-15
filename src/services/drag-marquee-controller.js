/**
 * Handles marquee selection (drag to select multiple elements)
 */

import { $, clientToStage } from '../core/utils/index.js';

export default class DragMarqueeController {
  constructor(selectionManager) {
    this.selectionManager = selectionManager;
    this.marquee = $('#marquee');
    this.stage = null;
    this.isActive = false;
    this.startPoint = null;
    this.elements = [];
  }

  /**
   * Set stage element and available elements
   * @param {HTMLElement} stage
   * @param {Array} elements
   */
  setContext(stage, elements) {
    this.stage = stage;
    this.elements = elements;
  }

  /**
   * Start marquee selection
   * @param {MouseEvent} event
   */
  start(event) {
    if (!this.stage || !this.marquee) return;

    this.isActive = true;
    this.startPoint = clientToStage(event, this.stage);
    
    // Position marquee
    this.marquee.style.left = this.startPoint.x + 'px';
    this.marquee.style.top = this.startPoint.y + 'px';
    this.marquee.style.width = '0px';
    this.marquee.style.height = '0px';
    this.marquee.classList.remove('d-none');

    // Add event listeners
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    
    event.preventDefault();
  }

  /**
   * Handle mouse move during marquee selection
   * @param {MouseEvent} event
   */
  handleMouseMove = (event) => {
    if (!this.isActive || !this.startPoint) return;

    const currentPoint = clientToStage(event, this.stage);
    
    // Calculate marquee bounds
    const left = Math.min(this.startPoint.x, currentPoint.x);
    const top = Math.min(this.startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - this.startPoint.x);
    const height = Math.abs(currentPoint.y - this.startPoint.y);
    
    // Update marquee visual
    this.marquee.style.left = left + 'px';
    this.marquee.style.top = top + 'px';
    this.marquee.style.width = width + 'px';
    this.marquee.style.height = height + 'px';
    
    // Update selection
    this.updateSelection(left, top, width, height);
  };

  /**
   * Handle mouse up to end marquee selection
   * @param {MouseEvent} event
   */
  handleMouseUp = (event) => {
    if (!this.isActive) return;

    this.isActive = false;
    this.startPoint = null;
    
    // Hide marquee
    this.marquee.classList.add('d-none');
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  /**
   * Update element selection based on marquee bounds
   * @param {number} left
   * @param {number} top
   * @param {number} width
   * @param {number} height
   */
  updateSelection(left, top, width, height) {
    if (!this.stage) return;

    const stageRect = this.stage.getBoundingClientRect();
    const marqueeRect = {
      left: (left / this.stage.clientWidth) * 100,
      top: (top / this.stage.clientHeight) * 100,
      right: ((left + width) / this.stage.clientWidth) * 100,
      bottom: ((top + height) / this.stage.clientHeight) * 100,
    };

    // Clear current selection
    this.selectionManager.clearSelection();

    // Select elements that intersect with marquee
    this.elements.forEach(element => {
      if (this.elementIntersectsMarquee(element, marqueeRect)) {
        this.selectionManager.addToSelection(element);
      }
    });
  }

  /**
   * Check if element intersects with marquee
   * @param {BaseElement} element
   * @param {Object} marqueeRect
   * @returns {boolean}
   */
  elementIntersectsMarquee(element, marqueeRect) {
    const elementRect = {
      left: element.x,
      top: element.y,
      right: element.x + element.w,
      bottom: element.y + element.h,
    };

    return !(
      elementRect.right < marqueeRect.left ||
      elementRect.left > marqueeRect.right ||
      elementRect.bottom < marqueeRect.top ||
      elementRect.top > marqueeRect.bottom
    );
  }

  /**
   * Check if marquee selection is active
   * @returns {boolean}
   */
  isMarqueeActive() {
    return this.isActive;
  }

  /**
   * Cancel marquee selection
   */
  cancel() {
    if (this.isActive) {
      this.handleMouseUp();
    }
  }
}