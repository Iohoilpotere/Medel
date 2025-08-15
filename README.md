# Medel Editor v2.6.1 - Modular Architecture

A modern, modular visual editor for creating interactive medical case studies with SOLID principles, comprehensive theming, and extensible architecture.

## 🏗️ Architecture Overview

The editor follows SOLID principles with a clean separation of concerns:

### Core Architecture

```
src/
├── editor/                 # Main application orchestration
│   ├── editor-app.js      # Composition root (DI container)
│   ├── editor-view.js     # DOM interactions & UI updates
│   ├── editor.js          # Legacy wrapper (deprecated)
│   ├── element-registry.js # Element type management
│   └── exporter.js        # HTML export functionality
├── services/              # Business logic services
│   ├── selection-manager.js
│   ├── grid-snap-service.js
│   ├── zoom-controller.js
│   ├── clipboard-service.js
│   ├── keyboard-shortcuts.js
│   ├── drag-marquee-controller.js
│   ├── panel-resizer.js
│   ├── serialization-service.js
│   ├── background-service.js
│   └── metrics-service.js
├── commands/              # Command pattern (undo/redo)
├── elements/              # Element implementations
├── ui/                    # UI components & themes
├── core/                  # Shared utilities & interfaces
├── config/                # Configuration & constants
└── styles/                # Modular CSS
```

### Key Principles Applied

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: New elements/themes/behaviors can be added without modifying existing code
- **Liskov Substitution**: Element subclasses are safely interchangeable
- **Interface Segregation**: Minimal, focused contracts
- **Dependency Inversion**: Depends on abstractions, not concretions

## 🎨 Theming System

The editor uses a token-based theming system with CSS custom properties:

### Theme Structure
```css
/* tokens.css - Design system tokens */
:root {
  --space-sm: 8px;
  --color-primary: #0d6efd;
  /* ... */
}

/* theme-dark.css - Dark theme overrides */
[data-theme="dark"] {
  --color-bg: #0e0f13;
  --color-fg: #e9ecef;
  /* ... */
}
```

### Adding a New Theme

1. Create `src/styles/theme-{name}.css`
2. Define theme tokens following the pattern
3. Register in `src/ui/themes/theme-factory.js`:

```javascript
export class CustomTheme extends AbstractTheme {
  constructor() {
    super('custom', 'Custom Theme', {
      '--color-bg': '#your-color',
      // ... other tokens
    });
  }
}

// Register in ThemeFactory._themes
```

## 🧩 Adding New Elements

### 1. Create Element Class

```javascript
// src/elements/MyElement.js
import BaseElement from '../core/base-element.js';

export default class MyElement extends BaseElement {
  constructor() {
    super('my-element', 10, 10, 30, 20);
    this.myProperty = 'default value';
  }

  createDom() {
    const el = document.createElement('div');
    el.className = 'el el-my-element';
    el.innerHTML = `<div class="content">${this.myProperty}</div>`;
    this.dom = el;
    return el;
  }

  getPropSchema() {
    return [
      ...super.getPropSchema(),
      {
        section: 'Content',
        key: 'myProperty',
        label: 'My Property',
        type: 'text'
      }
    ];
  }

  readProps() {
    super.readProps();
    if (this.dom) {
      this.dom.querySelector('.content').textContent = this.myProperty;
    }
  }
}
```

### 2. Register Element

```javascript
// In src/editor/element-registry.js init() method
{
  type: 'my-element',
  module: () => import('../elements/MyElement.js'),
  label: 'My Element',
  icon: '🔧'
}
```

### 3. Add Styles (Optional)

```css
/* src/styles/elements.css */
.el-my-element .content {
  /* Your element-specific styles */
}
```

## 🎛️ Property Panel System

The property panel uses a declarative schema system:

### Property Types

- `text`, `textarea` - Text inputs
- `number`, `range` - Numeric inputs
- `checkbox` - Boolean toggle
- `select` - Dropdown selection
- `color`, `color-alpha` - Color pickers
- `url` - URL input with validation

### Grouping & Sections

```javascript
getPropSchema() {
  return [
    // Ungrouped property
    { key: 'title', label: 'Title', type: 'text' },
    
    // Sectioned properties
    { section: 'Layout', key: 'x', label: 'X Position', type: 'number' },
    
    // Grouped properties (inline)
    { section: 'Size', group: 'dimensions', key: 'width', label: 'W', type: 'number' },
    { section: 'Size', group: 'dimensions', key: 'height', label: 'H', type: 'number' },
    
    // Nested properties (dot notation)
    { key: 'style.fontSize', label: 'Font Size', type: 'number' }
  ];
}
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Modern browser with ES2022 support

### Installation
```bash
npm install
```

### Development
```bash
npm run dev          # Start dev server
npm run test         # Run tests
npm run test:watch   # Watch mode tests
npm run lint         # Lint code
npm run format       # Format code
npm run quality      # Run all quality checks
```

### Building
```bash
npm run build        # Production build
npm run preview      # Preview build
```

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Core utilities, commands, serialization
- **Integration Tests**: Element interactions, property updates
- **E2E Tests**: Complete user workflows (planned)

### Running Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test -- --coverage # With coverage
```

## 📁 File Organization

### Core Utilities (`src/core/utils/`)
- `dom.js` - DOM manipulation helpers
- `math.js` - Mathematical utilities (clamp, snap, conversions)
- `object.js` - Object manipulation (deep get/set, cloning)
- `color.js` - Color parsing and manipulation
- `validation.js` - Input validation helpers

### Services (`src/services/`)
Each service has a single responsibility:
- **SelectionManager**: Element selection state
- **GridSnapService**: Grid and snapping functionality
- **ClipboardService**: Copy/paste operations
- **KeyboardShortcuts**: Keyboard interaction handling
- **MetricsService**: Stage sizing and layout

### Commands (`src/commands/`)
Implements Command pattern for undo/redo:
- **BaseCommand**: Abstract command class
- **ElementCommands**: Add, delete, move, resize elements
- **StepCommands**: Step and category management
- **CommandManager**: History and execution

## 🎯 Performance Considerations

- **Lazy Loading**: Heavy modules loaded on demand
- **Debounced Operations**: Thumbnail rendering, property updates
- **CSS Containment**: Layout containment for better performance
- **Transition Management**: Disabled during interactions
- **Memory Management**: Proper cleanup and event listener removal

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📝 Contributing

1. Follow SOLID principles
2. Add tests for new functionality
3. Update documentation
4. Use semantic commit messages
5. Ensure all quality checks pass

### Code Style
- ESLint + Prettier configuration
- 2-space indentation
- Semicolons required
- Single quotes for strings

## 🔄 Migration Guide

### From Legacy Editor
The old monolithic `Editor` class has been decomposed. Update imports:

```javascript
// Old
import Editor from './editor/editor.js';

// New
import EditorApp from './editor/editor-app.js';
```

### Breaking Changes
- `Editor.instance` → `window.editorInstance` (temporary compatibility)
- Direct DOM access → Use services and view layer
- Inline styles → CSS classes with theme tokens

## 📚 API Reference

### EditorApp
Main application class that orchestrates all services.

```javascript
const editor = new EditorApp();
await editor.init();

// Access services
editor.selectionManager.selectOnly(element);
editor.gridSnapService.setGridSize(16);
editor.commandManager.executeCommand(command);
```

### Element Base Class
```javascript
class MyElement extends BaseElement {
  constructor() { /* ... */ }
  createDom() { /* Return HTMLElement */ }
  getPropSchema() { /* Return property definitions */ }
  readProps() { /* Update DOM from properties */ }
  toJSON() { /* Serialize state */ }
}
```

### Command Pattern
```javascript
class MyCommand extends BaseCommand {
  execute() { /* Perform action */ }
  undo() { /* Reverse action */ }
  canMergeWith(other) { /* Optional: merge similar commands */ }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Elements not rendering**: Check element registration in `ElementRegistry`
2. **Themes not applying**: Verify CSS custom properties and theme class
3. **Commands not working**: Ensure proper command manager initialization
4. **Performance issues**: Check for memory leaks and excessive DOM updates

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('medel-debug', 'true');
```

## 📄 License

MIT License - see LICENSE file for details.

---

For more detailed documentation, see the individual module README files and inline JSDoc comments.