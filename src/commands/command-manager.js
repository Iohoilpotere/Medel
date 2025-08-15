import { $ } from '../core/utils.js';

/**
 * Manages command history and provides undo/redo functionality
 */
export default class CommandManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = 100;
    this.mergingTimeWindow = 500; // ms - commands within this window can be merged

    this.initKeyboardShortcuts();
  }

  /**
   * Execute a command and add it to history
   */
  executeCommand(command) {
    try {
      // Execute the command
      command.execute();

      // Try to merge with the last command if possible
      if (this.canMergeWithLast(command)) {
        const lastCommand = this.history[this.currentIndex];
        const mergedCommand = lastCommand.mergeWith(command);
        this.history[this.currentIndex] = mergedCommand;
      } else {
        // Remove any commands after current index (when undoing then doing new action)
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add new command
        this.history.push(command);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
          this.history.shift();
          this.currentIndex--;
        }
      }

      this.updateUI();

    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  /**
   * Undo the last command
   */
  undo() {
    if (!this.canUndo()) return false;

    try {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;
      this.updateUI();
      return true;
    } catch (error) {
      console.error('Failed to undo command:', error);
      return false;
    }
  }

  /**
   * Redo the next command
   */
  redo() {
    if (!this.canRedo()) return false;

    try {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      command.execute();
      this.updateUI();
      return true;
    } catch (error) {
      console.error('Failed to redo command:', error);
      this.currentIndex--;
      return false;
    }
  }

  /**
   * Check if undo is possible
   */
  canUndo() {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Check if a command can be merged with the last command in history
   */
  canMergeWithLast(command) {
    if (this.currentIndex < 0) return false;

    const lastCommand = this.history[this.currentIndex];
    const timeDiff = command.timestamp - lastCommand.timestamp;

    return timeDiff <= this.mergingTimeWindow && lastCommand.canMergeWith(command);
  }

  /**
   * Clear command history
   */
  clearHistory() {
    this.history = [];
    this.currentIndex = -1;
    this.updateUI();
  }

  /**
   * Get current command description for UI
   */
  getCurrentCommandDescription() {
    if (this.currentIndex >= 0) {
      return this.history[this.currentIndex].description;
    }
    return null;
  }

  /**
   * Get next command description for UI
   */
  getNextCommandDescription() {
    if (this.canRedo()) {
      return this.history[this.currentIndex + 1].description;
    }
    return null;
  }

  /**
   * Initialize keyboard shortcuts for undo/redo
   */
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        this.redo();
      }

      // Ctrl+Y or Cmd+Y for redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        this.redo();
      }
    });
  }

  /**
   * Update UI elements to reflect current state
   */
  updateUI() {
    // Update toolbar buttons if they exist
    const undoBtn = $('#btnUndo');
    const redoBtn = $('#btnRedo');

    if (undoBtn) {
      undoBtn.disabled = !this.canUndo();
      const undoDesc = this.getCurrentCommandDescription();
      undoBtn.title = undoDesc ? `Annulla: ${undoDesc}` : 'Annulla';
    }

    if (redoBtn) {
      redoBtn.disabled = !this.canRedo();
      const redoDesc = this.getNextCommandDescription();
      redoBtn.title = redoDesc ? `Ripeti: ${redoDesc}` : 'Ripeti';
    }
  }
}