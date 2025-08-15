/**
 * Grid and snapping functionality
 */

import { snapTo, pxToPct } from '../core/utils/index.js';
import { EDITOR_DEFAULTS } from '../config/defaults.js';

export default class GridSnapService {
  constructor() {
    this.gridSize = EDITOR_DEFAULTS.grid;
    this.enabled = true;
    this.subGridEnabled = false;
  }

  /**
   * Set grid size in pixels
   * @param {number} size
   */
  setGridSize(size) {
    this.gridSize = Math.max(0, size);
  }

  /**
   * Get grid size in pixels
   * @returns {number}
   */
  getGridSize() {
    return this.gridSize;
  }

  /**
   * Enable/disable grid snapping
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Check if grid snapping is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Enable/disable sub-grid
   * @param {boolean} enabled
   */
  setSubGridEnabled(enabled) {
    this.subGridEnabled = enabled;
  }

  /**
   * Check if sub-grid is enabled
   * @returns {boolean}
   */
  isSubGridEnabled() {
    return this.subGridEnabled;
  }

  /**
   * Get grid size as percentage of stage dimensions
   * @param {HTMLElement} stage
   * @returns {{x: number, y: number}}
   */
  getGridPercent(stage) {
    if (!this.gridSize || !stage) {
      return { x: 0, y: 0 };
    }

    return {
      x: pxToPct(this.gridSize, stage.clientWidth),
      y: pxToPct(this.gridSize, stage.clientHeight),
    };
  }

  /**
   * Snap value to grid
   * @param {number} value
   * @param {number} gridStep
   * @param {boolean} [forceSnap] - Force snapping even if disabled
   * @returns {number}
   */
  snap(value, gridStep, forceSnap = false) {
    if (!forceSnap && (!this.enabled || !gridStep)) {
      return value;
    }
    return snapTo(value, gridStep);
  }

  /**
   * Snap point to grid
   * @param {{x: number, y: number}} point
   * @param {HTMLElement} stage
   * @param {boolean} [forceSnap]
   * @returns {{x: number, y: number}}
   */
  snapPoint(point, stage, forceSnap = false) {
    const grid = this.getGridPercent(stage);
    
    return {
      x: this.snap(point.x, grid.x, forceSnap),
      y: this.snap(point.y, grid.y, forceSnap),
    };
  }

  /**
   * Snap bounds to grid
   * @param {{x: number, y: number, w: number, h: number}} bounds
   * @param {HTMLElement} stage
   * @param {boolean} [forceSnap]
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  snapBounds(bounds, stage, forceSnap = false) {
    const grid = this.getGridPercent(stage);
    
    return {
      x: this.snap(bounds.x, grid.x, forceSnap),
      y: this.snap(bounds.y, grid.y, forceSnap),
      w: this.snap(bounds.w, grid.x, forceSnap),
      h: this.snap(bounds.h, grid.y, forceSnap),
    };
  }

  /**
   * Snap value within constraints
   * @param {number} target
   * @param {number} step
   * @param {number} min
   * @param {number} max
   * @param {boolean} [forceSnap]
   * @returns {number}
   */
  snapInside(target, step, min, max, forceSnap = false) {
    if (!forceSnap && (!this.enabled || step <= 0)) {
      return Math.min(max, Math.max(min, target));
    }

    let snapped = Math.round(target / step) * step;
    
    if (snapped < min) {
      snapped = Math.ceil(min / step) * step;
    }
    if (snapped > max) {
      snapped = Math.floor(max / step) * step;
    }
    
    return Math.min(max, Math.max(min, snapped));
  }

  /**
   * Update stage grid visualization
   * @param {HTMLElement} stage
   */
  updateStageGrid(stage) {
    if (!stage) return;

    const hasGrid = this.enabled && this.gridSize > 0;
    
    stage.dataset.grid = hasGrid ? 'on' : 'off';
    stage.dataset.subgrid = this.subGridEnabled ? 'on' : 'off';
    
    if (hasGrid) {
      stage.style.setProperty('--grid', `${this.gridSize}px`);
    }
  }
}