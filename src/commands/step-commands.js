import BaseCommand from './base-command.js';

/**
 * Command for adding a new step
 */
export class AddStepCommand extends BaseCommand {
  constructor(editorApp, category, step, description = 'Aggiungi step') {
    super(editorApp, description);
    this.category = category;
    this.step = step;
  }

  execute() {
    if (!this.category.steps.includes(this.step)) {
      this.category.steps.push(this.step);
      this.editor.stepManager?.render();
    }
  }

  undo() {
    const index = this.category.steps.indexOf(this.step);
    if (index >= 0) {
      this.category.steps.splice(index, 1);

      // If this was the active step, switch to another one
      if (this.editor.stepManager?.activeStep?.id === this.step.id) {
        const nextStep = this.category.steps[index] ||
          this.category.steps[index - 1] ||
          this.editor.stepManager?.categories.find(c => c.steps.length)?.steps[0];

        if (nextStep) {
          this.editor.stepManager?.setActive(nextStep);
        } else {
          if (this.editor.stepManager) {
            this.editor.stepManager.activeStep = null;
          }
          this.editor.elements?.forEach(e => e.unmount());
          this.editor.selectionManager?.clearSelection();
        }
      }

      this.editor.stepManager?.render();
    }
  }
}

/**
 * Command for deleting a step
 */
export class DeleteStepCommand extends BaseCommand {
  constructor(editorApp, category, step, description = 'Elimina step') {
    super(editorApp, description);
    this.category = category;
    this.step = step;
    this.stepIndex = category.steps.indexOf(step);
    this.wasActive = editorApp.stepManager?.activeStep?.id === step.id;
  }

  execute() {
    const index = this.category.steps.indexOf(this.step);
    if (index >= 0) {
      this.category.steps.splice(index, 1);

      if (this.wasActive) {
        const nextStep = this.category.steps[index] ||
          this.category.steps[index - 1] ||
          this.editor.stepManager?.categories.find(c => c.steps.length)?.steps[0];

        if (nextStep) {
          this.editor.stepManager?.setActive(nextStep);
        } else {
          if (this.editor.stepManager) {
            this.editor.stepManager.activeStep = null;
          }
          this.editor.elements?.forEach(e => e.unmount());
          this.editor.selectionManager?.clearSelection();
        }
      }

      this.editor.stepManager?.render();
    }
  }

  undo() {
    this.category.steps.splice(this.stepIndex, 0, this.step);

    if (this.wasActive) {
      this.editor.stepManager?.setActive(this.step);
    }

    this.editor.stepManager?.render();
  }
}

/**
 * Command for changing step properties
 */
export class ChangeStepPropertyCommand extends BaseCommand {
  constructor(editorApp, step, property, newValue, oldValue, description = 'Modifica step') {
    super(editorApp, description);
    this.step = step;
    this.property = property;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  execute() {
    this.step[this.property] = this.newValue;

    if (this.property === 'orient' && this.editor.stepManager?.activeStep?.id === this.step.id) {
      this.editor.metricsService?.setOrientation(this.newValue);
      this.editor.view?.syncOrientationControls(this.newValue);
    }

    if (this.property === 'bgUrl' && this.editor.stepManager?.activeStep?.id === this.step.id) {
      this.editor.backgroundService?.setBackground(this.newValue);
    }

    this.editor.stepManager?.render();
    this.editor.stepManager?.scheduleThumb(this.step);
  }

  undo() {
    this.step[this.property] = this.oldValue;

    if (this.property === 'orient' && this.editor.stepManager?.activeStep?.id === this.step.id) {
      this.editor.metricsService?.setOrientation(this.oldValue);
      this.editor.view?.syncOrientationControls(this.oldValue);
    }

    if (this.property === 'bgUrl' && this.editor.stepManager?.activeStep?.id === this.step.id) {
      this.editor.backgroundService?.setBackground(this.oldValue);
    }

    this.editor.stepManager?.render();
    this.editor.stepManager?.scheduleThumb(this.step);
  }

  canMergeWith(otherCommand) {
    if (!(otherCommand instanceof ChangeStepPropertyCommand)) return false;
    return this.step === otherCommand.step &&
      this.property === otherCommand.property;
  }

  mergeWith(otherCommand) {
    this.newValue = otherCommand.newValue;
    this.timestamp = otherCommand.timestamp;
    return this;
  }
}

/**
 * Command for adding a new category
 */
export class AddCategoryCommand extends BaseCommand {
  constructor(editorApp, category, description = 'Aggiungi categoria') {
    super(editorApp, description);
    this.category = category;
  }

  execute() {
    if (!this.editor.stepManager?.categories.includes(this.category)) {
      this.editor.stepManager?.categories.push(this.category);
      this.editor.stepManager?.render();
    }
  }

  undo() {
    const index = this.editor.stepManager?.categories.indexOf(this.category);
    if (index >= 0) {
      this.editor.stepManager?.categories.splice(index, 1);
      this.editor.stepManager?.render();
    }
  }
}