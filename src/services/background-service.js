/**
 * Manages stage background functionality
 */

import { isValidUrl } from '../core/utils/index.js';

export default class BackgroundService {
  constructor() {
    this.currentUrl = '';
    this.canvas = null;
  }

  /**
   * Set canvas element
   * @param {HTMLElement} canvas
   */
  setCanvas(canvas) {
    this.canvas = canvas;
  }

  /**
   * Set background image
   * @param {string} url - Image URL
   * @returns {boolean} Success
   */
  setBackground(url) {
    if (!this.canvas) return false;

    const cleanUrl = (url || '').trim();
    
    if (!cleanUrl) {
      this.clearBackground();
      return true;
    }

    if (!isValidUrl(cleanUrl)) {
      console.warn('Invalid background URL:', cleanUrl);
      return false;
    }

    this.currentUrl = cleanUrl;
    this.canvas.style.background = `center/cover no-repeat url('${cleanUrl}')`;
    
    return true;
  }

  /**
   * Clear background
   */
  clearBackground() {
    if (this.canvas) {
      this.canvas.style.background = '';
    }
    this.currentUrl = '';
  }

  /**
   * Get current background URL
   * @returns {string}
   */
  getCurrentUrl() {
    return this.currentUrl;
  }

  /**
   * Check if background is set
   * @returns {boolean}
   */
  hasBackground() {
    return !!this.currentUrl;
  }

  /**
   * Preload background image
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  preloadBackground(url) {
    return new Promise((resolve) => {
      if (!url || !isValidUrl(url)) {
        resolve(false);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  /**
   * Get background from canvas style
   * @returns {string}
   */
  extractUrlFromCanvas() {
    if (!this.canvas) return '';
    
    const bgStyle = this.canvas.style.background;
    const match = bgStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
    
    return match ? match[1] : '';
  }

  /**
   * Sync current URL with canvas
   */
  syncWithCanvas() {
    this.currentUrl = this.extractUrlFromCanvas();
  }

  /**
   * Validate background URL
   * @param {string} url
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateUrl(url) {
    if (!url) {
      return { valid: true }; // Empty URL is valid (clears background)
    }

    if (!isValidUrl(url)) {
      return { valid: false, error: 'URL non valido' };
    }

    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Impossibile caricare l\'immagine' };
    }
  }
}