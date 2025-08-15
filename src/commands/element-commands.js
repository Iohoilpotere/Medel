import BaseCommand from './base-command.js';
import { getByPath, setByPath } from '../core/utils.js';

/**
 * Command for adding an element to the canvas
 */
export class AddElementCommand extends BaseCommand {
  constructor(editor, element, description = 'Aggiungi elemento') {
    super(editor, description);
    this.element = element;
  }

  execute() {
    if (!this.editor.elements.includes(this.element)) {
      this.element.mount(this.editor.canvas);
      this.editor.elements.push(this.element);
      this.editor.selectOnly(this.element);
      this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
    }
  }

  undo() {
    this.element.unmount();
    this.editor.elements = this.editor.elements.filter(e => e !== this.element);
    this.editor.clearSelection();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }
}
export class AddElementsCommand extends BaseCommand {
  constructor(editor, elements, description = 'Aggiungi elementi') {
    super(editor, description);                 // ✅ chiamata a super PRIMA di usare this
    this.elements = [...elements];              // copia difensiva
  }

  execute() {
    // porta i nuovi elementi sopra agli altri (z alto)
    const maxZ = Math.max(0, ...this.editor.elements.map(e => e.z | 0));
    this.elements.forEach((el, i) => {
      el.z = Math.max(el.z | 0, maxZ + 1 + i);
      el.mount(this.editor.canvas);
      this.editor.elements.push(el);
      el.setSelected(false);
    });

    // seleziona incollati
    this.editor.clearSelection();
    this.elements.forEach(el => this.editor.selectInclude(el));
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }

  undo() {
    this.elements.forEach(el => {
      el.unmount();
      this.editor.elements = this.editor.elements.filter(e => e !== el);
    });
    this.editor.clearSelection();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }

  canMergeWith() { return false; }
  mergeWith() { return this; }
}

/**
 * Command for deleting elements from the canvas
 */
export class DeleteElementsCommand extends BaseCommand {
  constructor(editor, elements, description = 'Elimina elementi') {
    super(editor, description);
    this.elements = [...elements]; // Copy array
    this.elementData = this.elements.map(el => ({
      element: el,
      index: editor.elements.indexOf(el)
    }));
  }

  execute() {
    this.elements.forEach(element => {
      element.unmount();
      this.editor.elements = this.editor.elements.filter(e => e !== element);
    });
    this.editor.clearSelection();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }

  undo() {
    this.elementData.forEach(({ element, index }) => {
      element.mount(this.editor.canvas);
      // Insert at original position
      this.editor.elements.splice(index, 0, element);
    });
    this.editor.selected = [...this.elements];
    this.elements.forEach(el => el.setSelected(true));
    this.editor.renderPropPanel();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }
}

/**
 * Command for moving elements
 */
export class MoveElementsCommand extends BaseCommand {
  constructor(editor, elements, deltaX, deltaY, description = 'Sposta elementi') {
    super(editor, description);
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
    this.editor.reflectSelection();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }

  undo() {
    this.elements.forEach((element, index) => {
      const original = this.originalPositions[index];
      element.x = original.x;
      element.y = original.y;
      element.applyTransform();
    });
    this.editor.reflectSelection();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
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
  constructor(editor, elements, newBounds, description = 'Ridimensiona elementi') {
    super(editor, description);
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
    this.editor.reflectSelection();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }

  undo() {
    this.elements.forEach((element, index) => {
      const bounds = this.originalBounds[index];
      Object.assign(element, bounds);
      element.applyTransform();
    });
    this.editor.reflectSelection();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }
}

/**
 * Command for changing element properties
 */
export class ChangePropertyCommand extends BaseCommand {
  constructor(editor, element, property, newValue, oldValue, description = 'Modifica proprietà') {
    super(editor, description);
    this.element = element;
    this.property = property; // può essere "x" oppure "style.fontSize" ecc.
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  #isTransformKey(k) {
    return ['x', 'y', 'w', 'h', 'z', 'rotation'].includes(k);
  }

  execute() {
    const isNested = this.property.includes('.');
    if (isNested) {
      setByPath(this.element, this.property, this.newValue);
      this.element.readProps?.();
    } else {
      this.element[this.property] = this.newValue;
      if (this.#isTransformKey(this.property)) {
        this.element.applyTransform();
      } else {
        this.element.readProps?.();
      }
    }
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
  }

  undo() {
    const isNested = this.property.includes('.');
    if (isNested) {
      setByPath(this.element, this.property, this.oldValue);
      this.element.readProps?.();
    } else {
      this.element[this.property] = this.oldValue;
      if (this.#isTransformKey(this.property)) {
        this.element.applyTransform();
      } else {
        this.element.readProps?.();
      }
    }
    this.editor.reflectSelection();
    this.editor.stepMgr.scheduleThumb(this.editor.stepMgr.activeStep);
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