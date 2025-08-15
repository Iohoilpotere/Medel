/**
 * Main application orchestrator - Composition root
 * Follows SOLID principles by depending on abstractions and coordinating services
 */

import EditorView from './editor-view.js';
import SelectionManager from '../services/selection-manager.js';
import GridSnapService from '../services/grid-snap-service.js';
import ZoomController from '../services/zoom-controller.js';
import ClipboardService from '../services/clipboard-service.js';
import KeyboardShortcuts from '../services/keyboard-shortcuts.js';
import DragMarqueeController from '../services/drag-marquee-controller.js';
import SerializationService from '../services/serialization-service.js';
import BackgroundService from '../services/background-service.js';
import MetricsService from '../services/metrics-service.js';
import PropertyPanelRenderer from '../ui/property-panel-renderer.js';
import CommandManager from '../commands/command-manager.js';
import StepManager from '../steps/step-manager.js';
import PanelManager from '../ui/panel-manager.js';
import ElementRegistry from './element-registry.js';
import { ThemeFactory } from '../ui/themes/theme-factory.js';
import { uid } from '../core/utils/index.js';

export default class EditorApp {
  constructor() {
    this.isInitialized = false;
    this.setupServices();
    this.setupEventHandlers();
  }

  /**
   * Setup all services with proper dependency injection
   */
  setupServices() {
    // Core services
    this.elementRegistry = new ElementRegistry();
    this.commandManager = new CommandManager(this);
    this.selectionManager = new SelectionManager();
    this.serializationService = new SerializationService(this.elementRegistry);
    
    // Layout and interaction services
    this.metricsService = new MetricsService();
    this.gridSnapService = new GridSnapService();
    this.zoomController = new ZoomController(this.metricsService);
    this.backgroundService = new BackgroundService();
    
    // UI services
    this.clipboardService = new ClipboardService(this.serializationService);
    this.dragMarqueeController = new DragMarqueeController(this.selectionManager);
    this.propertyPanelRenderer = new PropertyPanelRenderer(this.commandManager);
    
    // Managers
    this.panelManager = new PanelManager();
    this.stepManager = new StepManager(this);
    
    // View (handles DOM interactions)
    this.view = new EditorView(this);
    
    // Keyboard shortcuts (setup after view)
    this.keyboardShortcuts = new KeyboardShortcuts();
    this.setupKeyboardShortcuts();
  }

  /**
   * Setup keyboard shortcuts with handlers
   */
  setupKeyboardShortcuts() {
    const handlers = {
      undo: () => this.commandManager.undo(),
      redo: () => this.commandManager.redo(),
      copy: () => this.copySelected(),
      cut: () => this.cutSelected(),
      paste: () => this.pasteFromClipboard(),
      duplicate: () => this.duplicateSelected(),
      selectAll: () => this.selectAll(),
      clearSelection: () => this.selectionManager.clearSelection(),
      delete: () => this.deleteSelected(),
      nudge: (dx, dy, options = {}) => this.nudgeSelected(dx, dy, options),
    };

    this.keyboardShortcuts.registerDefaults(handlers);
  }

  /**
   * Setup event handlers between services
   */
  setupEventHandlers() {
    // Selection changes update property panel
    this.selectionManager.on('selectionChanged', (selected) => {
      this.propertyPanelRenderer.render(selected);
      this.view.updateSelectionUI(selected);
    });

    // Window resize updates metrics
    window.addEventListener('resize', () => {
      this.metricsService.handleResize();
    });
  }

  /**
   * Initialize the editor
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Initialize element registry
      await this.elementRegistry.init();
      
      // Initialize view
      this.view.init();
      
      // Setup stage references
      const { stage, stageOuter, canvas } = this.view.getStageElements();
      this.metricsService.setStageElements(stage, stageOuter);
      this.zoomController.setStage(stage);
      this.backgroundService.setCanvas(canvas);
      this.dragMarqueeController.setContext(stage, this.elements);
      
      // Initialize step manager
      this.stepManager.init();
      
      // Apply initial theme
      const currentTheme = ThemeFactory.currentTheme;
      ThemeFactory.apply(currentTheme);
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize editor:', error);
      throw error;
    }
  }

  /**
   * Get current elements (from active step)
   */
  get elements() {
    return this.stepManager.activeStep?.items || [];
  }

  /**
   * Get selected elements
   */
  get selected() {
    return this.selectionManager.getSelected();
  }

  /**
   * Generate unique ID
   */
  static uid(prefix) {
    return uid(prefix);
  }

  // === Selection Methods ===

  selectOnly(element) {
    this.selectionManager.selectOnly(element);
  }

  selectInclude(element) {
    this.selectionManager.addToSelection(element);
  }

  toggleSelect(element) {
    this.selectionManager.toggleSelection(element);
  }

  clearSelection() {
    this.selectionManager.clearSelection();
  }

  selectAll() {
    this.selectionManager.selectAll(this.elements);
  }

  // === Element Operations ===

  copySelected() {
    const selected = this.selectionManager.getSelected();
    if (selected.length > 0) {
      this.clipboardService.copy(selected);
    }
  }

  cutSelected() {
    const selected = this.selectionManager.getSelected();
    if (selected.length > 0) {
      this.clipboardService.cut(selected, (elements) => {
        this.deleteElements(elements);
      });
    }
  }

  pasteFromClipboard() {
    if (!this.clipboardService.hasContent()) return;

    const pastedElements = this.clipboardService.paste();
    if (pastedElements.length > 0) {
      this.addElements(pastedElements);
    }
  }

  duplicateSelected() {
    const selected = this.selectionManager.getSelected();
    if (selected.length > 0) {
      const duplicated = this.clipboardService.duplicate(selected);
      this.addElements(duplicated);
    }
  }

  deleteSelected() {
    const selected = this.selectionManager.getSelected();
    if (selected.length > 0) {
      this.deleteElements(selected);
    }
  }

  nudgeSelected(dx, dy, options = {}) {
    const selected = this.selectionManager.getSelected();
    if (selected.length === 0) return;

    const { snap = false } = options;
    const grid = this.gridSnapService.getGridPercent(this.view.getStageElements().stage);
    
    let deltaX = dx;
    let deltaY = dy;
    
    if (snap && (grid.x > 0 || grid.y > 0)) {
      deltaX = dx * (grid.x || 1);
      deltaY = dy * (grid.y || 1);
    }

    this.moveElements(selected, deltaX, deltaY);
  }

  // === Command Operations ===

  addElements(elements) {
    const { AddElementsCommand } = require('../commands/element-commands.js');
    const command = new AddElementsCommand(this, elements, 'Aggiungi elementi');
    this.commandManager.executeCommand(command);
  }

  deleteElements(elements) {
    const { DeleteElementsCommand } = require('../commands/element-commands.js');
    const command = new DeleteElementsCommand(this, elements, 'Elimina elementi');
    this.commandManager.executeCommand(command);
  }

  moveElements(elements, deltaX, deltaY) {
    const { MoveElementsCommand } = require('../commands/element-commands.js');
    const command = new MoveElementsCommand(this, elements, deltaX, deltaY, 'Sposta elementi');
    this.commandManager.executeCommand(command);
  }

  // === Step Operations ===

  loadStep(step) {
    if (!step) return;

    // Clear current elements
    this.elements.forEach(el => el.unmount());
    this.clearSelection();

    // Set step items as current elements
    step.items = step.items || [];
    
    // Mount step elements
    const canvas = this.view.getStageElements().canvas;
    step.items.forEach(element => {
      element.mount(canvas);
    });

    // Apply step settings
    this.metricsService.setOrientation(step.orient || 'landscape');
    this.backgroundService.setBackground(step.bgUrl || '');
    
    // Update view
    this.view.syncOrientationControls(step.orient || 'landscape');
  }

  // === Serialization ===

  serializeElement(element) {
    return this.serializationService.serializeElement(element);
  }

  deserializeElement(data) {
    return this.serializationService.deserializeElement(data);
  }

  // === Event Callbacks ===

  onElementChanged() {
    // Trigger thumbnail update for active step
    if (this.stepManager.activeStep) {
      this.stepManager.scheduleThumb(this.stepManager.activeStep);
    }
  }

  // === Cleanup ===

  destroy() {
    this.keyboardShortcuts?.setEnabled(false);
    this.view?.destroy();
    this.selectionManager?.removeAllListeners();
    this.isInitialized = false;
  }
}