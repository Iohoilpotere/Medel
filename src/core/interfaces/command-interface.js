/**
 * Command interfaces and contracts
 */

/**
 * @interface ICommand
 * Interface for command implementations
 */
export class ICommand {
  /**
   * Execute the command
   */
  execute() {
    throw new Error('execute must be implemented');
  }

  /**
   * Undo the command
   */
  undo() {
    throw new Error('undo must be implemented');
  }

  /**
   * Get command description
   * @returns {string}
   */
  getDescription() {
    throw new Error('getDescription must be implemented');
  }

  /**
   * Check if command can be merged with another
   * @param {ICommand} otherCommand
   * @returns {boolean}
   */
  canMergeWith(otherCommand) {
    return false;
  }

  /**
   * Merge with another command
   * @param {ICommand} otherCommand
   * @returns {ICommand}
   */
  mergeWith(otherCommand) {
    return this;
  }
}

/**
 * @interface ICommandManager
 * Interface for command management
 */
export class ICommandManager {
  /**
   * Execute command
   * @param {ICommand} command
   */
  executeCommand(command) {
    throw new Error('executeCommand must be implemented');
  }

  /**
   * Undo last command
   * @returns {boolean}
   */
  undo() {
    throw new Error('undo must be implemented');
  }

  /**
   * Redo next command
   * @returns {boolean}
   */
  redo() {
    throw new Error('redo must be implemented');
  }

  /**
   * Check if undo is possible
   * @returns {boolean}
   */
  canUndo() {
    throw new Error('canUndo must be implemented');
  }

  /**
   * Check if redo is possible
   * @returns {boolean}
   */
  canRedo() {
    throw new Error('canRedo must be implemented');
  }

  /**
   * Clear command history
   */
  clearHistory() {
    throw new Error('clearHistory must be implemented');
  }
}