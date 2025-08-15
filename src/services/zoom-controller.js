/**
 * Handles stage zoom functionality
 */

export default class ZoomController {
  constructor(metricsService) {
    this.metricsService = metricsService;
    this.currentZoom = 1;
    this.minZoom = 0.1;
    this.maxZoom = 3;
    this.zoomStep = 0.1;
    this.stage = null;
  }

  /**
   * Set stage element
   * @param {HTMLElement} stage
   */
  setStage(stage) {
    this.stage = stage;
    this.updateStageZoom();
  }

  /**
   * Get current zoom level
   * @returns {number}
   */
  getZoom() {
    return this.currentZoom;
  }

  /**
   * Set zoom level
   * @param {number} zoom
   * @param {boolean} [updateStage=true]
   */
  setZoom(zoom, updateStage = true) {
    this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    
    if (updateStage) {
      this.updateStageZoom();
    }
  }

  /**
   * Zoom in
   * @param {number} [step] - Zoom step (default: this.zoomStep)
   */
  zoomIn(step = this.zoomStep) {
    this.setZoom(this.currentZoom + step);
  }

  /**
   * Zoom out
   * @param {number} [step] - Zoom step (default: this.zoomStep)
   */
  zoomOut(step = this.zoomStep) {
    this.setZoom(this.currentZoom - step);
  }

  /**
   * Reset zoom to 100%
   */
  resetZoom() {
    this.setZoom(1);
  }

  /**
   * Zoom to fit stage in container
   */
  zoomToFit() {
    if (!this.metricsService) return;
    
    const optimalZoom = this.metricsService.getOptimalZoom();
    this.setZoom(optimalZoom);
  }

  /**
   * Handle mouse wheel zoom
   * @param {WheelEvent} event
   * @param {number} [sensitivity=0.001] - Zoom sensitivity
   */
  handleWheel(event, sensitivity = 0.001) {
    if (!event.ctrlKey && !event.metaKey) return false;

    event.preventDefault();
    
    const delta = -event.deltaY * sensitivity;
    const newZoom = this.currentZoom + delta;
    
    this.setZoom(newZoom);
    return true;
  }

  /**
   * Update stage zoom CSS
   */
  updateStageZoom() {
    if (!this.stage) return;

    this.stage.style.setProperty('--zoom', this.currentZoom.toString());
  }

  /**
   * Get zoom percentage string
   * @returns {string}
   */
  getZoomPercentage() {
    return Math.round(this.currentZoom * 100) + '%';
  }

  /**
   * Set zoom from percentage
   * @param {number} percentage - Zoom percentage (e.g., 150 for 150%)
   */
  setZoomFromPercentage(percentage) {
    this.setZoom(percentage / 100);
  }

  /**
   * Get available zoom presets
   * @returns {Array<{label: string, value: number}>}
   */
  getZoomPresets() {
    return [
      { label: '25%', value: 0.25 },
      { label: '50%', value: 0.5 },
      { label: '75%', value: 0.75 },
      { label: '100%', value: 1 },
      { label: '125%', value: 1.25 },
      { label: '150%', value: 1.5 },
      { label: '200%', value: 2 },
      { label: 'Adatta', value: 'fit' },
    ];
  }

  /**
   * Apply zoom preset
   * @param {number|string} preset - Zoom value or 'fit'
   */
  applyPreset(preset) {
    if (preset === 'fit') {
      this.zoomToFit();
    } else if (typeof preset === 'number') {
      this.setZoom(preset);
    }
  }

  /**
   * Check if zoom is at minimum
   * @returns {boolean}
   */
  isAtMinZoom() {
    return this.currentZoom <= this.minZoom;
  }

  /**
   * Check if zoom is at maximum
   * @returns {boolean}
   */
  isAtMaxZoom() {
    return this.currentZoom >= this.maxZoom;
  }
}