import EditorApp from './editor/editor-app.js';
import { runTests } from './tests/dev-tests.js';
import { ThemeFactory } from './ui/themes/theme-factory.js';
ThemeFactory.init(); // applica l'ultimo scelto o 'dark'


window.addEventListener('DOMContentLoaded', () => {
  const editor = new EditorApp();
  window.editorInstance = editor; // For backward compatibility
  
  editor.init().then(() => {
    setTimeout(() => runTests(editor), 100);
  }).catch(error => {
    console.error('Failed to initialize editor:', error);
  });
});