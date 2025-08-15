/**
 * Handles stage sizing, orientation, and layout metrics
 */

import { STAGE_DEFAULTS } from '../config/defaults.js';

export default class MetricsService {
  constructor() {
    this.stage = null;
    this.stageOuter = null;
    this.currentOrientation = STAGE_DEFAULTS.defaultOrientation;
  }

  /**
   * Set stage elements
   * @param {HTMLElement} stage
   * @param {HTMLElement} stageOuter
   */
  setStageElements(stage, stageOuter) {
    this.stage = stage;
    this.stageOuter = stageOuter;
  }

  /**
   * Get current orientation
   * @returns {string}
   */
  getOrientation() {
    return this.currentOrientation;
  }

  /**
   * Set stage orientation
   * @param {string} orientation - 'landscape' or 'portrait'
   */
  setOrientation(orientation) {
    if (!this.stage) return;

    this.currentOrientation = orientation;
    this.stage.dataset.orient = orientation;
    this.updateStageSize();
  }

  /**
   * Get aspect ratio for current orientation
   * @returns {number}
   */
  getAspectRatio() {
    return STAGE_DEFAULTS.aspectRatios[this.currentOrientation] || STAGE_DEFAULTS.aspectRatios.landscape;
  }

  /**
   * Update stage size to fit container while maintaining aspect ratio
   */
  updateStageSize() {
    if (!this.stage || !this.stageOuter) return;

    const containerRect = this.stageOuter.getBoundingClientRect();
    const containerStyle = getComputedStyle(this.stageOuter);
    
    // Account for padding
    const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
    const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
    
    const availableWidth = containerRect.width - paddingLeft - paddingRight;
    const availableHeight = containerRect.height - paddingTop - paddingBottom;
    
    const aspectRatio = this.getAspectRatio();
    
    // Calculate optimal size
    let stageWidth = Math.min(availableWidth, Math.floor(availableHeight * aspectRatio));
    let stageHeight = Math.floor(stageWidth / aspectRatio);
    
    // Ensure it fits vertically
    if (stageHeight > availableHeight) {
      stageHeight = availableHeight;
      stageWidth = Math.floor(stageHeight * aspectRatio);
    }
    
    // Ensure it fits horizontally
    if (stageWidth > availableWidth) {
      stageWidth = availableWidth;
      stageHeight = Math.floor(stageWidth / aspectRatio);
    }
    
    // Apply size
    this.stage.style.width = `${stageWidth}px`;
    this.stage.style.height = `${stageHeight}px`;
  }

  /**
   * Get stage dimensions
   * @returns {{width: number, height: number}}
   */
  getStageDimensions() {
    if (!this.stage) return { width: 0, height: 0 };
    
    return {
      width: this.stage.clientWidth,
      height: this.stage.clientHeight,
    };
  }

  /**
   * Get stage bounds relative to document
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getStageBounds() {
    if (!this.stage) return { x: 0, y: 0, width: 0, height: 0 };
    
    const rect = this.stage.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * Convert percentage coordinates to pixel coordinates
   * @param {number} percentX
   * @param {number} percentY
   * @returns {{x: number, y: number}}
   */
  percentToPixels(percentX, percentY) {
    const { width, height } = this.getStageDimensions();
    return {
      x: (percentX / 100) * width,
      y: (percentY / 100) * height,
    };
  }

  /**
   * Convert pixel coordinates to percentage coordinates
   * @param {number} pixelX
   * @param {number} pixelY
   * @returns {{x: number, y: number}}
   */
  pixelsToPercent(pixelX, pixelY) {
    const { width, height } = this.getStageDimensions();
    return {
      x: width ? (pixelX / width) * 100 : 0,
      y: height ? (pixelY / height) * 100 : 0,
    };
  }

  /**
   * Check if point is within stage bounds
   * @param {number} x - Pixel X coordinate
   * @param {number} y - Pixel Y coordinate
   * @returns {boolean}
   */
  isPointInStage(x, y) {
    const bounds = this.getStageBounds();
    return x >= bounds.x && 
           x <= bounds.x + bounds.width && 
           y >= bounds.y && 
           y <= bounds.y + bounds.height;
  }

  /**
   * Get optimal zoom level to fit stage in container
   * @returns {number}
   */
  getOptimalZoom() {
    if (!this.stage || !this.stageOuter) return 1;

    const containerRect = this.stageOuter.getBoundingClientRect();
    const stageRect = this.stage.getBoundingClientRect();
    
    const scaleX = containerRect.width / stageRect.width;
    const scaleY = containerRect.height / stageRect.height;
    
    return Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.updateStageSize();
  }

  /**
   * Initialize resize observer
   */
  initResizeObserver() {
    if (!this.stageOuter || !window.ResizeObserver) return;

    const resizeObserver = new ResizeObserver(() => {
      this.updateStageSize();
    });

    resizeObserver.observe(this.stageOuter);
    return resizeObserver;
  }
}