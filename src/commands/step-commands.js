import BaseCommand from './base-command.js';

/**
 * Command for adding a new step
 */
export class AddStepCommand extends BaseCommand {
  constructor(editor, category, step, description = 'Aggiungi step') {
    super(editor, description);
    this.category = category;
    this.step = step;
  }

  execute() {
    if (!this.category.steps.includes(this.step)) {
      this.category.steps.push(this.step);
      this.editor.stepMgr.render();
    }
  }

  undo() {
    const index = this.category.steps.indexOf(this.step);
    if (index >= 0) {
      this.category.steps.splice(index, 1);
      
      // If this was the active step, switch to another one
      if (this.editor.stepMgr.activeStep?.id === this.step.id) {
        const nextStep = this.category.steps[index] || 
                        this.category.steps[index - 1] || 
                        this.editor.stepMgr.categories.find(c => c.steps.length)?.steps[0];
        
        if (nextStep) {
          this.editor.stepMgr.setActive(nextStep);
        } else {
          this.editor.stepMgr.activeStep = null;
          this.editor.elements.forEach(e => e.unmount());
          this.editor.clearSelection();
        }
      }
      
      this.editor.stepMgr.render();
    }
  }
}

/**
 * Command for deleting a step
 */
export class DeleteStepCommand extends BaseCommand {
  constructor(editor, category, step, description = 'Elimina step') {
    super(editor, description);
    this.category = category;
    this.step = step;
    this.stepIndex = category.steps.indexOf(step);
    this.wasActive = editor.stepMgr.activeStep?.id === step.id;
  }

  execute() {
    const index = this.category.steps.indexOf(this.step);
    if (index >= 0) {
      this.category.steps.splice(index, 1);
      
      if (this.wasActive) {
        const nextStep = this.category.steps[index] || 
                        this.category.steps[index - 1] || 
                        this.editor.stepMgr.categories.find(c => c.steps.length)?.steps[0];
        
        if (nextStep) {
          this.editor.stepMgr.setActive(nextStep);
        } else {
          this.editor.stepMgr.activeStep = null;
          this.editor.elements.forEach(e => e.unmount());
          this.editor.clearSelection();
        }
      }
      
      this.editor.stepMgr.render();
    }
  }

  undo() {
    this.category.steps.splice(this.stepIndex, 0, this.step);
    
    if (this.wasActive) {
      this.editor.stepMgr.setActive(this.step);
    }
    
    this.editor.stepMgr.render();
  }
}

/**
 * Command for changing step properties
 */
export class ChangeStepPropertyCommand extends BaseCommand {
  constructor(editor, step, property, newValue, oldValue, description = 'Modifica step') {
    super(editor, description);
    this.step = step;
    this.property = property;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  execute() {
    this.step[this.property] = this.newValue;
    
    if (this.property === 'orient' && this.editor.stepMgr.activeStep?.id === this.step.id) {
      this.editor.changeOrientation(this.newValue);
    }
    
    if (this.property === 'bgUrl' && this.editor.stepMgr.activeStep?.id === this.step.id) {
      this.editor.setBackground(this.newValue);
    }
    
    this.editor.stepMgr.render();
    this.editor.stepMgr.scheduleThumb(this.step);
  }

  undo() {
    this.step[this.property] = this.oldValue;
    
    if (this.property === 'orient' && this.editor.stepMgr.activeStep?.id === this.step.id) {
      this.editor.changeOrientation(this.oldValue);
    }
    
    if (this.property === 'bgUrl' && this.editor.stepMgr.activeStep?.id === this.step.id) {
      this.editor.setBackground(this.oldValue);
    }
    
    this.editor.stepMgr.render();
    this.editor.stepMgr.scheduleThumb(this.step);
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
  constructor(editor, category, description = 'Aggiungi categoria') {
    super(editor, description);
    this.category = category;
  }

  execute() {
    if (!this.editor.stepMgr.categories.includes(this.category)) {
      this.editor.stepMgr.categories.push(this.category);
      this.editor.stepMgr.render();
    }
  }

  undo() {
    const index = this.editor.stepMgr.categories.indexOf(this.category);
    if (index >= 0) {
      this.editor.stepMgr.categories.splice(index, 1);
      this.editor.stepMgr.render();
    }
  }
}