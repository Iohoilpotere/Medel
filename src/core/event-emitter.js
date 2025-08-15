/**
 * Simple event emitter implementation
 */

export class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Add event listener
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.events[event]) return;
    
    const index = this.events[event].indexOf(callback);
    if (index >= 0) {
      this.events[event].splice(index, 1);
    }
  }

  /**
   * Emit event
   * @param {string} event
   * @param {...*} args
   */
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Add one-time event listener
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    const onceCallback = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    this.on(event, onceCallback);
  }

  /**
   * Remove all listeners for event
   * @param {string} [event] - If not provided, removes all listeners
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}