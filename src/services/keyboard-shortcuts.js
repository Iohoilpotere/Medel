/**
 * Keyboard shortcuts management
 */

export default class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.isEnabled = true;
    this.init();
  }

  /**
   * Initialize keyboard event listeners
   */
  init() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Register a keyboard shortcut
   * @param {string} key - Key combination (e.g., 'ctrl+z', 'delete', 'escape')
   * @param {Function} callback - Function to call
   * @param {Object} [options] - Options
   * @param {string} [options.description] - Description for help
   * @param {boolean} [options.preventDefault=true] - Prevent default behavior
   */
  register(key, callback, options = {}) {
    const normalizedKey = this.normalizeKey(key);
    this.shortcuts.set(normalizedKey, {
      callback,
      description: options.description || '',
      preventDefault: options.preventDefault !== false,
    });
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} key
   */
  unregister(key) {
    const normalizedKey = this.normalizeKey(key);
    this.shortcuts.delete(normalizedKey);
  }

  /**
   * Enable/disable keyboard shortcuts
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    if (!this.isEnabled) return;

    // Skip if typing in input fields
    if (this.isTypingInInput(event.target)) return;

    const key = this.getKeyFromEvent(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      if (shortcut.preventDefault) {
        event.preventDefault();
      }
      
      try {
        shortcut.callback(event);
      } catch (error) {
        console.error(`Error executing shortcut ${key}:`, error);
      }
    }
  }

  /**
   * Check if user is typing in an input field
   * @param {Element} target
   * @returns {boolean}
   */
  isTypingInInput(target) {
    if (!target) return false;
    
    const tagName = target.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];
    
    return inputTypes.includes(tagName) || 
           target.contentEditable === 'true' ||
           target.closest('[contenteditable="true"]');
  }

  /**
   * Get normalized key string from event
   * @param {KeyboardEvent} event
   * @returns {string}
   */
  getKeyFromEvent(event) {
    const parts = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    const key = event.key.toLowerCase();
    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Normalize key string
   * @param {string} key
   * @returns {string}
   */
  normalizeKey(key) {
    return key.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/cmd/g, 'ctrl')
      .replace(/command/g, 'ctrl')
      .replace(/option/g, 'alt');
  }

  /**
   * Get all registered shortcuts
   * @returns {Array<{key: string, description: string}>}
   */
  getShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, shortcut]) => ({
      key,
      description: shortcut.description,
    }));
  }

  /**
   * Register default editor shortcuts
   * @param {Object} handlers - Object with handler functions
   */
  registerDefaults(handlers) {
    // Undo/Redo
    this.register('ctrl+z', handlers.undo, { description: 'Annulla' });
    this.register('ctrl+shift+z', handlers.redo, { description: 'Ripeti' });
    this.register('ctrl+y', handlers.redo, { description: 'Ripeti' });

    // Copy/Paste
    this.register('ctrl+c', handlers.copy, { description: 'Copia' });
    this.register('ctrl+x', handlers.cut, { description: 'Taglia' });
    this.register('ctrl+v', handlers.paste, { description: 'Incolla' });
    this.register('ctrl+d', handlers.duplicate, { description: 'Duplica' });

    // Selection
    this.register('ctrl+a', handlers.selectAll, { description: 'Seleziona tutto' });
    this.register('escape', handlers.clearSelection, { description: 'Deseleziona' });

    // Delete
    this.register('delete', handlers.delete, { description: 'Elimina' });
    this.register('backspace', handlers.delete, { description: 'Elimina' });

    // Movement
    this.register('arrowleft', () => handlers.nudge(-1, 0), { description: 'Sposta sinistra' });
    this.register('arrowright', () => handlers.nudge(1, 0), { description: 'Sposta destra' });
    this.register('arrowup', () => handlers.nudge(0, -1), { description: 'Sposta su' });
    this.register('arrowdown', () => handlers.nudge(0, 1), { description: 'Sposta giù' });

    // Movement with snap
    this.register('shift+arrowleft', () => handlers.nudge(-1, 0, { snap: true }), { description: 'Sposta sinistra (snap)' });
    this.register('shift+arrowright', () => handlers.nudge(1, 0, { snap: true }), { description: 'Sposta destra (snap)' });
    this.register('shift+arrowup', () => handlers.nudge(0, -1, { snap: true }), { description: 'Sposta su (snap)' });
    this.register('shift+arrowdown', () => handlers.nudge(0, 1, { snap: true }), { description: 'Sposta giù (snap)' });
  }
}