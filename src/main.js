import Editor from './editor/editor.js';
import { runTests } from './tests/dev-tests.js';
import { ThemeFactory } from './ui/themes/theme-factory.js';
ThemeFactory.init(); // applica l'ultimo scelto o 'dark'


window.addEventListener('DOMContentLoaded', () => {
  const editor = new Editor();
  setTimeout(() => runTests(editor), 100);
});