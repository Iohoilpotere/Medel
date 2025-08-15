/**
 * Panel Resizer - Handles horizontal resizing of dock panels
 */

import { clamp } from '../core/utils/index.js';

export default class PanelResizer {
  constructor() {
    this.isResizing = false;
    this.currentPanel = null;
    this.startX = 0;
    this.startWidth = 0;
    this.minWidth = 200;
    this.maxWidth = 600;

    this.init();
  }

  /**
   * Initialize resize functionality
   */
  init() {
    this.attachResizeHandles();
  }

  /**
   * Attach resize handles to all dock panels
   */
  attachResizeHandles() {
    const panels = document.querySelectorAll('.dock-panel');
    
    panels.forEach(panel => {
      if (panel.querySelector('.resize-handle')) return; // Already has handle

      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      handle.setAttribute('aria-label', 'Resize panel');
      
      panel.appendChild(handle);
      
      handle.addEventListener('mousedown', (e) => {
        this.startResize(e, panel);
      });

      // Keyboard support
      handle.addEventListener('keydown', (e) => {
        this.handleKeyboardResize(e, panel);
      });

      // Make handle focusable
      handle.setAttribute('tabindex', '0');
    });
  }

  /**
   * Start resize operation
   * @param {MouseEvent} event
   * @param {HTMLElement} panel
   */
  startResize(event, panel) {
    if (panel.dataset.collapsed === '1') return;

    event.preventDefault();
    
    this.isResizing = true;
    this.currentPanel = panel;
    this.startX = event.clientX;
    this.startWidth = panel.offsetWidth;

    // Add resizing class for styling
    panel.classList.add('resizing');
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    // Attach global event listeners
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);

    // Prevent text selection during resize
    event.stopPropagation();
  }

  /**
   * Handle mouse move during resize
   * @param {MouseEvent} event
   */
  handleMouseMove = (event) => {
    if (!this.isResizing || !this.currentPanel) return;

    const deltaX = event.clientX - this.startX;
    const isLeftPanel = this.currentPanel.dataset.side === 'left';
    
    let newWidth;
    if (isLeftPanel) {
      newWidth = this.startWidth + deltaX;
    } else {
      newWidth = this.startWidth - deltaX;
    }

    // Clamp width to min/max values
    newWidth = clamp(newWidth, this.minWidth, this.maxWidth);

    // Apply new width
    this.currentPanel.style.width = `${newWidth}px`;

    // Update CSS custom property if panel uses it
    const panelType = this.currentPanel.classList.contains('sidebar') ? 'sidebar' : 'propbar';
    const customProp = panelType === 'sidebar' ? '--panel-expanded-w-sidebar' : '--panel-expanded-w-propbar';
    document.documentElement.style.setProperty(customProp, `${newWidth}px`);
  };

  /**
   * Handle mouse up to end resize
   * @param {MouseEvent} event
   */
  handleMouseUp = (event) => {
    if (!this.isResizing) return;

    this.isResizing = false;
    
    // Clean up
    if (this.currentPanel) {
      this.currentPanel.classList.remove('resizing');
    }
    
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Remove global event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    // Save panel width to localStorage
    this.savePanelWidth();

    this.currentPanel = null;

    // Trigger resize event for other components
    window.dispatchEvent(new Event('resize'));
  };

  /**
   * Handle keyboard resize
   * @param {KeyboardEvent} event
   * @param {HTMLElement} panel
   */
  handleKeyboardResize(event, panel) {
    if (panel.dataset.collapsed === '1') return;

    const step = event.shiftKey ? 50 : 10;
    let deltaWidth = 0;

    switch (event.key) {
      case 'ArrowLeft':
        deltaWidth = panel.dataset.side === 'left' ? -step : step;
        break;
      case 'ArrowRight':
        deltaWidth = panel.dataset.side === 'left' ? step : -step;
        break;
      default:
        return;
    }

    event.preventDefault();

    const currentWidth = panel.offsetWidth;
    const newWidth = clamp(currentWidth + deltaWidth, this.minWidth, this.maxWidth);

    panel.style.width = `${newWidth}px`;

    // Update CSS custom property
    const panelType = panel.classList.contains('sidebar') ? 'sidebar' : 'propbar';
    const customProp = panelType === 'sidebar' ? '--panel-expanded-w-sidebar' : '--panel-expanded-w-propbar';
    document.documentElement.style.setProperty(customProp, `${newWidth}px`);

    this.currentPanel = panel;
    this.savePanelWidth();

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Save panel width to localStorage
   */
  savePanelWidth() {
    if (!this.currentPanel) return;

    const panelType = this.currentPanel.classList.contains('sidebar') ? 'sidebar' : 'propbar';
    const width = this.currentPanel.offsetWidth;

    try {
      localStorage.setItem(`medel-panel-width-${panelType}`, width.toString());
    } catch (error) {
      console.warn('Failed to save panel width:', error);
    }
  }

  /**
   * Restore panel widths from localStorage
   */
  restorePanelWidths() {
    const panels = document.querySelectorAll('.dock-panel');
    
    panels.forEach(panel => {
      const panelType = panel.classList.contains('sidebar') ? 'sidebar' : 'propbar';
      
      try {
        const savedWidth = localStorage.getItem(`medel-panel-width-${panelType}`);
        if (savedWidth) {
          const width = parseInt(savedWidth, 10);
          if (width >= this.minWidth && width <= this.maxWidth) {
            panel.style.width = `${width}px`;
            
            // Update CSS custom property
            const customProp = panelType === 'sidebar' ? '--panel-expanded-w-sidebar' : '--panel-expanded-w-propbar';
            document.documentElement.style.setProperty(customProp, `${width}px`);
          }
        }
      } catch (error) {
        console.warn('Failed to restore panel width:', error);
      }
    });
  }

  /**
   * Set minimum panel width
   * @param {number} width
   */
  setMinWidth(width) {
    this.minWidth = Math.max(100, width);
  }

  /**
   * Set maximum panel width
   * @param {number} width
   */
  setMaxWidth(width) {
    this.maxWidth = Math.max(this.minWidth, width);
  }

  /**
   * Reset panel to default width
   * @param {HTMLElement} panel
   */
  resetPanelWidth(panel) {
    const panelType = panel.classList.contains('sidebar') ? 'sidebar' : 'propbar';
    const defaultWidth = panelType === 'sidebar' ? 260 : 320;

    panel.style.width = `${defaultWidth}px`;

    // Update CSS custom property
    const customProp = panelType === 'sidebar' ? '--panel-expanded-w-sidebar' : '--panel-expanded-w-propbar';
    document.documentElement.style.setProperty(customProp, `${defaultWidth}px`);

    // Remove from localStorage
    try {
      localStorage.removeItem(`medel-panel-width-${panelType}`);
    } catch (error) {
      console.warn('Failed to remove panel width from storage:', error);
    }

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Destroy resizer and clean up
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    // Remove resize handles
    const handles = document.querySelectorAll('.resize-handle');
    handles.forEach(handle => handle.remove());

    // Reset cursor and selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    this.isResizing = false;
    this.currentPanel = null;
  }
}