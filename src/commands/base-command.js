/**
 * Base class for all commands in the editor
 * Implements the Command pattern with undo/redo functionality
 */
export default class BaseCommand {
  constructor(editor, description = 'Unknown Action') {
    this.editor = editor;
    this.description = description;
    this.timestamp = Date.now();
  }

  /**
   * Execute the command
   * Must be implemented by subclasses
   */
  execute() {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Undo the command
   * Must be implemented by subclasses
   */
  undo() {
    throw new Error('undo() must be implemented by subclass');
  }

  /**
   * Check if this command can be merged with another command
   * Used for grouping similar operations (like multiple nudges)
   */
  canMergeWith(otherCommand) {
    return false;
  }

  /**
   * Merge this command with another command
   * Used for grouping similar operations
   */
  mergeWith(otherCommand) {
    // Default implementation does nothing
    return this;
  }
}