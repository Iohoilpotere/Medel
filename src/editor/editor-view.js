/**
 * Editor View - Handles DOM interactions and UI updates
 * Separates view logic from business logic following SOLID principles
 */

import { $, $$, createElement } from '../core/utils/index.js';
import { clientToStage } from '../core/utils/index.js';

export default class EditorView {
  constructor(editorApp) {
    this.app = editorApp;
    this.elements = {
      stage: null,
      stageOuter: null,
      canvas: null,
      toolbar: null,
      propForm: null,
      palette: null,
    };
    this.isInitialized = false;
  }

  /**
   * Initialize view and bind DOM events
   */
  init() {
    if (this.isInitialized) return;

    this.cacheElements();
    this.setupToolbarEvents();
    this.setupStageEvents();
    this.setupPaletteEvents();
    this.setupGridControls();
    this.setupOrientationControls();
    this.setupBackgroundControls();
    this.setupExportControls();

    this.isInitialized = true;
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      stage: $('#stage'),
      stageOuter: $('.stage-outer'),
      canvas: $('#stepCanvas'),
      toolbar: $('.toolbar'),
      propForm: $('#propForm'),
      palette: $('#palette'),
      gridRange: $('#gridRange'),
      gridVal: $('#gridVal'),
      subgridSwitch: $('#subgridSwitch'),
      orientLandscape: $('#orientLandscape'),
      orientPortrait: $('#orientPortrait'),
      bgUrl: $('#bgUrl'),
      setBg: $('#setBg'),
      btnExportHtml: $('#btnExportHtml'),
    };

    // Validate required elements
    const required = ['stage', 'stageOuter', 'canvas'];
    for (const key of required) {
      if (!this.elements[key]) {
        throw new Error(`Required element not found: ${key}`);
      }
    }
  }

  /**
   * Get stage elements for other services
   */
  getStageElements() {
    return {
      stage: this.elements.stage,
      stageOuter: this.elements.stageOuter,
      canvas: this.elements.canvas,
    };
  }

  /**
   * Setup toolbar event handlers
   */
  setupToolbarEvents() {
    if (!this.elements.toolbar) return;

    // Alignment commands
    $$('[data-cmd]', this.elements.toolbar).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cmd = e.target.dataset.cmd;
        this.handleAlignmentCommand(cmd);
      });
    });
  }

  /**
   * Setup stage interaction events
   */
  setupStageEvents() {
    if (!this.elements.stage) return;

    // Canvas click for deselection and marquee
    this.elements.canvas.addEventListener('mousedown', (e) => {
      // Skip if clicking on an element or handle
      if (e.target.closest('.el') || e.target.dataset.editorUi) return;

      // Clear selection on plain canvas click
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        this.app.clearSelection();
      }

      // Start marquee selection
      this.app.dragMarqueeController.start(e);
    });

    // Zoom with mouse wheel
    this.elements.stage.addEventListener('wheel', (e) => {
      if (this.app.zoomController.handleWheel(e)) {
        this.updateZoomUI();
      }
    });
  }

  /**
   * Setup palette (element creation) events
   */
  setupPaletteEvents() {
    if (!this.elements.palette) return;

    // Render palette items
    this.renderPalette();

    // Handle palette item clicks
    this.elements.palette.addEventListener('click', (e) => {
      const item = e.target.closest('.palette-item');
      if (!item) return;

      const elementType = item.dataset.type;
      this.createElementFromPalette(elementType, e);
    });
  }

  /**
   * Setup grid controls
   */
  setupGridControls() {
    const { gridRange, gridVal, subgridSwitch } = this.elements;
    if (!gridRange) return;

    // Grid size slider
    gridRange.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      this.app.gridSnapService.setGridSize(size);
      this.updateGridUI();
    });

    // Sub-grid toggle
    if (subgridSwitch) {
      subgridSwitch.addEventListener('change', (e) => {
        this.app.gridSnapService.setSubGridEnabled(e.target.checked);
        this.updateGridUI();
      });
    }

    // Initial update
    this.updateGridUI();
  }

  /**
   * Setup orientation controls
   */
  setupOrientationControls() {
    const { orientLandscape, orientPortrait } = this.elements;

    if (orientLandscape) {
      orientLandscape.addEventListener('change', () => {
        if (orientLandscape.checked) {
          this.changeOrientation('landscape');
        }
      });
    }

    if (orientPortrait) {
      orientPortrait.addEventListener('change', () => {
        if (orientPortrait.checked) {
          this.changeOrientation('portrait');
        }
      });
    }
  }

  /**
   * Setup background controls
   */
  setupBackgroundControls() {
    const { bgUrl, setBg } = this.elements;
    if (!setBg) return;

    setBg.addEventListener('click', () => {
      const url = bgUrl?.value?.trim() || '';
      this.setBackground(url);
    });

    if (bgUrl) {
      bgUrl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const url = e.target.value.trim();
          this.setBackground(url);
        }
      });
    }
  }

  /**
   * Setup export controls
   */
  setupExportControls() {
    const { btnExportHtml } = this.elements;
    if (!btnExportHtml) return;

    btnExportHtml.addEventListener('click', async () => {
      try {
        const { default: CaseExporter } = await import('../editor/exporter.js');
        const exporter = new CaseExporter(this.app);
        await exporter.exportCaseHTML();
      } catch (error) {
        console.error('Export failed:', error);
        alert('Errore durante l\'esportazione');
      }
    });
  }

  /**
   * Render palette items
   */
  renderPalette() {
    if (!this.elements.palette) return;

    const registry = this.app.elementRegistry;
    const items = registry.getAll();

    this.elements.palette.innerHTML = '';

    items.forEach(({ type, label, icon }) => {
      const item = createElement('button', {
        type: 'button',
        className: 'palette-item btn btn-outline-light w-100 text-start',
        dataset: { type }
      });

      item.innerHTML = `
        <div class="d-flex align-items-center">
          <span class="me-2">${icon}</span>
          <div>
            <div>${label}</div>
            <div class="small text-secondary">${type}</div>
          </div>
        </div>
      `;

      this.elements.palette.appendChild(item);
    });
  }

  /**
   * Create element from palette
   */
  createElementFromPalette(elementType, event) {
    const elementInfo = this.app.elementRegistry.get(elementType);
    if (!elementInfo) return;

    const element = new elementInfo.klass();
    
    // Position at click location if available
    if (event && this.elements.stage) {
      const stagePos = clientToStage(event, this.elements.stage);
      const { x, y } = this.app.metricsService.pixelsToPercent(stagePos.x, stagePos.y);
      element.x = Math.max(0, Math.min(90, x));
      element.y = Math.max(0, Math.min(90, y));
    }

    // Add element through command system
    this.app.addElements([element]);
  }

  /**
   * Handle alignment commands
   */
  handleAlignmentCommand(cmd) {
    const selected = this.app.selected;
    if (selected.length < 2) return;

    // Implementation would depend on specific alignment logic
    console.log(`Alignment command: ${cmd} for ${selected.length} elements`);
    // TODO: Implement alignment commands
  }

  /**
   * Change orientation
   */
  changeOrientation(orientation) {
    this.app.metricsService.setOrientation(orientation);
    
    // Update active step
    if (this.app.stepManager.activeStep) {
      const { ChangeStepPropertyCommand } = require('../commands/step-commands.js');
      const oldValue = this.app.stepManager.activeStep.orient;
      const command = new ChangeStepPropertyCommand(
        this.app,
        this.app.stepManager.activeStep,
        'orient',
        orientation,
        oldValue,
        'Cambia orientamento'
      );
      this.app.commandManager.executeCommand(command);
    }
  }

  /**
   * Set background
   */
  setBackground(url) {
    const success = this.app.backgroundService.setBackground(url);
    
    if (success && this.app.stepManager.activeStep) {
      const { ChangeStepPropertyCommand } = require('../commands/step-commands.js');
      const oldValue = this.app.stepManager.activeStep.bgUrl;
      const command = new ChangeStepPropertyCommand(
        this.app,
        this.app.stepManager.activeStep,
        'bgUrl',
        url,
        oldValue,
        'Cambia sfondo'
      );
      this.app.commandManager.executeCommand(command);
    }
  }

  /**
   * Update grid UI
   */
  updateGridUI() {
    const { gridRange, gridVal, stage } = this.elements;
    const gridService = this.app.gridSnapService;
    
    if (gridRange) {
      gridRange.value = gridService.getGridSize();
    }
    
    if (gridVal) {
      gridVal.textContent = `${gridService.getGridSize()}px`;
    }
    
    if (stage) {
      gridService.updateStageGrid(stage);
    }
  }

  /**
   * Update zoom UI
   */
  updateZoomUI() {
    // Update zoom display if UI exists
    const zoomDisplay = $('.zoom-display');
    if (zoomDisplay) {
      zoomDisplay.textContent = this.app.zoomController.getZoomPercentage();
    }
  }

  /**
   * Sync orientation controls with current state
   */
  syncOrientationControls(orientation) {
    const { orientLandscape, orientPortrait } = this.elements;
    
    if (orientLandscape) {
      orientLandscape.checked = orientation === 'landscape';
    }
    
    if (orientPortrait) {
      orientPortrait.checked = orientation === 'portrait';
    }
  }

  /**
   * Update selection UI
   */
  updateSelectionUI(selected) {
    // Update toolbar button states based on selection
    const hasSelection = selected.length > 0;
    const hasMultiple = selected.length > 1;
    
    // Enable/disable alignment buttons
    $$('[data-cmd^="align-"], [data-cmd^="dist-"]').forEach(btn => {
      btn.disabled = !hasMultiple;
    });
    
    // Enable/disable layer buttons
    $$('[data-cmd="front"], [data-cmd="back"]').forEach(btn => {
      btn.disabled = !hasSelection;
    });
  }

  /**
   * Cleanup view
   */
  destroy() {
    // Remove event listeners if needed
    this.isInitialized = false;
  }
}