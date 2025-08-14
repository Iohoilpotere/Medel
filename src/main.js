import Editor from './editor/editor.js';
import { runTests } from './tests/dev-tests.js';
window.addEventListener('DOMContentLoaded', () => {
  const editor = new Editor();
  setTimeout(() => runTests(editor), 100);
});