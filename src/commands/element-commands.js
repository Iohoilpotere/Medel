import BaseCommand from './base-command.js';
import { getByPath, setByPath } from '../core/utils.js';

/**
 * Command for adding an element to the canvas
 */
export class AddElementCommand extends BaseCommand {
  constructor(editorApp, element, description = 'Aggiungi elemento') {
    super(editorApp, description);
    this.element = element;
  }

  execute() {
    const canvas = this.editor.view?.getStageElements()?.canvas;
    if (!canvas) return;
    
    if (!this.editor.elements.includes(this.element)) {
      this.element.mount(canvas);
      this.editor.elements.push(this.element);
      this.editor.selectOnly(this.element);
      this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
    }
  }

  undo() {
    this.element.unmount();
    if (this.editor.stepManager?.activeStep) {
      this.editor.stepManager.activeStep.items = this.editor.stepManager.activeStep.items.filter(e => e !== this.element);
    }
    this.editor.selectionManager?.clearSelection();
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }
}

export class AddElementsCommand extends BaseCommand {
  constructor(editorApp, elements, description = 'Aggiungi elementi') {
    super(editorApp, description);
    this.elements = [...elements];              // copia difensiva
  }

  execute() {
    const canvas = this.editor.view?.getStageElements()?.canvas;
    if (!canvas) return;
    
    // porta i nuovi elementi sopra agli altri (z alto)
    const maxZ = Math.max(0, ...this.editor.elements.map(e => e.z | 0));
    this.elements.forEach((el, i) => {
      el.z = Math.max(el.z | 0, maxZ + 1 + i);
      el.mount(canvas);
      if (this.editor.stepManager?.activeStep) {
        this.editor.stepManager.activeStep.items.push(el);
      }
      el.setSelected(false);
    });

    // seleziona incollati
    this.editor.selectionManager?.clearSelection();
    this.elements.forEach(el => this.editor.selectionManager?.addToSelection(el));
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }

  undo() {
    this.elements.forEach(el => {
      el.unmount();
      if (this.editor.stepManager?.activeStep) {
        this.editor.stepManager.activeStep.items = this.editor.stepManager.activeStep.items.filter(e => e !== el);
      }
    });
    this.editor.selectionManager?.clearSelection();
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }

  canMergeWith() { return false; }
  mergeWith() { return this; }
}

/**
 * Command for deleting elements from the canvas
 */
export class DeleteElementsCommand extends BaseCommand {
  constructor(editorApp, elements, description = 'Elimina elementi') {
    super(editorApp, description);
    this.elements = [...elements]; // Copy array
    this.elementData = this.elements.map(el => {
      const items = this.editor.stepManager?.activeStep?.items || [];
      return {
        element: el,
        index: items.indexOf(el)
      };
    });
  }

  execute() {
    this.elements.forEach(element => {
      element.unmount();
      if (this.editor.stepManager?.activeStep) {
        this.editor.stepManager.activeStep.items = this.editor.stepManager.activeStep.items.filter(e => e !== element);
      }
    });
    this.editor.selectionManager?.clearSelection();
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }

  undo() {
    const canvas = this.editor.view?.getStageElements()?.canvas;
    if (!canvas) return;
    
    this.elementData.forEach(({ element, index }) => {
      element.mount(canvas);
      // Insert at original position
      if (this.editor.stepManager?.activeStep) {
        this.editor.stepManager.activeStep.items.splice(index, 0, element);
      }
    });
    
    this.elements.forEach(el => el.setSelected(true));
    this.elements.forEach(el => this.editor.selectionManager?.addToSelection(el));
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }
}

/**
 * Command for moving elements
 */
export class MoveElementsCommand extends BaseCommand {
  constructor(editorApp, elements, deltaX, deltaY, description = 'Sposta elementi') {
    super(editorApp, description);
    this.elements = [...elements];
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.originalPositions = this.elements.map(el => ({ x: el.x, y: el.y }));
  }

  execute() {
    this.elements.forEach(element => {
      element.x += this.deltaX;
      element.y += this.deltaY;
      element.applyTransform();
    });
    this.editor.view?.updateSelectionUI?.(this.elements);
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }

  undo() {
    this.elements.forEach((element, index) => {
      const original = this.originalPositions[index];
      element.x = original.x;
      element.y = original.y;
      element.applyTransform();
    });
    this.editor.view?.updateSelectionUI?.(this.elements);
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }

  canMergeWith(otherCommand) {
    if (!(otherCommand instanceof MoveElementsCommand)) return false;
    if (this.elements.length !== otherCommand.elements.length) return false;

    // Check if same elements
    return this.elements.every(el => otherCommand.elements.includes(el));
  }

  mergeWith(otherCommand) {
    // Combine the deltas
    this.deltaX += otherCommand.deltaX;
    this.deltaY += otherCommand.deltaY;
    this.timestamp = otherCommand.timestamp;
    return this;
  }
}

/**
 * Command for resizing elements
 */
export class ResizeElementsCommand extends BaseCommand {
  constructor(editorApp, elements, newBounds, description = 'Ridimensiona elementi') {
    super(editorApp, description);
    this.elements = [...elements];
    this.originalBounds = this.elements.map(el => ({
      x: el.x, y: el.y, w: el.w, h: el.h
    }));
    this.newBounds = newBounds;
  }

  execute() {
    this.elements.forEach((element, index) => {
      const bounds = this.newBounds[index];
      Object.assign(element, bounds);
      element.applyTransform();
    });
    this.editor.view?.updateSelectionUI?.(this.elements);
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }

  undo() {
    this.elements.forEach((element, index) => {
      const bounds = this.originalBounds[index];
      Object.assign(element, bounds);
      element.applyTransform();
    });
    this.editor.view?.updateSelectionUI?.(this.elements);
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }
}

/**
 * Command for changing element properties
 */
export class ChangePropertyCommand extends BaseCommand {
  constructor(editorApp, element, property, newValue, oldValue, description = 'Modifica proprietà') {
    super(editorApp, description);
    this.element = element;
    this.property = property; // può essere "x" oppure "style.fontSize" ecc.
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  #isTransformKey(k) {
    return ['x', 'y', 'w', 'h', 'z', 'rotation'].includes(k);
  }

  execute() {
    this.#applyValue(this.newValue);
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }

  undo() {
    this.#applyValue(this.oldValue);
    this.editor.view?.updateSelectionUI?.([this.element]);
    this.editor.stepManager?.scheduleThumb(this.editor.stepManager?.activeStep);
  }

  #applyValue(value) {
    const { setByPath } = require('../core/utils/index.js');
    const isNested = this.property.includes('.');
    if (isNested) {
      setByPath(this.element, this.property, value);
      this.element.readProps?.();
    } else {
      this.element[this.property] = value;
      if (this.#isTransformKey(this.property)) {
        this.element.applyTransform();
      } else {
        this.element.readProps?.();
      }
    }
  }

  canMergeWith(otherCommand) {
    if (!(otherCommand instanceof ChangePropertyCommand)) return false;
    return this.element === otherCommand.element && this.property === otherCommand.property;
  }

  mergeWith(otherCommand) {
    this.newValue = otherCommand.newValue;
    this.timestamp = otherCommand.timestamp;
    return this;
  }
}