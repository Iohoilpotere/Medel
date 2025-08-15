/**
 * Legacy Editor - Deprecated
 * This file has been decomposed into EditorApp and supporting services.
 * @deprecated Use EditorApp instead
 */

import EditorApp from './editor-app.js';

// Backward compatibility wrapper
export default class Editor extends EditorApp {
  constructor() {
    super();
    console.warn('Editor class is deprecated. Use EditorApp instead.');
  }

  // Legacy static method
  static uid(prefix) {
    return EditorApp.uid(prefix);
  }

  // Legacy instance property for backward compatibility
  static get instance() {
    return window.editorInstance;
  }

  static set instance(value) {
    window.editorInstance = value;
  }
}